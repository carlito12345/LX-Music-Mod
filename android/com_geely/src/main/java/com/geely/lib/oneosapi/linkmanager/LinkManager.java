package com.geely.lib.oneosapi.linkmanager;

import android.content.Context;
import android.os.IBinder;
import android.os.RemoteException;

import com.geely.lib.oneosapi.common.ServiceBaseManager;

public class LinkManager implements ServiceBaseManager {
    public LinkManager(Context context, IBinder binder) {
    }

    @Override // com.geely.lib.oneosapi.common.ServiceBaseManager
    public void setService(IBinder binder) {
    }

    public void sessionConnected(int brand, int type) {
    }

    public void sessionDisconnected(int brand, int type) {
    }

    public boolean isSessionConnected() {
        return false;
    }

    public int getConnectedSessionBrand() {
        return 0;
    }

    public int getConnectedSessionType() {
        return 0;
    }

    public void tryConnect(int brand, int type, ITryConnectCallback callback) {
    }

    public void registerListener(BaseLinkListener listener, String packageName) {
    }

    public void unregisterListener(BaseLinkListener listener, String packageName) {
    }

    public void registerMusicStateListener(MusicStateListener listener, String packageName) {
    }

    public void unregisterMusicStateListener(MusicStateListener listener, String packageName) {
    }

    public void registerModemCallStateListener(ModemCallStateListener listener, String packageName) {
    }

    public void unregisterModemCallStateListener(ModemCallStateListener listener, String packageName) {
    }

    public void updatePlayState(int state, int brand) {
    }

    public boolean isSourceActivated() {
        return false;
    }

    public void play() {
    }

    public void stop() {
    }

    public void next() {
    }

    public void previous() {
    }

    public void fastForward() {
    }

    public void fastBackward() {
    }

    public void setMusicInfo(String artistName, String albumName, String coverArt, String lyrics, long totalTimesMs, String title, String authorName, String writerName, String composerName, int playingCurrentTimeMs, boolean isFavorite, boolean isPlaying) {
    }

    public void setModemCallState(int state) {
    }

    public static abstract class MusicStateListener extends IMusicStateListener.Stub {
        @Override // com.geely.lib.oneosapi.linkmanager.IMusicStateListener
        public void onMusicStatusChange(String artistName, String albumName, String coverArt, String lyrics, long totalTimesMs, String title, String authorName, String writerName, String composerName, int playingCurrentTimeMs, boolean isFavorite, boolean isPlaying) throws RemoteException {
        }
    }

    public static abstract class ModemCallStateListener extends IModemCallStateListener.Stub {
        @Override // com.geely.lib.oneosapi.linkmanager.IModemCallStateListener
        public void onModemCallStateChange(int state) throws RemoteException {
        }
    }

    public static abstract class BaseLinkListener extends ILinkListener.Stub {
        @Override // com.geely.lib.oneosapi.linkmanager.ILinkListener
        public void onFastBackward() throws RemoteException {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ILinkListener
        public void onFastForward() throws RemoteException {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ILinkListener
        public void onNext() throws RemoteException {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ILinkListener
        public void onPlay() throws RemoteException {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ILinkListener
        public void onPrevious() throws RemoteException {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ILinkListener
        public void onSourceActivated(boolean active) throws RemoteException {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ILinkListener
        public void onStop() throws RemoteException {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ILinkListener
        public void onConnectStatusChange(int connect, int brand, int type) {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ILinkListener
        public void onDisconnectRequest(int brand, int type) {
        }
    }

    public static abstract class BaseTryConnectCallback extends ITryConnectCallback.Stub {
        @Override // com.geely.lib.oneosapi.linkmanager.ITryConnectCallback
        public void permitted() {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ITryConnectCallback
        public void denied() {
        }
    }
}
