package cn.toside.music.mobile.carkey;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

/**
 * 吉利/亿咖通 OneOS API 方控直连模块
 * 模仿 GIB 的连接逻辑:先 init,再等 isAlive
 */
public class GeelyCarKeyManager {
  private static final String TAG = "[CarKey-Geely]";
  private static GeelyCarKeyManager instance;
  private final Context context;
  private KeyInputManager keyInputManager;
  private boolean connected = false;
  private String lastError = "";

  private static final int[] STEERING_WHEEL_KEYS = {
    KeyCode.KEYCODE_R_MEDIA_NEXT,
    KeyCode.KEYCODE_R_MEDIA_PREVIOUS,
    KeyCode.KEYCODE_R_MEDIA_PLAY_PAUSE,
    KeyCode.KEYCODE_R_VOLUME_UP,
    KeyCode.KEYCODE_R_VOLUME_DOWN,
    KeyCode.KEYCODE_R_VOLUME_MUTE,
    KeyCode.KEYCODE_R_MULTI_FUNCTION,
    KeyCode.KEYCODE_R_SEEK_NEXT,
    KeyCode.KEYCODE_R_SEEK_REVIOUS,
    // Standard media keys as fallback
    87, 88, 85, 79, 126, 127
  };

  public static GeelyCarKeyManager getInstance(Context context) {
    if (instance == null) {
      instance = new GeelyCarKeyManager(context.getApplicationContext());
    }
    return instance;
  }

  private GeelyCarKeyManager(Context context) {
    this.context = context;
  }

  public void connect() {
    if (connected) return;
    Log.d(TAG, "Starting OneOS connection...");
    try {
      // Step 1: Init OneOSApiManager (same as GIB)
      OneOSApiManager.getInstance(context).init();
      Log.d(TAG, "OneOSApiManager.init() called");
      
      // Step 2: Retry with isAlive check (same as GIB's launchDynamicRetry)
      retryWithIsAlive();
    } catch (Exception e) {
      lastError = "init: " + e.getMessage();
      Log.e(TAG, lastError);
    }
  }

  private void retryWithIsAlive() {
    new Thread(() -> {
      for (int i = 0; i < 20; i++) {
        try { Thread.sleep(500); } catch (InterruptedException e) { break; }
        try {
          // Get KeyInputManager from OneOSApiManager  
          KeyInputManager kim = OneOSApiManager.getInstance(context).getKeyInputManager();
          OneOSApiManager oneos = OneOSApiManager.getInstance(context);
          boolean bound = oneos.isServiceBound();
          Log.d(TAG, "Attempt " + (i+1) + ": bound=" + bound + " kim=" + kim);
          
          if (!bound) {
            lastError = "svc not bound (attempt " + (i+1) + ")";
            continue;
          }
          
          // Get detailed diagnostic from OneOSApiManager
          lastError = oneos.getDiagnostic();
          
          if (kim != null && kim.isAlive()) {
            kim.registerListener(inputListener, context.getPackageName(), STEERING_WHEEL_KEYS);
            keyInputManager = kim;
            connected = true;
            Log.d(TAG, "KeyInputManager ready! Registered listener.");
            return;
          }
        } catch (Exception e) {
          lastError = "attempt " + (i+1) + ": " + e.getMessage();
          Log.w(TAG, lastError);
        }
      }
      lastError = "Timed out after 20 retries. Last: " + lastError;
      Log.w(TAG, lastError);
    }).start();
  }

  public void disconnect() {
    if (keyInputManager != null) {
      try { keyInputManager.unregisterListener(inputListener, context.getPackageName()); } catch (Exception e) { }
      keyInputManager = null;
    }
    try { OneOSApiManager.getInstance(context).release(); } catch (Exception e) { }
    connected = false;
    Log.d(TAG, "Disconnected");
  }

  public boolean isConnected() { return connected; }
  public static boolean isInstanceConnected() { return instance != null && instance.connected; }
  public String getLastError() { return lastError; }

  private final KeyInputManager.BaseInputListener inputListener = new KeyInputManager.BaseInputListener() {
    @Override
    public void onKeyCodeEvent(int keyCode, int event, int softKeyFunction) {
      // event=0 = ACTION_DOWN, event=1 = ACTION_UP
      // 只处理按下事件,忽略释放事件(避免重复)
      Log.d(TAG, "Key event: " + keyCode + " event=" + event);
      if (event == 0) handleKey(keyCode);
    }
    // onShortClick 不处理(Geely 的 onKeyCodeEvent 已包含按下事件)
  };

  private void handleKey(int keyCode) {
    String action;
    switch (keyCode) {
      case KeyCode.KEYCODE_R_MEDIA_NEXT:
      case KeyCode.KEYCODE_R_SEEK_NEXT:
      case 87: action = "next"; break;
      case KeyCode.KEYCODE_R_MEDIA_PREVIOUS:
      case KeyCode.KEYCODE_R_SEEK_REVIOUS:
      case 88: action = "previous"; break;
      case KeyCode.KEYCODE_R_MEDIA_PLAY_PAUSE:
      case KeyCode.KEYCODE_R_MULTI_FUNCTION:
      case 85: case 79: case 126: case 127: action = "playPause"; break;
      case KeyCode.KEYCODE_R_VOLUME_UP: action = "volumeUp"; break;
      case KeyCode.KEYCODE_R_VOLUME_DOWN: action = "volumeDown"; break;
      default: return;
    }
    CarKeyBridge.sendKeyEvent(keyCode, action, "GeelyCarKeyManager");
  }
}
