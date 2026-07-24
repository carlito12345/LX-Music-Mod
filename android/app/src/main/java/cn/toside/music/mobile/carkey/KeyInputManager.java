package cn.toside.music.mobile.carkey;

import android.content.Context;
import android.os.IBinder;
import android.os.Parcel;
import android.os.RemoteException;
import android.util.Log;
import cn.toside.music.mobile.carkey.ServiceBaseManager;
import cn.toside.music.mobile.carkey.IInputListener;
import cn.toside.music.mobile.carkey.IInputManager;

/* loaded from: classes.dex */
public class KeyInputManager implements ServiceBaseManager {
    private static final String TAG = "KeyInputManager";
    private final Context mContext;
    private IInputManager mService;

    public KeyInputManager(Context context, IBinder binder) {
        this.mContext = context;
        this.mService = IInputManager.Stub.asInterface(binder);
    }

    public boolean isAlive() {
        IInputManager iInputManager = this.mService;
        return iInputManager != null && iInputManager.asBinder().isBinderAlive();
    }

    @Override // cn.toside.music.mobile.carkey.ServiceBaseManager
    public void setService(IBinder binder) {
        if (binder != null) {
            this.mService = IInputManager.Stub.asInterface(binder);
        }
    }

    public boolean interceptKeyCode(int keyCode, String packageName) {
        Log.i(TAG, "interceptKeyCode:-");
        IInputManager iInputManager = this.mService;
        if (iInputManager != null && iInputManager.asBinder().isBinderAlive()) {
            try {
                return this.mService.interceptKeyCode(keyCode, packageName);
            } catch (RemoteException e) {
                e.printStackTrace();
            }
        }
        return false;
    }

    public boolean releaseKeyCode(int keyCode, String packageName) {
        Log.i(TAG, "releaseKeyCode:-");
        IInputManager iInputManager = this.mService;
        if (iInputManager != null && iInputManager.asBinder().isBinderAlive()) {
            try {
                return this.mService.releaseKeyCode(keyCode, packageName);
            } catch (RemoteException e) {
                e.printStackTrace();
            }
        }
        return false;
    }

    public void registerListener(BaseInputListener listener, String pkg, int[] keyCodes) {
        Log.i(TAG, "registerListener:-");
        IInputManager iInputManager = this.mService;
        if (iInputManager == null || !iInputManager.asBinder().isBinderAlive()) {
            return;
        }
        try {
            this.mService.registerListener(listener, pkg, keyCodes);
        } catch (RemoteException e) {
            e.printStackTrace();
        }
    }

    public void unregisterListener(BaseInputListener listener, String pkg) {
        Log.i(TAG, "unregisterListener:- tag" + pkg);
        IInputManager iInputManager = this.mService;
        if (iInputManager == null || !iInputManager.asBinder().isBinderAlive()) {
            return;
        }
        try {
            this.mService.unregisterListener(listener, pkg);
        } catch (RemoteException e) {
            e.printStackTrace();
        }
    }

    public int getKeyController() {
        IInputManager iInputManager = this.mService;
        int i = 2;
        if (iInputManager == null || !iInputManager.asBinder().isBinderAlive()) {
            Log.i(TAG, "getKeyController:mService=null- controller2");
            return 2;
        }
        try {
            i = this.mService.getControlIndex();
        } catch (RemoteException e) {
            e.printStackTrace();
        }
        Log.i(TAG, "getKeyController:- controller" + i);
        return i;
    }

    public static abstract class BaseInputListener extends IInputListener.Stub {
        @Override // cn.toside.music.mobile.carkey.IInputListener
        public void onKeyCodeEvent(int keyCode, int event, int softKeyFunction) {
            Log.i(KeyInputManager.TAG, "onKeyCodeEvent:- keyCode" + keyCode);
        }

        @Override // cn.toside.music.mobile.carkey.IInputListener
        public void onShortClick(int keyCode, int softKeyFunction) {
            Log.i(KeyInputManager.TAG, "onShortClick:- keyCode" + keyCode);
        }

        @Override // cn.toside.music.mobile.carkey.IInputListener
        public void onHoldingPressStarted(int keyCode, int softKeyFunction) {
            Log.i(KeyInputManager.TAG, "onHoldingPressStarted:- keyCode" + keyCode);
        }

        @Override // cn.toside.music.mobile.carkey.IInputListener
        public void onHoldingPressStopped(int keyCode, int softKeyFunction) {
            Log.i(KeyInputManager.TAG, "onHoldingPressStopped:- keyCode" + keyCode);
        }

        @Override // cn.toside.music.mobile.carkey.IInputListener
        public void onLongPressTriggered(int keyCode, int softKeyFunction) {
            Log.i(KeyInputManager.TAG, "onLongPressTriggered:- keyCode" + keyCode);
        }

        @Override // cn.toside.music.mobile.carkey.IInputListener
        public void onDoubleClick(int keyCode, int softKeyFunction) {
            Log.i(KeyInputManager.TAG, "onDoubleClick:- keyCode" + keyCode);
        }

        @Override // cn.toside.music.mobile.carkey.IInputListener.Stub, android.os.Binder
        public boolean onTransact(int code, Parcel data, Parcel reply, int flags) throws RemoteException {
            try {
                return super.onTransact(code, data, reply, flags);
            } catch (RuntimeException e) {
                Log.e(KeyInputManager.TAG, "onTransact: ", e);
                return false;
            }
        }
    }
}