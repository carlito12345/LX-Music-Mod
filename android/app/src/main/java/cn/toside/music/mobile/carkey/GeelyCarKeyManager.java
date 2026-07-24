package cn.toside.music.mobile.carkey;

import android.content.Context;
import android.os.RemoteException;
import android.util.Log;

import cn.toside.music.mobile.carkey.ServiceConnectionManager;
import cn.toside.music.mobile.carkey.KeyCode;
import cn.toside.music.mobile.carkey.KeyInputManager;
import cn.toside.music.mobile.carkey.ApiConnectCallBack;

/**
 * 吉利/亿咖通 OneOS API 方控直连模块
 * 需要 platform 公签才能绑定 com.geely.service.oneosapi 系统服务
 */
public class GeelyCarKeyManager {
  private static final String TAG = "[CarKey-Geely]";
  private static GeelyCarKeyManager instance;
  private final Context context;
  private ServiceConnectionManager serviceConnectionManager;
  private KeyInputManager keyInputManager;
  private boolean connected = false;
  private String lastError = "";

  // 需要监听的按键列表(吉利车机方向盘键)
  private static final int[] STEERING_WHEEL_KEYS = {
    KeyCode.KEYCODE_R_MEDIA_NEXT,      // 200087 下一曲
    KeyCode.KEYCODE_R_MEDIA_PREVIOUS,  // 200088 上一曲
    KeyCode.KEYCODE_R_MEDIA_PLAY_PAUSE, // 200085 播放/暂停
    KeyCode.KEYCODE_R_VOLUME_UP,       // 200024 音量+
    KeyCode.KEYCODE_R_VOLUME_DOWN,     // 200025 音量-
    KeyCode.KEYCODE_R_VOLUME_MUTE,     // 200164 静音
    KeyCode.KEYCODE_R_MULTI_FUNCTION,  // 200600 多功能键
    KeyCode.KEYCODE_R_SEEK_NEXT,       // 210005 快进
    KeyCode.KEYCODE_R_SEEK_REVIOUS,    // 210006 快退
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
    Log.d(TAG, "Connecting to OneOS API...");
    serviceConnectionManager = new ServiceConnectionManager(context);
    serviceConnectionManager.connect(new ApiConnectCallBack() {
      @Override
      public void success() {
        Log.d(TAG, "OneOS API connected");
        initKeyInputManager();
      }
      @Override
      public void fail() {
        Log.w(TAG, "OneOS API connection failed");
      }
    });
  }

  private void initKeyInputManager() {
    try {
      keyInputManager = new KeyInputManager(context, serviceConnectionManager.getServiceManager().getService(8));
      keyInputManager.registerListener(inputListener, context.getPackageName(), STEERING_WHEEL_KEYS);
      connected = true;
      Log.d(TAG, "KeyInputManager ready, listening for steering wheel keys");
    } catch (Exception e) {
      Log.e(TAG, "KeyInputManager init failed: " + e.getMessage());
    }
  }

  public void disconnect() {
    if (keyInputManager != null) {
      try {
        keyInputManager.unregisterListener(inputListener, context.getPackageName());
      } catch (Exception e) { /* ignore */ }
      keyInputManager = null;
    }
    if (serviceConnectionManager != null) {
      serviceConnectionManager.release();
      serviceConnectionManager = null;
    }
    connected = false;
    Log.d(TAG, "Disconnected");
  }

  public boolean isConnected() { return connected; }
  public String getLastError() { return lastError; }

  private final KeyInputManager.BaseInputListener inputListener = new KeyInputManager.BaseInputListener() {
    @Override
    public void onKeyCodeEvent(int keyCode, int event, int softKeyFunction) {
      Log.d(TAG, "Key event: " + keyCode + " event=" + event);
      if (event == 0) { // ACTION_DOWN
        handleKey(keyCode);
      }
    }

    @Override
    public void onShortClick(int keyCode, int softKeyFunction) {
      Log.d(TAG, "Short click: " + keyCode);
      handleKey(keyCode);
    }
  };

  private void handleKey(int keyCode) {
    String action;
    switch (keyCode) {
      case KeyCode.KEYCODE_R_MEDIA_NEXT:
      case KeyCode.KEYCODE_R_SEEK_NEXT:
        action = "next";
        break;
      case KeyCode.KEYCODE_R_MEDIA_PREVIOUS:
      case KeyCode.KEYCODE_R_SEEK_REVIOUS:
        action = "previous";
        break;
      case KeyCode.KEYCODE_R_MEDIA_PLAY_PAUSE:
      case KeyCode.KEYCODE_R_MULTI_FUNCTION:
        action = "playPause";
        break;
      case KeyCode.KEYCODE_R_VOLUME_UP:
        action = "volumeUp";
        break;
      case KeyCode.KEYCODE_R_VOLUME_DOWN:
        action = "volumeDown";
        break;
      case KeyCode.KEYCODE_R_VOLUME_MUTE:
        action = "volumeMute";
        break;
      default:
        return;
    }
    CarKeyBridge.sendKeyEvent(keyCode, action);
  }
}
