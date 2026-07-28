package cn.toside.music.mobile.miniplayer;

import android.content.Intent;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * 迷你播放器 RN 桥接模块
 * 架构:唯一的窗口管理者是 MiniPlayerService,本模块只做转发
 */
public class MiniPlayerModule extends ReactContextBaseJavaModule {
  private static final String TAG = "[MiniPlayer]";
  private final ReactApplicationContext reactContext;
  private final MiniPlayerEvent miniPlayerEvent;
  private android.content.BroadcastReceiver serviceBtnReceiver = null;

  public MiniPlayerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    this.miniPlayerEvent = new MiniPlayerEvent(reactContext);
  }

  @Override
  public String getName() { return "MiniPlayerModule"; }

  @ReactMethod
  public void addListener(String eventName) {}

  @ReactMethod
  public void removeListeners(Integer count) {}

  // ===== 权限 =====

  @ReactMethod
  public void hasOverlayPermission(Promise promise) {
    try {
      promise.resolve(Settings.canDrawOverlays(reactContext));
    } catch (Exception e) { promise.resolve(false); }
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
    } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
  }

  // ===== 窗口控制(全部委托 Service)=====

  @ReactMethod
  public void show(int width, int height, Promise promise) {
    try {
      if (MiniPlayerService.isRunning && MiniPlayerService.hasView()) {
        Log.d(TAG, "Service已运行且窗口存在,仅刷新");
        promise.resolve(true);
        return;
      }
      MiniPlayerService.start(reactContext, width, height);
      Log.d(TAG, "已启动Service");
      promise.resolve(true);
    } catch (Exception e) {
      Log.e(TAG, "show失败", e);
      promise.reject("SHOW_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void hide(Promise promise) {
    try {
      MiniPlayerService.stop(reactContext);
      promise.resolve(true);
    } catch (Exception e) { promise.resolve(true); }
  }

  @ReactMethod
  public void isServiceRunning(Promise promise) {
    boolean running = MiniPlayerService.isRunning && MiniPlayerService.hasView();
    promise.resolve(running);
  }

  // ===== 数据更新(全部委托 Service)=====

  @ReactMethod
  public void updateCover(String coverPath, Promise promise) {
    MiniPlayerService.updateCover(coverPath);
    promise.resolve(true);
  }

  @ReactMethod
  public void updatePlaybackInfo(String title, String artist, boolean playing, int progress, int maxProgress, Promise promise) {
    MiniPlayerService.updatePlaybackInfo(title, artist, playing, progress, maxProgress);
    promise.resolve(true);
  }

  @ReactMethod
  public void updateLrc(String text, Promise promise) {
    MiniPlayerService.updateLrc(text);
    promise.resolve(true);
  }

  @ReactMethod
  public void setStyle(int bgColor, int lyricLines, String highlightColor, Promise promise) {
    MiniPlayerService.setStyle(bgColor, lyricLines, highlightColor);
    promise.resolve(true);
  }

  // ===== Service 按钮事件监听 =====

  @ReactMethod
  public void startServiceButtonListener(Promise promise) {
    try {
      if (serviceBtnReceiver == null) {
        serviceBtnReceiver = new android.content.BroadcastReceiver() {
          @Override
          public void onReceive(android.content.Context context, Intent intent) {
            String action = intent.getStringExtra(MiniPlayerService.EXTRA_ACTION);
            if (action != null && miniPlayerEvent != null) {
              com.facebook.react.bridge.WritableMap p = com.facebook.react.bridge.Arguments.createMap();
              p.putString("action", action);
              if ("seek".equals(action) && intent.hasExtra("ratio")) {
                p.putDouble("ratio", intent.getDoubleExtra("ratio", 0));
              }
              miniPlayerEvent.sendEvent("onMiniPlayerAction", p);
            }
          }
        };
        android.content.IntentFilter filter = new android.content.IntentFilter(MiniPlayerService.ACTION_BUTTON);
        if (android.os.Build.VERSION.SDK_INT >= 33) {
          reactContext.registerReceiver(serviceBtnReceiver, filter, android.content.Context.RECEIVER_EXPORTED);
        } else {
          reactContext.registerReceiver(serviceBtnReceiver, filter);
        }
      }
      promise.resolve(true);
    } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
  }

  @ReactMethod
  public void stopServiceButtonListener(Promise promise) {
    try {
      if (serviceBtnReceiver != null) {
        reactContext.unregisterReceiver(serviceBtnReceiver);
        serviceBtnReceiver = null;
      }
      promise.resolve(true);
    } catch (Exception e) { promise.resolve(true); }
  }
}
