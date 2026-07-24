package cn.toside.music.mobile.carkey;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.view.KeyEvent;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class CarKeyModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  private boolean isListening = false;

  CarKeyModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "CarKeyModule";
  }

  @ReactMethod
  public void startListening(Promise promise) {
    if (isListening) {
      promise.resolve(true);
      return;
    }
    try {
      IntentFilter filter = new IntentFilter();
      filter.addAction("android.intent.action.MEDIA_BUTTON");
      // Register for key events
      reactContext.registerReceiver(keyReceiver, filter);
      isListening = true;
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("CARKEY_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void stopListening(Promise promise) {
    try {
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
          handleKeyEvent(event.getKeyCode());
        }
      }
    }
  };

  private void handleKeyEvent(int keyCode) {
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
  public void addListener(String eventName) {}

  @ReactMethod
  public void removeListeners(Integer count) {}
}
