package cn.toside.music.mobile.carkey;

import android.content.Context;
import android.os.IBinder;
import android.os.RemoteException;
import android.util.Log;

public class OneOSApiManager {
  private static final String TAG = "[OneOS]";
  private static volatile OneOSApiManager sInstance;
  private final Context mContext;
  private ServiceConnectionManager mServiceConnectionManager;
  private KeyInputManager mKeyInputManager;
  private String mDiagnostic = "";

  public static OneOSApiManager getInstance(Context context) {
    if (sInstance == null) {
      synchronized (OneOSApiManager.class) {
        if (sInstance == null) {
          sInstance = new OneOSApiManager(context.getApplicationContext());
        }
      }
    }
    return sInstance;
  }

  private OneOSApiManager(Context context) {
    this.mContext = context;
    this.mServiceConnectionManager = new ServiceConnectionManager(context);
  }

  public void init() {
    Log.d(TAG, "Connecting to OneOS service...");
    mServiceConnectionManager.connect();
  }

  public void release() {
    mServiceConnectionManager.release();
    mKeyInputManager = null;
  }

  public boolean isServiceBound() {
    return mServiceConnectionManager != null && mServiceConnectionManager.isServiceBound();
  }

  public KeyInputManager getKeyInputManager() {
    if (mKeyInputManager == null && mServiceConnectionManager.isServiceBound()) {
      try {
        IServiceManager sm = mServiceConnectionManager.getServiceManager();
        if (sm == null) {
          mDiagnostic = "getServiceManager()=null";
          return null;
        }
        IBinder binder = sm.getService(8);
        if (binder == null) {
          mDiagnostic = "svc(8)=null, available:";
          for (int i = 0; i < 30; i++) {
            try {
              if (sm.getService(i) != null) mDiagnostic += " " + i;
            } catch (Exception e) {}
          }
          return null;
        }
        mKeyInputManager = new KeyInputManager(mContext, binder);
        mDiagnostic = "OK";
      } catch (RemoteException e) {
        mDiagnostic = "RemoteEx: " + e.getMessage();
      }
    } else if (!mServiceConnectionManager.isServiceBound()) {
      mDiagnostic = "not bound";
    }
    return mKeyInputManager;
  }

  public String getDiagnostic() {
    return mDiagnostic;
  }
}
