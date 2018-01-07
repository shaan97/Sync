using System;
using System.Collections.Generic;
using System.Text;
using System.Timers;

namespace Sync
{
    public class NTP
    {
        // Clock drift on hardware with respect to UTC
        public static double utc_delta;

        // How often we recalculate the clock drift
        public const ulong RecalculateInterval = 30000;

        // Unix Time epoch
        public static readonly DateTime epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        private static Yort.Ntp.NtpClient client;

        static NTP() {
            utc_delta = 0;

            // Initialize NTP Client
            client = new Yort.Ntp.NtpClient();

            // Attempt first calculation (failure just leaves us with 0 delta)
            RecalculateUTCDelta(null, null);

            // Recalculate every 
            Timer timer = new Timer(RecalculateInterval);
            timer.Elapsed += RecalculateUTCDelta;
            timer.Start();
        }

        private async static void RecalculateUTCDelta(object sender, ElapsedEventArgs e) {
            DateTime ntp;
            try {
                ntp = await client.RequestTimeAsync();
            } catch (Yort.Ntp.NtpNetworkException error) {
                System.Diagnostics.Debug.WriteLine($"An error occurred during execution of NTP protocol. Details: \"{error.ToString()}\"");
                return;
            }
            DateTime now = DateTime.UtcNow;
            var ntp_ms = ntp.ToUniversalTime().Subtract(epoch).TotalMilliseconds;
            var now_ms = now.Subtract(epoch).TotalMilliseconds;
            utc_delta = ntp_ms - now_ms;
        }
    }
}
