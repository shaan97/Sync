using System;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;

namespace Sync
{
    class ResponseDecoder
    {
        public Dictionary<string, string> Response { get; protected set; }
        public ResponseDecoder(string response)
        {
            this.Response = JsonConvert.DeserializeObject<Dictionary<string, string>>(response);
        }
    }
}
