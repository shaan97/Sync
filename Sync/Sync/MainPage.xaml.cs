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
            sync.Send(
                new RequestBuilder
                {
                    RequestType = "ROOM_CREATE",
                    member_name = this.member_name,
                    room_name = ((Entry)sender).Text
                }.ToString()
            );
            //Navigation.PushAsync()
		}

		public void Join_Room(object sender, EventArgs e) {
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
