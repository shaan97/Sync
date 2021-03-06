﻿using System;
using System.Collections.Generic;
using System.Text;
using System.IO;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Reflection;

namespace Sync
{
    /* 
     * @class Request 
     * 
     * @brief
     * This class is intended to abstract the idea of constructing request messages to the Server. This follows the 'Builder' design pattern, which
     * basically means that we use this class to *build* a string based off of what the user wants to do.
     * 
     * For instance, the user may want to create a room, which leads to the execution of the following code:
     * 
     * @code
     * var req = new Request();
     * req.RequestType = RequestType["ROOM_CREATE"]; // RequestType might be a JSON object that is loaded from RequestType.json using JSON.NET
     * req.member_name = "Shaan";
     * req.room_name = "Shaan's room";
     * 
     * socket.send(req.request);
     * 
     * This class should be flexible to change. If we decide to add new commands, it would be nice not to break interface.
     * This class should also implement all Sync Server protocols established in README.md.
     *
     */
    public class Request
    {
        private JToken _RequestType = null;
        public JToken RequestType {
            get { return _RequestType; }
            set {
                _RequestType = request_codes[(string)value];
            }
        }

        public string member_name       { get; set; } = null;
        public string room_name         { get; set; } = null;
        public string other_member_name { get; set; } = null;
        public string song_id           { get; set; } = null;
        public string sync_event_id     { get; set; } = null;
        public int request_id          { get; set; }
        private static JObject request_codes;

        static Request() {
            var assembly = typeof(Request).GetTypeInfo().Assembly;

            #if __IOS__
            var resource_name = "Sync.iOS.json.RequestType.json";
            #endif
            #if __ANDROID__
            var resource_name = "Sync.Droid.json.RequestType.json";
            #endif
            
            Stream stream = assembly.GetManifestResourceStream(resource_name);
            string text = "";
            using (var reader = new System.IO.StreamReader(stream))
            {
                text = reader.ReadToEnd();
            }

            request_codes = JObject.Parse(text);
        }

        public override string ToString() {
            return JsonConvert.SerializeObject(this);
        }
    }
}
