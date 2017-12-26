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
	public partial class Room : ContentPage
	{
        public string username { get; set; }
        private SyncServer sync;

        private IMusicPlayer _player;
        public IMusicPlayer player
        {
            get { return _player; }
            set
            {
                if (this._player.IsLoggedIn())
                    this._player.Logout(); // What if this fails?
                this._player = value;
            }
        }

        public Room (SyncServer sync, string username, IMusicPlayer player)
		{
            this.sync = sync;
            this.username = username;
            this.player = player;
            InitializeComponent();
		}

        public void Request(object sender, EventArgs e)
        {

        }
	}
}