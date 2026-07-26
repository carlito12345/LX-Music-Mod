package cn.toside.music.mobile.miniplayer;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactApplicationContext;

import cn.toside.music.mobile.MainApplication;

public class MiniPlayerView {
  private static final String TAG = "[MiniPlayer]";
  private final ReactApplicationContext reactContext;
  private final MiniPlayerEvent eventEmitter;
  private WindowManager windowManager;
  private FrameLayout floatingView;
  private ReactRootView reactRootView;
  private boolean isShowing = false;
  private int initialX, initialY;
  private float initialTouchX, initialTouchY;
  private int screenWidth;
  private int screenHeight;

  private static final int MINI_WIDTH_DP = 980;
  private static final int MINI_HEIGHT_DP = 280;
  private static final int VERTICAL_WIDTH_DP = 680;
  private static final int VERTICAL_HEIGHT_DP = 1120;
  private boolean isVertical = false;

  public MiniPlayerView(ReactApplicationContext reactContext, MiniPlayerEvent eventEmitter) {
    this.reactContext = reactContext;
    this.eventEmitter = eventEmitter;
  }

  public void show(boolean isLandscape) {
    if (isShowing) return;

    new android.os.Handler(android.os.Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        showOnMainThread(isLandscape);
      }
    });
  }

  private void showOnMainThread(boolean isLandscape) {
    windowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
    android.graphics.Point size = new android.graphics.Point();
    windowManager.getDefaultDisplay().getSize(size);
    screenWidth = Math.min(size.x, size.y);
    screenHeight = Math.max(size.x, size.y);

    int layoutFlag;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
    } else {
      layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
    }

    float density = reactContext.getResources().getDisplayMetrics().density;
    int width = (int) (600 * density); // 600dp = 1200px @2x
    int height = (int) (200 * density); // 200dp = 400px @2x
    int densityDp = (int) density;

    // 适配屏幕(最大占屏幕 95%)
    // CAP REMOVED FOR DEBUGGING
    Log.d(TAG, "Screen=" + screenWidth + "x" + screenHeight + " density=" + densityDp + " rawW=" + width + " rawH=" + height);
    // DEBUG: forcing fixed size, no cap

    final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
        width, height,
        layoutFlag,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
        android.graphics.PixelFormat.TRANSLUCENT
    );
    params.gravity = Gravity.TOP | Gravity.START;
    params.x = (screenWidth - width) / 2;
    params.y = (int) (screenHeight * 0.15f);

    floatingView = new FrameLayout(reactContext);
    floatingView.setBackgroundColor(0x00000000);

    reactRootView = new ReactRootView(reactContext);
    try {
      MainApplication app = (MainApplication) reactContext.getApplicationContext();
      ReactInstanceManager rim = app.getReactNativeHost().getReactInstanceManager();
      reactRootView.startReactApplication(rim, isVertical ? "MiniPlayerVertical" : "MiniPlayer", null);
    } catch (Exception e) {
      Log.e(TAG, "Failed to start React application", e);
    }

    floatingView.addView(reactRootView, new FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
    ));

    floatingView.setOnTouchListener(new View.OnTouchListener() {
      private long touchStartTime;

      @Override
      public boolean onTouch(View v, MotionEvent event) {
        switch (event.getAction()) {
          case MotionEvent.ACTION_DOWN:
            initialX = params.x;
            initialY = params.y;
            initialTouchX = event.getRawX();
            initialTouchY = event.getRawY();
            touchStartTime = System.currentTimeMillis();
            return true;

          case MotionEvent.ACTION_MOVE:
            params.x = initialX + (int) (event.getRawX() - initialTouchX);
            params.y = initialY + (int) (event.getRawY() - initialTouchY);
            try { windowManager.updateViewLayout(floatingView, params); } catch (Exception e) {}
            return true;

          case MotionEvent.ACTION_UP:
            float dx = event.getRawX() - initialTouchX;
            float dy = event.getRawY() - initialTouchY;
            float distance = (float) Math.sqrt(dx * dx + dy * dy);
            if (distance < 10 && System.currentTimeMillis() - touchStartTime < 200) {
              return false;
            }
            return true;
        }
        return false;
      }
    });

    try {
      windowManager.addView(floatingView, params);
      isShowing = true;
      Log.d(TAG, "MiniPlayer shown with ReactRootView");
    } catch (Exception e) {
      Log.e(TAG, "Failed to show", e);
    }
  }

  public void showVertical() {
    isVertical = true;
    show(false);
  }

  public void hide() {
    if (!isShowing) return;
    try {
      if (reactRootView != null) {
        reactRootView.unmountReactApplication();
        reactRootView = null;
      }
      if (floatingView != null) {
        windowManager.removeView(floatingView);
        floatingView = null;
      }
    } catch (Exception e) { Log.e(TAG, "hide error", e); }
    isShowing = false;
  }

  public boolean isShowing() { return isShowing; }
}
