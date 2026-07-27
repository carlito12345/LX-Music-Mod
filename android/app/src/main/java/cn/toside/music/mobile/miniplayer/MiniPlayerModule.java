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
  public void show(int width, int height, Promise promise) {
    try {
      if (miniPlayerView == null) {
        miniPlayerView = new MiniPlayerView(reactContext, miniPlayerEvent);
      }
      miniPlayerView.show(false, width, height);
      Log.d(TAG, "MiniPlayer shown");
      promise.resolve(true);
    } catch (Exception e) {
      Log.e(TAG, "Failed to show", e);
      promise.reject("SHOW_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void setStyle(int bgColor, int lyricLines, String highlightColor, Promise promise) {
    if (miniPlayerView != null) miniPlayerView.setStyle(bgColor, lyricLines, highlightColor);
    promise.resolve(true);
  }

  @ReactMethod
  public void updateLrc(String text, Promise promise) {
    if (miniPlayerView != null) miniPlayerView.updateLrc(text);
    promise.resolve(true);
  }

  @ReactMethod
  public void updateCover(String coverPath, Promise promise) {
    if (miniPlayerView != null) miniPlayerView.updateCover(coverPath);
    promise.resolve(true);
  }

  @ReactMethod
  public void updatePlaybackInfo(String title, String artist, boolean playing, int progress, int maxProgress, Promise promise) {
    if (miniPlayerView != null) miniPlayerView.updatePlaybackInfo(title, artist, playing, progress, maxProgress);
    promise.resolve(true);
  }

  @ReactMethod
  public void hide(Promise promise) {
    try {
      MiniPlayerService.stop(reactContext);
      if (miniPlayerView != null) { miniPlayerView.hide(); miniPlayerView = null; }
      promise.resolve(true);
    } catch (Exception e) {
      if (miniPlayerView != null) { miniPlayerView.hide(); miniPlayerView = null; }
      promise.resolve(true);
    }
  }
  
  private android.content.BroadcastReceiver serviceBtnReceiver = null;

  @ReactMethod
  public void startServiceButtonListener(Promise promise) {
    try {
      if (serviceBtnReceiver == null) {
        serviceBtnReceiver = new android.content.BroadcastReceiver() {
          @Override
          public void onReceive(android.content.Context context, android.content.Intent intent) {
            String action = intent.getStringExtra(MiniPlayerService.EXTRA_ACTION);
            if (action != null && miniPlayerEvent != null) {
              com.facebook.react.bridge.WritableMap p = com.facebook.react.bridge.Arguments.createMap();
              p.putString("action", action);
              miniPlayerEvent.sendEvent("onMiniPlayerAction", p);
            }
          }
        };
        android.content.IntentFilter filter = new android.content.IntentFilter(MiniPlayerService.ACTION_BUTTON);
        reactContext.registerReceiver(serviceBtnReceiver, filter, android.content.Context.RECEIVER_EXPORTED);
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void stopServiceButtonListener(Promise promise) {
    try {
      if (serviceBtnReceiver != null) {
        reactContext.unregisterReceiver(serviceBtnReceiver);
        serviceBtnReceiver = null;
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("ERROR", e.getMessage());
    }
  }

}