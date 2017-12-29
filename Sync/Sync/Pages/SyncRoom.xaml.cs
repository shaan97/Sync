using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Xamarin.Forms;
using Xamarin.Forms.Xaml;

namespace Sync
{
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class SyncRoom : MasterDetailPage
    {
        public string username { get; set; }
        private SyncServer sync;

        private HashSet<string> members;

        private IMusicPlayer _player;
        public IMusicPlayer player {
            get { return _player; }
            set {
                if (this._player != null && this._player.IsLoggedIn())
                    this._player.Logout(); // What if this fails?
                this._player = value;
            }
        }

        public SyncRoom(SyncServer sync, string username, IMusicPlayer player) {
            this.sync = sync;
            this.sync.SyncEvent += HandleSyncEvent;
            this.username = username;
            this.player = player;
            this.members = new HashSet<string>() { this.username };

            InitializeComponent();
            MasterPage.ListView.ItemSelected += ListView_ItemSelected;
        }

        public void HandleSyncEvent(object sender, ResponseDecoder message) {
            var status = (int)message["status"];
            if(status == ResponseDecoder.Status["CAN_COMMIT"]) {
                // First Phase of 3PC
                this.sync.Send(new Request {
                    RequestType = "CAN_COMMIT",
                    sync_event_id = (string)message["sync_message"]["sync_event_id"]
                });
            } else if (status == ResponseDecoder.Status["PRE_COMMIT"]) {
                // Second Phase of 3PC
                this.sync.Send(new Request {
                    RequestType = "PRE_COMMIT",
                    sync_event_id = (string)message["sync_message"]["sync_event_id"]
                });

                /* TODO : Timeout causes commit. Need synchronization to make sure commit doesn't occur twice. */
            } else if (status == ResponseDecoder.Status["COMMIT"]) {
                // Third Phase of 3PC
                if (SyncCommit(message)) {
                    this.sync.Send(new Request {
                        RequestType = "COMMIT",
                        sync_event_id = (string)message["sync_message"]["sync_event_id"]
                    });
                }
            } else if (status == ResponseDecoder.Status["ABORT_COMMIT"]) {
                // Abort 3PC
            } else {
                // Drop
            }
        }

        private bool SyncCommit(ResponseDecoder message) {
            int message_type = (int)message["sync_message"]["message"];
            if(message_type == ResponseDecoder.MessageType["PLAY"]) {
                return this.player.Play((string)message["sync_message"]["song_id"]);
            }
            else if (message_type == ResponseDecoder.MessageType["ENQUEUE_SONG"]) {
                return this.player.EnqueueSong((string)message["sync_message"]["song_id"]);
            }
            else if (message_type == ResponseDecoder.MessageType["PAUSE"]) {
                return this.player.Stop();
            }
            else if (message_type == ResponseDecoder.MessageType["SKIP"]) {
                return this.player.SkipSong();
            }
            else if (message_type == ResponseDecoder.MessageType["REMOVE_SONG"]) {
                return this.player.RemoveSong((string)message["sync_message"]["song_id"]);
            }
            else if (message_type == ResponseDecoder.MessageType["ADD_MEMBER"]) {
                return this.members.Add((string)message["sync_message"]["member_name"]);
            }
            else if (message_type == ResponseDecoder.MessageType["REMOVE_MEMBER"]) {
                return this.members.Remove((string)message["sync_message"]["member_name"]);
            }
            else {
                return false;
            }
        }

        private void ListView_ItemSelected(object sender, SelectedItemChangedEventArgs e)
        {
            var item = e.SelectedItem as SyncRoomMenuItem;
            if (item == null)
                return;

            var page = (Page)Activator.CreateInstance(item.TargetType);
            page.Title = item.Title;

            Detail = new NavigationPage(page);
            IsPresented = false;

            MasterPage.ListView.SelectedItem = null;
        }
    }
}