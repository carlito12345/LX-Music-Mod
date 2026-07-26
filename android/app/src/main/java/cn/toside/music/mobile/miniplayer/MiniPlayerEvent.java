package cn.toside.music.mobile.miniplayer;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class MiniPlayerEvent {
  private final ReactApplicationContext reactContext;

  MiniPlayerEvent(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
  }

  public void sendEvent(String eventName, @Nullable WritableMap params) {
    if (reactContext.hasActiveReactInstance()) {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
    }
  }
}
