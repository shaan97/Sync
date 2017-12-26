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
            object invoked = false;
            EventHandler<ServerResponseEventArgs> response_handler = null;
            response_handler =
                (object s, ServerResponseEventArgs server_response) => {
                    // Make sure this was invoked only once (two threads could possibly invoke callback simultaneous before unsubscribing)
                    lock (invoked)
                    {
                        if ((bool)invoked)
                            return;
                        ResponseDecoder response = new ResponseDecoder(server_response.Response);
                        

                        invoked = true;
                    }

                    // Unsubscribe, we only want this event to happen once
                    sync.ServerResponse -= response_handler;

                    // Enter Room
                    Navigation.PushAsync(new Room(this.sync, this.member_name, new SpotifyPlayer()));
                };

            sync.ServerResponse += response_handler;
            sync.Send(
                new RequestBuilder
                {
                    RequestType = "ROOM_CREATE",
                    member_name = this.member_name,
                    room_name = ((Entry)sender).Text
                }.ToString()
            );
		}

		public void Join_Room(object sender, EventArgs e) {
            object invoked = false;
            EventHandler<ServerResponseEventArgs> response_handler = null;
            response_handler =
                (object s, ServerResponseEventArgs server_response) => {
                    // Make sure this was invoked only once (two threads could possibly invoke callback simultaneous before unsubscribing)
                    lock (invoked)
                    {
                        if ((bool)invoked)
                            return;
                        invoked = true;
                    }

                    // Unsubscribe, we only want this event to happen once
                    sync.ServerResponse -= response_handler;

                    // Enter Room
                    Navigation.PushAsync(new Room(this.sync, this.member_name, new SpotifyPlayer()));
                };

            sync.ServerResponse += response_handler;
            sync.Send(
                new RequestBuilder
                {
                    RequestType = "ROOM_JOIN",
                    member_name = this.member_name,
                    room_name = ((Entry)sender).Text
                }.ToString()
            );
        }

    }
}
