package cn.toside.music.mobile.carkey;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.view.KeyEvent;
import android.util.Log;
import cn.toside.music.mobile.carkey.GeelyCarKeyManager;
import android.provider.Settings;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class CarKeyModule extends ReactContextBaseJavaModule {
  private static final String TAG = "CarKey";
  private static long lastKeyTime = 0;
  private static int lastKeyCode = -1;
  private static String lastKeySource = "";
  private final ReactApplicationContext reactContext;
  private boolean isListening = false;

  CarKeyModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    CarKeyBridge.setReactContext(reactContext);
  }

  @Override
  public String getName() {
    return "CarKeyModule";
  }

  @ReactMethod
  public void startListening(Promise promise) {
    // 优先使用 Geely OneOS API(只用一个通道,避免重复触发)
    boolean geelyConnected = false;
    try {
      GeelyCarKeyManager geelyManager = GeelyCarKeyManager.getInstance(reactContext);
      geelyManager.connect();
      // 等待 OneOS 绑定(最多 2 秒)
      for (int i = 0; i < 4; i++) {
        try { Thread.sleep(500); } catch (InterruptedException e) { break; }
        if (geelyManager.isConnected()) {
          geelyConnected = true;
          break;
        }
      }
    } catch (Exception e) {
      Log.d(TAG, "Geely API not available: " + e.getMessage());
    }

    // Geely 已连接时不注册 MEDIA_BUTTON(避免双重触发)
    if (geelyConnected) {
      Log.d(TAG, "Geely connected - skipping MEDIA_BUTTON receiver");
      isListening = true;
      promise.resolve(true);
      return;
    }

    // Geely 不可用时才使用 MEDIA_BUTTON 广播
    if (isListening) {
      promise.resolve(true);
      return;
    }
    try {
      IntentFilter filter = new IntentFilter();
      filter.addAction("android.intent.action.MEDIA_BUTTON");
      reactContext.registerReceiver(keyReceiver, filter);
      isListening = true;
      Log.d(TAG, "MEDIA_BUTTON receiver registered (Geely not available)");
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("CARKEY_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void stopListening(Promise promise) {
    try {
      // Stop Geely manager
      try {
        GeelyCarKeyManager geelyManager = GeelyCarKeyManager.getInstance(reactContext);
        geelyManager.disconnect();
      } catch (Exception e) { /* ignore */ }
      // Stop standard receiver
      if (isListening) {
        reactContext.unregisterReceiver(keyReceiver);
        isListening = false;
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("CARKEY_ERROR", e.getMessage());
    }
  }

  private final BroadcastReceiver keyReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      if (Intent.ACTION_MEDIA_BUTTON.equals(intent.getAction())) {
        KeyEvent event = intent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
        if (event != null && event.getAction() == KeyEvent.ACTION_DOWN) {
          handleKeyEvent(event.getKeyCode(), "BroadcastReceiver");
        }
      }
    }
  };

  private void handleKeyEvent(int keyCode, String source) {
    Log.d(TAG, "handleKeyEvent: keyCode=" + keyCode + " from=" + source);
    
    // 防止重复按键事件(200ms内相同键值和来源忽略)
    long now = System.currentTimeMillis();
    if (keyCode == lastKeyCode && source.equals(lastKeySource) && (now - lastKeyTime) < 300) {
      Log.d(TAG, "Duplicate key event ignored");
      return;
    }
    lastKeyCode = keyCode;
    lastKeyTime = now;
    lastKeySource = source;
    WritableMap params = Arguments.createMap();
    params.putInt("keyCode", keyCode);
    
    // Map Geely/ECarX custom steering wheel key codes
    if (keyCode == 200087) { // KEYCODE_R_MEDIA_NEXT
      keyCode = android.view.KeyEvent.KEYCODE_MEDIA_NEXT;
    } else if (keyCode == 200088) { // KEYCODE_R_MEDIA_PREVIOUS
      keyCode = android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS;
    } else if (keyCode == 200085) { // KEYCODE_R_MEDIA_PLAY_PAUSE
      keyCode = android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE;
    } else if (keyCode == 200082) { // KEYCODE_R_MENU
      keyCode = android.view.KeyEvent.KEYCODE_MENU;
    } else if (keyCode == 200003) { // KEYCODE_R_HOME
      keyCode = android.view.KeyEvent.KEYCODE_HOME;
    } else if (keyCode == 200024) { // KEYCODE_R_VOLUME_UP
      keyCode = android.view.KeyEvent.KEYCODE_VOLUME_UP;
    } else if (keyCode == 200025) { // KEYCODE_R_VOLUME_DOWN
      keyCode = android.view.KeyEvent.KEYCODE_VOLUME_DOWN;
    } else if (keyCode == 200164) { // KEYCODE_R_VOLUME_MUTE
      keyCode = android.view.KeyEvent.KEYCODE_VOLUME_MUTE;
    } else if (keyCode == 200231) { // KEYCODE_R_VOICE_ASSIST
      keyCode = android.view.KeyEvent.KEYCODE_SEARCH;
    } else if (keyCode == 210001) { // KEYCODE_R_NAVI
      keyCode = android.view.KeyEvent.KEYCODE_NAVIGATE_IN;
    } else if (keyCode == 200600) { // KEYCODE_R_MULTI_FUNCTION
      keyCode = android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE;
    } else if (keyCode == 210005) { // KEYCODE_R_SEEK_NEXT
      keyCode = android.view.KeyEvent.KEYCODE_MEDIA_FAST_FORWARD;
    } else if (keyCode == 210006) { // KEYCODE_R_SEEK_REVIOUS
      keyCode = android.view.KeyEvent.KEYCODE_MEDIA_REWIND;
    } else if (keyCode == 79 || keyCode == 126 || keyCode == 127) {
      // KEYCODE_HEADSETHOOK(79), KEYCODE_MEDIA_PLAY(126), KEYCODE_MEDIA_PAUSE(127)
      keyCode = android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE;
    }
    Log.d(TAG, "Mapped keyCode: " + keyCode);
    switch (keyCode) {
      case android.view.KeyEvent.KEYCODE_MEDIA_NEXT:
              params.putString("action", "next");
        break;
      case android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS:
              params.putString("action", "previous");
        break;
      case android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
              params.putString("action", "playPause");
        break;
      case android.view.KeyEvent.KEYCODE_MEDIA_STOP:
        params.putString("action", "stop");
        break;
      case android.view.KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
        params.putString("action", "fastForward");
        break;
      case android.view.KeyEvent.KEYCODE_MEDIA_REWIND:
        params.putString("action", "rewind");
        break;
      case android.view.KeyEvent.KEYCODE_VOLUME_UP:
              params.putString("action", "volumeUp");
        break;
      case android.view.KeyEvent.KEYCODE_VOLUME_DOWN:
              params.putString("action", "volumeDown");
        break;
      case android.view.KeyEvent.KEYCODE_VOLUME_MUTE:
              params.putString("action", "volumeMute");
        break;
      default:
        params.putString("action", "unknown");
        break;
    }
    
    sendEvent("onCarKey", params);
  }

  private void sendEvent(String eventName, WritableMap params) {
    if (reactContext.hasActiveReactInstance()) {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
    }
  }


  @ReactMethod
  public void openAccessibilitySettings(Promise promise) {
    try {
      Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      reactContext.startActivity(intent);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("CARKEY_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void isServiceRunning(Promise promise) {
    try {
      boolean running = false;
      PackageManager pm = reactContext.getPackageManager();
      try {
        ServiceInfo serviceInfo = pm.getServiceInfo(
          new android.content.ComponentName(reactContext, CarKeyAccessibilityService.class),
          0
        );
        // Check if our accessibility service is enabled
        String enabledServices = Settings.Secure.getString(
          reactContext.getContentResolver(),
          Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        if (enabledServices != null && enabledServices.contains(reactContext.getPackageName())) {
          running = true;
        }
      } catch (PackageManager.NameNotFoundException e) {
        // Service not found - not running
      }
      promise.resolve(running);
    } catch (Exception e) {
      promise.reject("CARKEY_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void getGeelyDiagnostic(Promise promise) {
    try {
      String diag = "GeelyCarKeyManager:";
      GeelyCarKeyManager geelyManager = GeelyCarKeyManager.getInstance(reactContext);
      diag += " connected=" + geelyManager.isConnected();
      diag += " lastError=" + geelyManager.getLastError();
      promise.resolve(diag);
    } catch (Exception e) {
      promise.resolve("Error: " + e.getMessage());
    }
  }

  @ReactMethod
  public void isGeelyConnected(Promise promise) {
    try {
      GeelyCarKeyManager geelyManager = GeelyCarKeyManager.getInstance(reactContext);
      promise.resolve(geelyManager.isConnected());
    } catch (Exception e) {
      promise.resolve(false);
    }
  }

  @ReactMethod
  public void addListener(String eventName) {}

  @ReactMethod
  public void removeListeners(Integer count) {}
}
