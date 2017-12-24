using System;
using System.Collections.Generic;
using System.Text;
using WebSocket4Net;

namespace HelloWorld
{
    class SyncServer
    {
        private WebSocket ws;

        public SyncServer()
        {
            this.ws = new WebSocket("ws://localhost:2012/");
            this.ws.Opened += new EventHandler(this.on_open);
        }

        private void on_open(object sender, EventArgs e)
        {

        }
    }
}
