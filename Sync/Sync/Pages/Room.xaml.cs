using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Xamarin.Forms;
using Xamarin.Forms.Xaml;
using System.Timers;

namespace Sync
{
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class Room : TabbedPage
    {
        public string username { get; set; }
        public static SyncServer sync;

        private ConcurrentDictionary<string, byte> members;

        private ConcurrentDictionary<string, int> pending_sync_events;

        private IMusicPlayer _player;
        public IMusicPlayer player {
            get { return _player; }
            set {
                if (this._player != null && this._player.IsLoggedIn())
                    this._player.Logout(); // What if this fails?
                this._player = value;
            }
        }

        public Room(SyncServer x, string username, IMusicPlayer player) {
            sync = x;
            sync.SyncEvent += HandleSyncEvent;
            this.username = username;
            this.player = new SimplePlayer();
            this.members = new ConcurrentDictionary<string, byte>();
            this.members.GetOrAdd(this.username, 0);
            this.pending_sync_events = new ConcurrentDictionary<string, int>();

            InitializeComponent();
        }

        public void Play(object sender, EventArgs args) {
            var request = new Request() {
                RequestType = "PLAY"
            };
            sync.Send(request, new Callback((a, b) => { System.Diagnostics.Debug.WriteLine("Success!"); },
                                            (a, b) => { System.Diagnostics.Debug.WriteLine("Success!"); }));
        }

        public void Pause(object sender, EventArgs args) {
            var request = new Request() {
                RequestType = "PAUSE"
            };
            sync.Send(request, new Callback((a, b) => { System.Diagnostics.Debug.WriteLine("Success!"); },
                                            (a, b) => { System.Diagnostics.Debug.WriteLine("Success!"); }));
        }

        public void HandleSyncEvent(object sender, ResponseDecoder message) {
            System.Diagnostics.Debug.WriteLine("Handling message that is possibly a sync event.");
            if (message["status"] == null) {
                System.Diagnostics.Debug.WriteLine("No status.");
                return;
            }
            var status = (int)message["status"];
            if (message["sync_message"] == null) {
                System.Diagnostics.Debug.WriteLine("No sync_message.");
                return;
            }
            if (message["sync_message"]["sync_event_id"] == null) {
                System.Diagnostics.Debug.WriteLine("No sync_event_id in sync_message");
                return;
            }

            var sync_event_id = (string)message["sync_message"]["sync_event_id"];

            System.Diagnostics.Debug.WriteLine($"Received Sync Event with status {status} and ID {sync_event_id}.");

            if (status == ResponseDecoder.Status["CAN_COMMIT"]) {
                System.Diagnostics.Debug.WriteLine("Sync Event is a CAN_COMMIT. Adding to pending_sync_events.");
                // First Phase
                this.pending_sync_events.GetOrAdd(sync_event_id, status);

                Request request = new Request {
                    RequestType = "CAN_COMMIT",
                    sync_event_id = sync_event_id
                };
                sync.Send(request);

                // Timeout causes abort
                Timer timer = new Timer(5000) {
                    AutoReset = false
                };
                timer.Elapsed += (s, e) => {
                    System.Diagnostics.Debug.WriteLine("Timer expired. Attempting to abort commit.");
                    // Set phase to aborted (which claims it as canceled to any other active thread), and then remove
                    if (this.pending_sync_events.TryUpdate(sync_event_id, ResponseDecoder.Status["ABORT_COMMIT"], status)) {
                        System.Diagnostics.Debug.WriteLine("Commit labeled aborted. Removing from pending_sync_events.");
                        while (this.pending_sync_events.TryRemove(sync_event_id, out int _)) ;
                        System.Diagnostics.Debug.WriteLine("Removed commit from pending_sync_events");
                    } else {
                        System.Diagnostics.Debug.WriteLine("Unable to abort.");
                    }
                };
                timer.Start();
            }/*
            else if (status == ResponseDecoder.Status["PRE_COMMIT"]) {
                // Second Phase of 3PC
                System.Diagnostics.Debug.WriteLine("Sync Event is a PRE_COMMIT. Adding to pending_sync_events.");

                if (!this.pending_sync_events.TryUpdate(sync_event_id, status, ResponseDecoder.Status["CAN_COMMIT"])) {
                    // Either timer expired or protocol failure. Either way, drop packet
                    System.Diagnostics.Debug.WriteLine("Either event never registered, it was unregistered, or out of order phase commit." +
                        " Dropping packet.");
                    return;
                }

                Request request = new Request {
                    RequestType = "PRE_COMMIT",
                    sync_event_id = sync_event_id
                };
                sync.Send(request);

                // Timeout causes commit. TryRemove guarantees synchronization in case commit event occurs at timeout
                Timer timer = new Timer(5000);
                message["status"] = ResponseDecoder.Status["COMMIT"];
                timer.Elapsed += (s, e) => {
                    System.Diagnostics.Debug.WriteLine("Timer expired, moving to COMMIT phase.");
                    HandleSyncEvent(sender, message);
                };
            }*/
            else if (status == ResponseDecoder.Status["COMMIT"]) {
                // Third Phase of 3PC
                System.Diagnostics.Debug.WriteLine("Sync Event is a COMMIT.");

                if (this.pending_sync_events.TryRemove(sync_event_id, out int last_phase) && SyncCommit(message)) {
                    System.Diagnostics.Debug.WriteLine($"Removed sync_event_id {sync_event_id} with last phase {last_phase}.");
                    Request request = new Request {
                        RequestType = "COMMIT",
                        sync_event_id = sync_event_id
                    };
                    sync.Send(request);
                }
                else {
                    System.Diagnostics.Debug.WriteLine("Either removing the event from pending_sync_events failed or the commit itself failed. Dropping packet.");
                }
            }
            else if (status == ResponseDecoder.Status["ABORT_COMMIT"]) {
                // Abort 3PC
                System.Diagnostics.Debug.WriteLine("Sync Event is a ABORT_COMMIT.");

                if (this.pending_sync_events.TryRemove(sync_event_id, out int last_phase)) {
                    System.Diagnostics.Debug.WriteLine($"Removed sync_event_id {sync_event_id} with last phase {last_phase}.");
                }
                else {
                    System.Diagnostics.Debug.WriteLine($"Unable to remove sync_event_id {sync_event_id}.");
                }
                System.Diagnostics.Debug.WriteLine($"Sync event {sync_event_id} no longer registered");
            }
            else {
                // Drop
            }
        }

        private bool SyncCommit(ResponseDecoder message) {

            System.Diagnostics.Debug.WriteLine("Attempting COMMIT...");

            // Make sure expected fields are available
            if (message["sync_message"] == null) {
                System.Diagnostics.Debug.WriteLine("sync_message was null");
                return false;
            } else if (message["sync_message"]["message"] == null) {
                System.Diagnostics.Debug.WriteLine("message was null");
                return false;
            } else if(message["utc_time"] == null) {
                System.Diagnostics.Debug.WriteLine("utc_time was null");
                return false;
            }

            int message_type = (int)message["sync_message"]["message"];
            double utc_time = (double)message["utc_time"];
            double clock = DateTime.UtcNow.Subtract(NTP.epoch).TotalMilliseconds;
            var delta = NTP.utc_delta;
            double current_time = clock + delta;
            // Check if time already expired
            if (utc_time <= current_time) {
                System.Diagnostics.Debug.WriteLine("Time already expired.");
                return false;
            } else {
                System.Diagnostics.Debug.WriteLine($"Clock: {clock}\nDrift: {NTP.utc_delta}\nExecuting in {utc_time - current_time}");
            }

            // Get number of ticks since DateTime's epoch (not necessarily Unix time)
            var epoch_conversion = NTP.epoch.Ticks;
            if (message_type == ResponseDecoder.MessageType["PLAY"]) {
                {

                    while ((DateTime.UtcNow.Ticks / 10000 + delta) < (utc_time + epoch_conversion / 10000)) ;
                    System.Diagnostics.Debug.WriteLine($"Playing at UTC time {DateTime.UtcNow.Subtract(NTP.epoch).TotalMilliseconds + NTP.utc_delta} ms");
                    this.player.Play();
                    System.Diagnostics.Debug.WriteLine($"Played at UTC time {DateTime.UtcNow.Subtract(NTP.epoch).TotalMilliseconds + NTP.utc_delta} ms");

                };
            }
            else if (message_type == ResponseDecoder.MessageType["ENQUEUE_SONG"]) {
                if (message["sync_message"]["song_id"] == null)
                    return false;
                { this.player.EnqueueSong((string)message["sync_message"]["song_id"]); };
            }
            else if (message_type == ResponseDecoder.MessageType["PAUSE"]) {
                {
                    while ((DateTime.UtcNow.Ticks / 10000 + delta) < (utc_time + epoch_conversion / 10000)) ;
                    System.Diagnostics.Debug.WriteLine($"Pausing at UTC time {DateTime.UtcNow.Subtract(NTP.epoch).TotalMilliseconds + NTP.utc_delta} ms");
                    this.player.Stop();
                    System.Diagnostics.Debug.WriteLine($"Paused at UTC time {DateTime.UtcNow.Subtract(NTP.epoch).TotalMilliseconds + NTP.utc_delta} ms");
                };
            }
            else if (message_type == ResponseDecoder.MessageType["SKIP"]) {
                { this.player.SkipSong(); };
            }
            else if (message_type == ResponseDecoder.MessageType["REMOVE_SONG"]) {
                if (message["sync_message"]["song_id"] == null)
                    return false;
                { this.player.RemoveSong((string)message["sync_message"]["song_id"]); };
            }
            else if (message_type == ResponseDecoder.MessageType["ADD_MEMBER"]) {
                if (message["sync_message"]["member_name"] == null)
                    return false;
                { this.members.TryAdd((string)message["sync_message"]["member_name"], 0); };
            }
            else if (message_type == ResponseDecoder.MessageType["REMOVE_MEMBER"]) {
                if (message["sync_message"]["member_name"] == null)
                    return false;
                { this.members.TryRemove((string)message["sync_message"]["member_name"], out byte _); };
            }
            else {
                return false;
            }

            
            return true;
        }
    }
}