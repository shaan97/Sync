using System;
using System.Collections.Generic;
using System.Text;
using System.IO;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace HelloWorld
{
    /* 
     * @class RequestBuilder 
     * 
     * @brief
     * This class is intended to abstract the idea of constructing request messages to the Server. This follows the 'Builder' design pattern, which
     * basically means that we use this class to *build* a string based off of what the user wants to do.
     * 
     * For instance, the user may want to create a room, which leads to the execution of the following code:
     * 
     * @code
     * var req = new Requestbuilder();
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
    class RequestBuilder
    {
        private Dictionary<string, string> RequestType;
        public RequestBuilder() {
            /* TODO : Make a file RequestType.json that is just the object from globals.js */
            this.RequestType = JsonConvert.DeserializeObject<Dictionary<string, string>>(File.ReadAllText(@"PATH TO RequestType.json"));
            this._Request = new JObject();
        }

        private JObject _Request;
        public string Request
        {
            get { return this._Request.ToString(); }
        }

        


    }
}
