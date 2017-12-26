using System;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Reflection;
using System.IO;

namespace Sync
{
    public class ResponseDecoder
    {
        private JObject Response;
        public object this[string key]
        {
            get
            {
                if (key == "status" || key == "message_type") {
                    return (int)Response[key];
                }
                return (string)Response[key];
            }
        }

        public static Dictionary<string, int> Status        { get; protected set; }
        public static Dictionary<string, int> MessageType  { get; protected set; }

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

            Status = JsonConvert.DeserializeObject<Dictionary<string, int>>(text);

            using (var reader = new System.IO.StreamReader(stream2))
            {
                text = reader.ReadToEnd();
            }
            MessageType = JsonConvert.DeserializeObject<Dictionary<string, int>>(text);

        }

        public ResponseDecoder(string response)
        {
            this.Response = JObject.Parse(response);
        }

        public bool ContainsKey(string key)
        {
            return this.Response["key"] != null;
        }

        public static string StatusToString(int status)
        {
            if(status == Status["SUCCESS"])
            {
                return "Successful response from server.";
            } else if (status == Status["FAIL"])
            {
                return "Server reported failure on query.";
            } else if (status == Status["PENDING"])
            {
                return "Query is pending...";
            } else if (status == Status["EXISTS"])
            {
                return "Server reports object of query exists.";
            } else if (status == Status["NOT_EXIST"])
            {
                return "Server reports object of query does not exist.";
            } else if (status == Status["INVALID"])
            {
                return "Invalid query.";
            } else if (status == Status["CAN_COMMIT"])
            {
                return "3PC: Can Commit?";
            } else if (status == Status["PRE_COMMIT"])
            {
                return "3PC: Pre Commit.";
            } else if (status == Status["COMMIT"])
            {
                return "3PC: Commit.";
            } else if (status == Status["ABORT_COMMIT"])
            {
                return "Abort commit.";
            } else
            {
                return "Unknown response from server";
            }
            
        }
    }
}
