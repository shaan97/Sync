using System;
using System.Collections.Concurrent;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WebSocket4Net;
using SuperSocket.ClientEngine;

namespace Sync
{
    public class SyncServer
    {
        protected ConcurrentBag<int> ids;
        private SemaphoreSlim id_available;

        protected ConcurrentQueue<Tuple<Request, Callback>> requests;
        private SemaphoreSlim pending_requests;
        protected Callback[] callbacks;

        private WebSocket ws;
        private bool socket_opened;

        private Thread id_manager;
        private volatile bool exit;

        public event EventHandler<ResponseDecoder> SyncEvent;

        public SyncServer()
        {
            this.ws = new WebSocket("ws://192.168.1.226:8000/");
            this.socket_opened = false;

            this.ids = new ConcurrentBag<int> { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 };
            this.id_available = new SemaphoreSlim(16, 16);

            this.requests = new ConcurrentQueue<Tuple<Request, Callback>>();
            this.pending_requests = new SemaphoreSlim(0);
            this.callbacks = new Callback[16];

            this.ws.MessageReceived += this.HandleServerResponse;
            this.ws.Closed += (object s, EventArgs e) => { this.socket_opened = false; };
            this.ws.Error += (object s, ErrorEventArgs e) => { this.socket_opened = false; };

            this.exit = false;
            this.id_manager = new Thread(WorkerThreadDeScheduler);
            this.id_manager.Start();
        }

        ~SyncServer() {
            this.exit = true;

            // Guarantee that thread is awake to see new exit condition
            this.pending_requests.Release();
            this.id_available.Release();

            this.id_manager.Join();
            this.ws.Close();
        }

        public virtual void Send(Request data, Callback callback = null)
        {
            // Enqueue for worker thread to deal with
            this.requests.Enqueue(new Tuple<Request, Callback>(data, callback));
            this.pending_requests.Release();
        }

        protected virtual void HandleServerResponse(object sender, MessageReceivedEventArgs e) {
            ResponseDecoder response = new ResponseDecoder(e.Message);
            int request_id = (int)response["request_id"];
            var sync_event_id = response["sync_event_id"];
            if(request_id < 0 && sync_event_id == null) {
                return; 
            } else if(sync_event_id != null) { // sync_event_id and request_id are mutually exclusive due to established protocol
                SyncEvent.Invoke(sender, response);
                return;
            }

            Callback callback = this.callbacks[request_id];
            this.callbacks[request_id] = null;
            this.ids.Add(request_id);
            this.id_available.Release();
            if (callback == null)
                return;
            else if ((int)response["status"] == ResponseDecoder.Status["SUCCESS"]) {
                callback.OnSuccess(sender, response);    
            } else {
                callback.OnFailure(sender, response);
            }
        }

        private void WorkerThreadDeScheduler() {
            
            while (!this.exit) {
                // Wait on a pending request
                this.pending_requests.Wait();

                // Wait on an available ID for the pending request
                this.id_available.Wait();

                // If woken up to shut down, break
                if (this.exit)
                    break;

                if(!this.socket_opened) {
                    SemaphoreSlim connected = new SemaphoreSlim(0, 1);
                    EventHandler handle = (object sender, EventArgs e) => { connected.Release(); };

                    this.ws.Opened += handle;
                    this.ws.Open();
                    connected.Wait();
                    this.ws.Opened -= handle;

                    this.socket_opened = true;
                }
                
                
                // Keep trying until successful dequeue. Seems sensible that dequeue operation
                // should only fail a few times at most since multiple failures means multiple accesses
                // to the front. This should only happen once (upon another thread inserting) with fine
                // grained locking mechanisms. Needs testing nonetheless
                Tuple<Request, Callback> result;
                while (!this.requests.TryDequeue(out result)) ;

                // Thread only awoken if ID is available
                if (!ids.TryTake(out int id))
                    throw new Exception("ID not available");

                // Assign Request appropriate request_id
                result.Item1.request_id = id;

                // Register callback
                this.callbacks[id] = result.Item2;

                // Send Request
                this.ws.Send(result.Item1.ToString());
            }
        }
    }

    
}
