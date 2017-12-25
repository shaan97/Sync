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
		public MainPage(SyncServer sync)
		{
			this.sync = sync;
			InitializeComponent();
		}

		public void Create_Room(string room) {
			
		}

		public void Join_Room(string room) {

		}
	}
}
