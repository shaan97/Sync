var ntp = require("ntp-client");
var util = require("util");

class NTP {
	constructor() {
		this.running = false;
		this.delta = 0;
		this.refresh();
		setInterval(this.refresh, 120000);
	}

	refresh() {
		if(this.running) {
			util.log("NTP request still active, dropping following request...");
			return;
		}
		this.running = true;

		ntp.getNetworkTime("pool.ntp.org", 123, (err, date) => {
			var now = Date.now();
			if(err) {
				util.log(err);
				return;
			}

			this.delta = new Date(date).getTime() - now;
			util.log(`NTP calculates a delta of ${this.delta} ms.`);
			this.running = false;
		 
		});
	}
}


exports.ntp = new NTP();