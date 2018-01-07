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
        // Collection of request_id for "address space" of requests. 
        private const int NUM_IDS = 16;
        protected ConcurrentBag<int> ids;
        private SemaphoreSlim id_available;

        // Queued requests waiting to be sent
        protected ConcurrentQueue<Tuple<Request, Callback>> requests;
        private SemaphoreSlim pending_requests;

        // Registered callbacks for a given active request
        protected Callback[] callbacks;

        // Web socket connection to server
        private WebSocket ws;
        private bool socket_opened;

        // Worker thread that sends pending requests when ID's are available
        private Thread id_manager;
        private volatile bool exit;

        // If SyncEvent received, all subscribers are notified
        public event EventHandler<ResponseDecoder> SyncEvent;

        public SyncServer()
        {
            // Configure server IP address
            this.ws = new WebSocket("ws://192.168.1.74:8000/");
            this.socket_opened = false;

            // Web socket events
            this.ws.MessageReceived += this.HandleServerResponse;
            this.ws.Closed += (object s, EventArgs e) => { this.socket_opened = false; };
            this.ws.Error += (object s, ErrorEventArgs e) => { this.socket_opened = false; };

            // Set up available ID's
            this.ids = new ConcurrentBag<int>();
            for (int i = 0; i < NUM_IDS; i++)
                this.ids.Add(i);
            this.id_available = new SemaphoreSlim(NUM_IDS, NUM_IDS);

            // Create queue for requests
            this.requests = new ConcurrentQueue<Tuple<Request, Callback>>();
            this.pending_requests = new SemaphoreSlim(0);

            // Create lookup table for callbacks
            this.callbacks = new Callback[NUM_IDS];

            // Launch worker thread for sending pending requests
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

            // Notify existence of pending request
            this.pending_requests.Release();
        }

        protected virtual void HandleServerResponse(object sender, MessageReceivedEventArgs e) {
            System.Diagnostics.Debug.WriteLine($"Received Message:\n{e.Message}");

            // Decode message
            ResponseDecoder response = new ResponseDecoder(e.Message);
            var sync_event_id = response["sync_message"];

            // Only deal with responses to requests; Drop or Forward elsewhere otherwise
            if(response["request_id"] != null && (int)response["request_id"] < 0 && sync_event_id == null) {
                // Drop useless packet (invalid request_id and no sync_event_id)
                return; 
            } else if(sync_event_id != null) {
                // This is a sync event. Forward to subscribers and exit
                SyncEvent.Invoke(sender, response);
                return;
            } else if(response["request_id"] == null) {
                return;
            }

            int request_id = (int)response["request_id"];
            System.Diagnostics.Debug.WriteLine($"Received request_id {request_id}");

            // Get callback and remove from table
            Callback callback = this.callbacks[request_id];
            this.callbacks[request_id] = null;

            // Make request ID now available to other requests
            this.ids.Add(request_id);
            this.id_available.Release();

            // Invoke appropriate callback based on status
            if (callback == null)
                return;
            else if ((int)response["status"] == ResponseDecoder.Status["SUCCESS"] || (int)response["status"] == ResponseDecoder.Status["PENDING"]) {
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

                System.Diagnostics.Debug.WriteLine($"Sending following message:\n{result.Item1.ToString()}");

                // Send Request
                this.ws.Send(result.Item1.ToString());
            }
        }
    }

    
}
