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
            
            this.ws = new WebSocket("ws://192.168.1.226:8000/");
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
                EventHandler handler = (object sender, EventArgs e) => { sent.Release(); };
                this.ws.Opened += handler;
                this.Open();
                sent.Wait();
                this.ws.Opened -= handler;
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
