package cn.toside.music.mobile.carkey;

import android.content.Context;
import android.util.Log;

/**
 * 精简版 OneOSApiManager - 仅用于连接 KeyInputManager
 * 完整版在 GIB 项目中,这里只提取方控必需部分
 */
public class OneOSApiManager {
  private static final String TAG = "[OneOS]";
  private static volatile OneOSApiManager sInstance;
  private final Context mContext;
  private ServiceConnectionManager mServiceConnectionManager;
  private KeyInputManager mKeyInputManager;

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

  public KeyInputManager getKeyInputManager() {
    if (mKeyInputManager == null && mServiceConnectionManager.isServiceBound()) {
      try {
        mKeyInputManager = new KeyInputManager(
          mContext,
          mServiceConnectionManager.getServiceManager().getService(8)
        );
        Log.d(TAG, "KeyInputManager obtained (service 8)");
      } catch (Exception e) {
        Log.e(TAG, "getKeyInputManager failed: " + e.getMessage());
      }
    }
    return mKeyInputManager;
  }
}
