using System;
using System.Collections.Generic;
using System.Text;

namespace Sync
{
    public class Callback
    {
        public EventHandler<ResponseDecoder> OnSuccess { get; }
        public EventHandler<ResponseDecoder> OnFailure { get; }
        public Callback(EventHandler<ResponseDecoder> OnSuccess, EventHandler<ResponseDecoder> OnFailure) {
            this.OnSuccess = OnSuccess;
            this.OnFailure = OnFailure;
        }
    }
}
