using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

using Xamarin.Forms;
using Xamarin.Forms.Xaml;

namespace Sync
{
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class SyncRoomMaster : ContentPage
    {
        public ListView ListView;

        public SyncRoomMaster()
        {
            InitializeComponent();

            BindingContext = new SyncRoomMasterViewModel();
            ListView = MenuItemsListView;
        }

        class SyncRoomMasterViewModel : INotifyPropertyChanged
        {
            public ObservableCollection<SyncRoomMenuItem> MenuItems { get; set; }
            
            public SyncRoomMasterViewModel()
            {
                MenuItems = new ObservableCollection<SyncRoomMenuItem>(new[]
                {
                    new SyncRoomMenuItem { Id = 0, Title = "Page 1" },
                    new SyncRoomMenuItem { Id = 1, Title = "Page 2" },
                    new SyncRoomMenuItem { Id = 2, Title = "Page 3" },
                    new SyncRoomMenuItem { Id = 3, Title = "Page 4" },
                    new SyncRoomMenuItem { Id = 4, Title = "Page 5" },
                });
            }
            
            #region INotifyPropertyChanged Implementation
            public event PropertyChangedEventHandler PropertyChanged;
            void OnPropertyChanged([CallerMemberName] string propertyName = "")
            {
                if (PropertyChanged == null)
                    return;

                PropertyChanged.Invoke(this, new PropertyChangedEventArgs(propertyName));
            }
            #endregion
        }
    }
}