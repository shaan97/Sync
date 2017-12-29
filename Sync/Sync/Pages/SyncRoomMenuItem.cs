using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sync
{

    public class SyncRoomMenuItem
    {
        public SyncRoomMenuItem()
        {
            TargetType = typeof(SyncRoomDetail);
        }
        public int Id { get; set; }
        public string Title { get; set; }

        public Type TargetType { get; set; }
    }
}