using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Xamarin.Forms;

namespace Sync
{
	public partial class App : Application
	{
		private SyncServer sync;
		public App ()
		{
			InitializeComponent();
			this.sync = new SyncServer();
			MainPage = new Sync.MainPage(this.sync, "" + new Random().NextDouble());
		}

		protected override void OnStart ()
		{
			// Handle when your app starts
		}

		protected override void OnSleep ()
		{
			// Handle when your app sleeps
		}

		protected override void OnResume ()
		{
			// Handle when your app resumes
		}
	}
}
