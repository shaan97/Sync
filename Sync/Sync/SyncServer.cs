using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WebSocket4Net;
using SuperSocket.ClientEngine;

namespace Sync
{
    public class SyncServer
    {
        private WebSocket ws;
        private bool Opened;
        private string Message;

        public SyncServer()
        {
            this.Message = "";
            
            this.ws = new WebSocket("ws://localhost:2012/");
            this.ws.MessageReceived += (object sender, MessageReceivedEventArgs e) => { lock (this.Message) { this.Message += e.Message; } };
            this.ws.Error += (object sender,  ErrorEventArgs e) => { this.Opened = false; };
            this.ws.Closed += (object sender, EventArgs e) => { this.Opened = false; };

            this.Opened = false;

        }

        private void Open()
        {
            if (this.Opened)
                return;

            this.ws.Open();
            this.Opened = true;
        }

        public void Send(string data)
        {
            if (!this.Opened)
            {
                SemaphoreSlim sent = new SemaphoreSlim(0, 1);
                this.ws.Opened += (object sender, EventArgs e) => { this.ws.Send(data); sent.Release(); };
                this.Open();
                sent.Wait();
            }
            
            this.ws.Send(data);
        }

        public string Read()
        {
            lock (this.Message)
            {
                string msg = this.Message;
                this.Message = "";
                return msg;
            }
        }
    }
}
