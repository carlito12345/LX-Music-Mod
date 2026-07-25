package cn.toside.music.mobile.gmediahud;

import android.content.Intent;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class GMediaHudModule extends ReactContextBaseJavaModule {
  private static final String TAG = "[GMediaHud]";
  private final ReactApplicationContext reactContext;

  public GMediaHudModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "GMediaHudModule";
  }

  @ReactMethod
  public void sendBroadcast(String action, String title, String subtitle, String art, int duration, String params, Promise promise) {
    try {
      Intent intent = new Intent(action);
      intent.putExtra("title", title);
      intent.putExtra("subtitle", subtitle);
      intent.putExtra("art", art);
      intent.putExtra("duration", duration);
      intent.putExtra("params", params);
      reactContext.sendBroadcast(intent);
      Log.d(TAG, "Broadcast sent: " + action);
      promise.resolve(true);
    } catch (Exception e) {
      Log.e(TAG, "Broadcast failed: " + e.getMessage());
      promise.reject("BROADCAST_ERROR", e.getMessage());
    }
  }
}
