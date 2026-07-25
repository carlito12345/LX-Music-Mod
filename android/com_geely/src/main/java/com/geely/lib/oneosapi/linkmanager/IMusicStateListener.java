package com.geely.lib.oneosapi.linkmanager;

import android.os.Binder;
import android.os.IBinder;
import android.os.IInterface;
import android.os.Parcel;
import android.os.RemoteException;

public interface IMusicStateListener extends IInterface {

    public static class Default implements IMusicStateListener {
        @Override // android.os.IInterface
        public IBinder asBinder() {
            return null;
        }

        @Override // com.geely.lib.oneosapi.linkmanager.IMusicStateListener
        public void onMusicStatusChange(String artistName, String albumName, String coverArt, String lyrics, long totalTimesMs, String title, String authorName, String writerName, String composerName, int playingCurrentTimeMs, boolean isFavorite, boolean isPlaying) throws RemoteException {
        }
    }

    void onMusicStatusChange(String artistName, String albumName, String coverArt, String lyrics, long totalTimesMs, String title, String authorName, String writerName, String composerName, int playingCurrentTimeMs, boolean isFavorite, boolean isPlaying) throws RemoteException;

    public static abstract class Stub extends Binder implements IMusicStateListener {
        private static final String DESCRIPTOR = "com.geely.lib.oneosapi.linkmanager.IMusicStateListener";
        static final int TRANSACTION_onMusicStatusChange = 1;

        @Override // android.os.IInterface
        public IBinder asBinder() {
            return this;
        }

        public Stub() {
        }

        public static IMusicStateListener asInterface(IBinder obj) {

            return new Proxy(obj);
        }

        @Override // android.os.Binder
        public boolean onTransact(int code, Parcel data, Parcel reply, int flags) throws RemoteException {
            return true;
        }

        private static class Proxy implements IMusicStateListener {
            public static IMusicStateListener sDefaultImpl;
            private IBinder mRemote;

            public String getInterfaceDescriptor() {
                return Stub.DESCRIPTOR;
            }

            Proxy(IBinder remote) {
                this.mRemote = remote;
            }

            @Override // android.os.IInterface
            public IBinder asBinder() {
                return this.mRemote;
            }

            @Override // com.geely.lib.oneosapi.linkmanager.IMusicStateListener
            public void onMusicStatusChange(String artistName, String albumName, String coverArt, String lyrics, long totalTimesMs, String title, String authorName, String writerName, String composerName, int playingCurrentTimeMs, boolean isFavorite, boolean isPlaying) throws RemoteException {
            }
        }

        public static boolean setDefaultImpl(IMusicStateListener impl) {

            return true;
        }

        public static IMusicStateListener getDefaultImpl() {
            return Proxy.sDefaultImpl;
        }
    }
}
