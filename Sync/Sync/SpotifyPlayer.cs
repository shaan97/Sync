using System;
using System.Collections.Generic;
using System.Text;

namespace Sync
{
    public class SpotifyPlayer : IMusicPlayer
    {
        public bool IsLoggedIn()
        {
            throw new NotImplementedException();
        }

        public bool Login(string username, string password)
        {
            throw new NotImplementedException();
        }

        public bool Logout()
        {
            throw new NotImplementedException();
        }

        public bool Play()
        {
            throw new NotImplementedException();
        }

        public bool Play(string song, uint start = 0)
        {
            throw new NotImplementedException();
        }

        public bool Seek(uint seconds)
        {
            throw new NotImplementedException();
        }

        public bool SeekTo(uint start)
        {
            throw new NotImplementedException();
        }

        public bool SkipSong()
        {
            throw new NotImplementedException();
        }

        public bool Stop()
        {
            throw new NotImplementedException();
        }
    }
}
