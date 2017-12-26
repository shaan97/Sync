using System;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;
using System.Reflection;
using System.IO;

namespace Sync
{
    public class ResponseDecoder
    {
        private Dictionary<string, string> Response;
        public object this[string key]
        {
            get
            {
                return Response[key];
                    
            }
        }

        public static Dictionary<string, int> status        { get; protected set; }
        public static Dictionary<string, int> message_type  { get; protected set; }

        static ResponseDecoder()
        {
            /* Set up Status values and MessageType values from .json files */

            var assembly = typeof(ResponseDecoder).GetTypeInfo().Assembly;

            #if __IOS__
            var status_resource_name = "Sync.iOS.Status.json";
            var message_type_resource_name = "Sync.iOS.Status.json";

            #endif
            #if __ANDROID__
            var resource_name = "Sync.Droid.RequestType.json";
            var message_type_resource_name = "Sync.Droid.Status.json";

            #endif

            Stream stream1 = assembly.GetManifestResourceStream(status_resource_name);
            Stream stream2 = assembly.GetManifestResourceStream(message_type_resource_name);

            string text = "";
            using (var reader = new System.IO.StreamReader(stream1))
            {
                text = reader.ReadToEnd();
            }

            status = JsonConvert.DeserializeObject<Dictionary<string, int>>(text);

            using (var reader = new System.IO.StreamReader(stream2))
            {
                text = reader.ReadToEnd();
            }
            message_type = JsonConvert.DeserializeObject<Dictionary<string, int>>(text);

        }

        public ResponseDecoder(string response)
        {
            this.Response = JsonConvert.DeserializeObject<Dictionary<string, string>>(response);
        }

        public bool ContainsKey(string key)
        {
            return this.Response.ContainsKey(key);
        }

        
    }
}
