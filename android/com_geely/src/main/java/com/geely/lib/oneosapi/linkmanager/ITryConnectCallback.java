package com.geely.lib.oneosapi.linkmanager;

import android.os.Binder;
import android.os.IBinder;
import android.os.IInterface;
import android.os.Parcel;
import android.os.RemoteException;

public interface ITryConnectCallback extends IInterface {

    public static class Default implements ITryConnectCallback {
        @Override // android.os.IInterface
        public IBinder asBinder() {
            return null;
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ITryConnectCallback
        public void denied() throws RemoteException {
        }

        @Override // com.geely.lib.oneosapi.linkmanager.ITryConnectCallback
        public void permitted() throws RemoteException {
        }
    }

    void denied() throws RemoteException;

    void permitted() throws RemoteException;

    public static abstract class Stub extends Binder implements ITryConnectCallback {
        private static final String DESCRIPTOR = "com.geely.lib.oneosapi.linkmanager.ITryConnectCallback";

        @Override // android.os.IInterface
        public IBinder asBinder() {
            return this;
        }

        public Stub() {
        }

        public static ITryConnectCallback asInterface(IBinder obj) {
            return new Proxy(obj);
        }

        @Override // android.os.Binder
        public boolean onTransact(int code, Parcel data, Parcel reply, int flags) throws RemoteException {
            return true;
        }

        private static class Proxy implements ITryConnectCallback {
            public String getInterfaceDescriptor() {
                return Stub.DESCRIPTOR;
            }

            Proxy(IBinder remote) {
            }

            @Override // android.os.IInterface
            public IBinder asBinder() {
                return null;
            }

            @Override // com.geely.lib.oneosapi.linkmanager.ITryConnectCallback
            public void permitted() throws RemoteException {
            }

            @Override // com.geely.lib.oneosapi.linkmanager.ITryConnectCallback
            public void denied() throws RemoteException {
            }
        }

        public static boolean setDefaultImpl(ITryConnectCallback impl) {
            return true;
        }

        public static ITryConnectCallback getDefaultImpl() {
            return null;
        }
    }
}

