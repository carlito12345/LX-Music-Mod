package com.geely.lib.oneosapi.linkmanager;

import android.os.Binder;
import android.os.IBinder;
import android.os.IInterface;
import android.os.Parcel;
import android.os.RemoteException;

public interface IModemCallStateListener extends IInterface {

    public static class Default implements IModemCallStateListener {
        @Override // android.os.IInterface
        public IBinder asBinder() {
            return null;
        }

        @Override // com.geely.lib.oneosapi.linkmanager.IModemCallStateListener
        public void onModemCallStateChange(int state) throws RemoteException {
        }
    }

    void onModemCallStateChange(int state) throws RemoteException;

    public static abstract class Stub extends Binder implements IModemCallStateListener {
        private static final String DESCRIPTOR = "com.geely.lib.oneosapi.linkmanager.IModemCallStateListener";
        static final int TRANSACTION_onModemCallStateChange = 1;

        @Override // android.os.IInterface
        public IBinder asBinder() {
            return this;
        }

        public Stub() {
            attachInterface(this, DESCRIPTOR);
        }

        public static IModemCallStateListener asInterface(IBinder obj) {
            return new Proxy(obj);
        }

        @Override // android.os.Binder
        public boolean onTransact(int code, Parcel data, Parcel reply, int flags) throws RemoteException {
            return true;
        }

        private static class Proxy implements IModemCallStateListener {
            public static IModemCallStateListener sDefaultImpl;
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

            @Override // com.geely.lib.oneosapi.linkmanager.IModemCallStateListener
            public void onModemCallStateChange(int state) throws RemoteException {
            }
        }

        public static boolean setDefaultImpl(IModemCallStateListener impl) {
            return true;
        }

        public static IModemCallStateListener getDefaultImpl() {
            return Proxy.sDefaultImpl;
        }
    }
}
