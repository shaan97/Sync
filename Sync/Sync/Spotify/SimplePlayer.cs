using System;
using Android.Media;
using Android.Content;
using Xamarin.Android;
using Android.OS;
using System.Collections.Generic;
using System.Text;
using Sync.Droid;

namespace Sync
{
    class SimplePlayer : IMusicPlayer {
        private MediaPlayer player;
        public SimplePlayer() {
            this.player = MediaPlayer.Create(Android.App.Application.Context, Resource.Raw.test);
        }

        public bool EnqueueSong(string song) {
            throw new NotImplementedException();
        }

        public bool IsLoggedIn() {
            throw new NotImplementedException();
        }

        public bool Login(string username, string password) {
            return true;
        }

        public bool Logout() {
            return true;
        }

        public bool Play() {
            player.Start();
            return true;
        }

        public bool Play(string song, uint start = 0) {
            player.Start();
            return true;
        }

        public bool RemoveSong(string song) {
            throw new NotImplementedException();
        }

        public bool Seek(uint seconds) {
            throw new NotImplementedException();
        }

        public bool SeekTo(uint start) {
            throw new NotImplementedException();
        }

        public bool SkipSong() {
            throw new NotImplementedException();
        }

        public bool Stop() {
            this.player.Pause();
            return true;
        }
    }
}
