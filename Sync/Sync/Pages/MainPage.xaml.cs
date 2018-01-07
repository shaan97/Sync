using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xamarin.Forms;

namespace Sync
{
	public partial class MainPage : ContentPage
	{
		private SyncServer sync;
        private string member_name;

		public MainPage(SyncServer sync, string member_name)
		{
			this.sync = sync;
            this.member_name = member_name;
			InitializeComponent();
		}

        public void Create_Room(object sender, EventArgs e) {
            RequestRoom(((Entry)sender).Text, "ROOM_CREATE");
		}

		public void Join_Room(object sender, EventArgs e) {
            RequestRoom(((Entry)sender).Text, "ROOM_JOIN");
        }

        private void RequestRoom(string room_name, string request_type)
        {
            Callback callback = new Callback(
                (object s, ResponseDecoder response) => {
                    Device.BeginInvokeOnMainThread(() => {
                        Application.Current.MainPage = new Room(this.sync, this.member_name, new SpotifyPlayer());
                    });
                },
                (object s, ResponseDecoder response) => {
                    Failed(ResponseDecoder.StatusToString((int)response["status"]));
                }
            );

            sync.Send(
                new Request
                {
                    RequestType = request_type,
                    member_name = this.member_name,
                    room_name = room_name
                },
                callback
            );
        }

        public void Failed(string error_message = "")
        {
            Device.BeginInvokeOnMainThread(() => {
                DisplayAlert("Failure to Connect", error_message, "OK");
            });
        }
    }
}
