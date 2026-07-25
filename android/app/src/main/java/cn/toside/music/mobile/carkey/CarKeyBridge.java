package cn.toside.music.mobile.carkey;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * 静态桥接 - 允许 AccessibiliyService 发送事件到 React Native JS
 */
public class CarKeyBridge {
  private static ReactApplicationContext reactContext = null;

  public static void setReactContext(ReactApplicationContext ctx) {
    reactContext = ctx;
  }

  public static void sendKeyEvent(int keyCode, String action, String source) {
    if (reactContext != null && reactContext.hasActiveReactInstance()) {
      WritableMap params = Arguments.createMap();
      params.putInt("keyCode", keyCode);
      params.putString("action", action);
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("onCarKey", params);
    }
  }
}
