using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Sync;

namespace Sync.UnitTest {
    [TestClass]
    public class ResponseDecoderTest {
        [TestMethod]
        public void ResponseDecoder_IntegerFieldReturnsInt() {
            var response = new ResponseDecoder("{\n\"status\": 42\n}");
            Assert.AreEqual(42, (int)response["status"]);
        }

        [TestMethod]
        public void ResponseDecoder_StringFieldReturnsString() {
            var response = new ResponseDecoder("{\n\"string\": \"hello\"\n}");
            Assert.AreEqual("hello", (string)response["string"]);
        }

        [TestMethod]
        public void ContainsKey_KeyNotPresent_ReturnFalse() {
            var response = new ResponseDecoder("{\n\"status\": 42\n}");
            Assert.IsFalse(response.ContainsKey("_status"));
        }

        [TestMethod]
        public void ContainsKey_KeyPresent_ReturnTrue() {
            var response = new ResponseDecoder("{\n\"status\": 42\n}");
            Assert.IsTrue(response.ContainsKey("status"));
        }

    }
}
