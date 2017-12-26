using System;
using System.Collections.Generic;
using System.Text;

namespace Sync
{
    public interface IMusicPlayer
    {
        bool Play();
        bool Play(string song, uint start = 0);

        bool Stop();

        bool SkipSong();

        bool Seek(uint seconds);
        bool SeekTo(uint start);

        bool Login(string username, string password);
        bool Logout();
        bool IsLoggedIn();

    }
}
