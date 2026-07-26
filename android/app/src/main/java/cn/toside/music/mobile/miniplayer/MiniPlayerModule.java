package cn.toside.music.mobile.miniplayer;

import android.util.Log;
import android.provider.Settings;
import android.content.Intent;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class MiniPlayerModule extends ReactContextBaseJavaModule {
  private static final String TAG = "[MiniPlayer]";
  private final ReactApplicationContext reactContext;
  private MiniPlayerView miniPlayerView;
  private MiniPlayerEvent miniPlayerEvent;

  public MiniPlayerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    this.miniPlayerEvent = new MiniPlayerEvent(reactContext);
  }

  @Override
  public String getName() {
    return "MiniPlayerModule";
  }

  @ReactMethod
  public void hasOverlayPermission(Promise promise) {
    try {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
        promise.resolve(Settings.canDrawOverlays(reactContext));
      } else {
        promise.resolve(true);
      }
    } catch (Exception e) {
      promise.resolve(false);
    }
  }

  @ReactMethod
  public void openOverlaySettings(Promise promise) {
    try {
      Intent intent = new Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        android.net.Uri.parse("package:" + reactContext.getPackageName())
      );
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      reactContext.startActivity(intent);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("PERMISSION_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void addListener(String eventName) {}

  @ReactMethod
  public void removeListeners(Integer count) {}

  @ReactMethod
  public void show(Promise promise) {
    try {
      if (miniPlayerView == null) {
        miniPlayerView = new MiniPlayerView(reactContext, miniPlayerEvent);
      }
      miniPlayerView.show(false);
      Log.d(TAG, "MiniPlayer shown");
      // 通知 JS 层小窗已打开,让 JS 推送当前播放状态
      WritableMap params = Arguments.createMap();
      miniPlayerEvent.sendEvent("onMiniPlayerReady", params);
      promise.resolve(true);
    } catch (Exception e) {
      Log.e(TAG, "Failed to show", e);
      promise.reject("SHOW_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void hide(Promise promise) {
    try {
      if (miniPlayerView != null) {
        miniPlayerView.hide();
        miniPlayerView = null;
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("HIDE_ERROR", e.getMessage());
    }
  }

}
