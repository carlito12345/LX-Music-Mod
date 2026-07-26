package cn.toside.music.mobile.miniplayer;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.Typeface;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import cn.toside.music.mobile.MainApplication;

public class MiniPlayerView {
  private static final String TAG = "[MiniPlayer]";
  private final Context context;
  private final MiniPlayerEvent eventEmitter;
  private WindowManager windowManager;
  private FrameLayout floatingView;
  private ImageView coverView;
  private TextView titleView, artistView, lrcView;
  private Button prevBtn, playBtn, nextBtn;
  private View progressBar;

  private boolean isShowing = false;
  private boolean isPlaying = false;
  private boolean isVertical = false;
  private int initialX, initialY;
  private float initialTouchX, initialTouchY;
  private int screenWidth;

  private static final int H_W = 980, H_H = 220;
  private static final int V_W = 600, V_H = 1000;

  // Unicode Material icons as text
  private static final String ICON_PREV = "⏮";  // ⏮
  private static final String ICON_PLAY = "▶";  // ▶
  private static final String ICON_PAUSE = "⏸"; // ⏸
  private static final String ICON_NEXT = "⏭";  // ⏭

  public MiniPlayerView(Context context, MiniPlayerEvent eventEmitter) {
    this.context = context;
    this.eventEmitter = eventEmitter;
    // No ReactRootView - pure native Views = no UI freeze
  }

  public void show(boolean isLandscape) {
    if (isShowing) return;
    new Handler(Looper.getMainLooper()).post(() -> showOnMainThread());
  }

  public void showVertical() {
    isVertical = true;
    show(false);
  }

  private void showOnMainThread() {
    windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    Point size = new Point();
    windowManager.getDefaultDisplay().getSize(size);
    int sw = Math.min(size.x, size.y);
    int sh = Math.max(size.x, size.y);
    screenWidth = sw;

    float density = context.getResources().getDisplayMetrics().density;
    int w = (int) ((isVertical ? V_W : H_W) * density);
    int h = (int) ((isVertical ? V_H : H_H) * density);
    if (w > sw * 0.95f) w = (int) (sw * 0.95f);
    if (h > sh * 0.95f) h = (int) (sh * 0.95f);

    int flag = Build.VERSION.SDK_INT >= 26 ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
    WindowManager.LayoutParams params = new WindowManager.LayoutParams(w, h, flag,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
    params.gravity = Gravity.TOP | Gravity.START;
    params.x = (sw - w) / 2;
    params.y = (int) (sh * 0.15f);

    floatingView = new FrameLayout(context);
    floatingView.setBackgroundColor(0xCC1A1A2E);

    LinearLayout root = new LinearLayout(context);
    root.setOrientation(isVertical ? LinearLayout.VERTICAL : LinearLayout.HORIZONTAL);
    root.setPadding(dp(12), dp(8), dp(12), dp(8));

    // Cover
    coverView = new ImageView(context);
    int coverSize = isVertical ? dp(100) : dp(56);
    LinearLayout.LayoutParams coverLp = new LinearLayout.LayoutParams(coverSize, coverSize);
    if (!isVertical) coverLp.setMargins(0, 0, dp(10), 0);
    coverView.setLayoutParams(coverLp);
    coverView.setScaleType(ImageView.ScaleType.CENTER_CROP);
    coverView.setImageResource(android.R.drawable.ic_menu_gallery);
    GradientDrawable coverBg = new GradientDrawable();
    coverBg.setCornerRadius(dp(12));
    coverView.setBackground(coverBg);
    coverView.setClipToOutline(true);
    root.addView(coverView);

    if (isVertical) {
      // Vertical: Cover centered, then info, lrc, progress, controls below
      coverView.setLayoutParams(new LinearLayout.LayoutParams(coverSize, coverSize));
      ((LinearLayout.LayoutParams) coverView.getLayoutParams()).gravity = Gravity.CENTER_HORIZONTAL;
      coverView.setPadding(0, dp(8), 0, 0);

      root.addView(makeLiner(dp(4)));
      root.addView(makeInfo(true));
      root.addView(makeLiner(dp(8)));
      root.addView(makeLrc());
      root.addView(makeLiner(dp(8)));
      root.addView(makeProgress());
      root.addView(makeLiner(dp(12)));
      root.addView(makeControls(true));
    } else {
      // Horizontal: Cover - Info - Controls
      root.addView(makeInfo(false));
      root.addView(makeLiner(dp(4)));
      root.addView(makeLrc());
      root.addView(makeLiner(dp(4)));
      root.addView(makeControls(false));
    }

    floatingView.addView(root, new FrameLayout.LayoutParams(-1, -1));

    // Drag
    floatingView.setOnTouchListener((v, event) -> {
      switch (event.getAction()) {
        case MotionEvent.ACTION_DOWN:
          initialX = params.x; initialY = params.y;
          initialTouchX = event.getRawX(); initialTouchY = event.getRawY();
          return true;
        case MotionEvent.ACTION_MOVE:
          params.x = initialX + (int)(event.getRawX() - initialTouchX);
          params.y = initialY + (int)(event.getRawY() - initialTouchY);
          try { windowManager.updateViewLayout(floatingView, params); } catch (Exception e) {}
          return true;
      }
      return false;
    });

    try { windowManager.addView(floatingView, params); isShowing = true; } 
    catch (Exception e) { Log.e(TAG, "show error", e); }
  }

  private LinearLayout makeInfo(boolean isV) {
    LinearLayout ll = new LinearLayout(context);
    ll.setOrientation(LinearLayout.VERTICAL);
    ll.setLayoutParams(new LinearLayout.LayoutParams(0, -2, 1));
    if (isV) ll.setGravity(Gravity.CENTER_HORIZONTAL);

    titleView = new TextView(context);
    titleView.setTextColor(Color.WHITE);
    titleView.setTextSize(isV ? 18 : 14);
    titleView.setTypeface(null, Typeface.BOLD);
    titleView.setMaxLines(1);
    titleView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    ll.addView(titleView);

    artistView = new TextView(context);
    artistView.setTextColor(Color.argb(128, 255, 255, 255));
    artistView.setTextSize(isV ? 14 : 11);
    artistView.setMaxLines(1);
    artistView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    ll.addView(artistView);
    return ll;
  }

  private LinearLayout makeLrc() {
    LinearLayout ll = new LinearLayout(context);
    ll.setOrientation(LinearLayout.VERTICAL);
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1);
    ll.setLayoutParams(lp);
    ll.setGravity(Gravity.CENTER);
    lrcView = new TextView(context);
    lrcView.setTextColor(Color.argb(102, 255, 255, 255));
    lrcView.setTextSize(12);
    lrcView.setMaxLines(3);
    lrcView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    lrcView.setGravity(Gravity.CENTER);
    lrcView.setText("♪");
    ll.addView(lrcView);
    return ll;
  }

  private View makeProgress() {
    progressBar = new View(context);
    progressBar.setBackgroundColor(Color.argb(80, 255, 255, 255));
    progressBar.setLayoutParams(new LinearLayout.LayoutParams(-1, dp(3)));
    return progressBar;
  }

  private View makeLiner(int dp) {
    View v = new View(context);
    v.setLayoutParams(new LinearLayout.LayoutParams(-1, isVertical ? dp : dp / 2));
    return v;
  }

  private LinearLayout makeControls(boolean isV) {
    LinearLayout ll = new LinearLayout(context);
    ll.setOrientation(LinearLayout.HORIZONTAL);
    ll.setGravity(Gravity.CENTER);
    if (!isV) {
      ll.setLayoutParams(new LinearLayout.LayoutParams(-2, -1));
      ll.setGravity(Gravity.CENTER_VERTICAL);
    }

    int btnSize = isV ? dp(56) : dp(44);
    int btnRadius = btnSize / 2;
    int iconSize = isV ? 28 : 20;

    prevBtn = makeBtn(ICON_PREV, iconSize, btnSize, btnRadius);
    prevBtn.setOnClickListener(v -> sendAction("previous"));
    ll.addView(prevBtn);

    playBtn = makeBtn(isPlaying ? ICON_PAUSE : ICON_PLAY, isV ? 36 : 26, isV ? dp(68) : dp(50), isV ? dp(34) : dp(25));
    playBtn.setOnClickListener(v -> sendAction("playPause"));
    ll.addView(playBtn);

    nextBtn = makeBtn(ICON_NEXT, iconSize, btnSize, btnRadius);
    nextBtn.setOnClickListener(v -> sendAction("next"));
    ll.addView(nextBtn);

    return ll;
  }

  private Button makeBtn(String text, int textSize, int size, int radius) {
    Button btn = new Button(context);
    btn.setText(text);
    btn.setTextColor(Color.WHITE);
    btn.setTextSize(textSize);
    btn.setBackgroundColor(Color.argb(25, 255, 255, 255));
    btn.setLayoutParams(new LinearLayout.LayoutParams(size, size));
    GradientDrawable shape = new GradientDrawable();
    shape.setCornerRadius(radius);
    shape.setColor(Color.argb(25, 255, 255, 255));
    btn.setBackground(shape);
    btn.setPadding(0, 0, 0, 0);
    return btn;
  }

  public void updatePlaybackInfo(String title, String artist, boolean playing, int progress, int maxProgress) {
    isPlaying = playing;
    new Handler(Looper.getMainLooper()).post(() -> {
      if (titleView != null) titleView.setText(title.isEmpty() ? "未播放" : title);
      if (artistView != null) artistView.setText(artist);
      if (playBtn != null) playBtn.setText(playing ? ICON_PAUSE : ICON_PLAY);
    });
  }

  public void updateCover(String path) {
    if (coverView == null || path == null || path.isEmpty()) return;
    new Thread(() -> {
      try {
        Bitmap bmp = null;
        if (path.startsWith("http")) {
          URL url = new URL(path);
          HttpURLConnection conn = (HttpURLConnection) url.openConnection();
          conn.setConnectTimeout(5000);
          conn.setReadTimeout(5000);
          conn.setInstanceFollowRedirects(true);
          InputStream is = conn.getInputStream();
          bmp = BitmapFactory.decodeStream(is);
          is.close(); conn.disconnect();
        } else {
          bmp = BitmapFactory.decodeFile(path.replace("file://", ""));
        }
        if (bmp != null) {
          final Bitmap fb = bmp;
          new Handler(Looper.getMainLooper()).post(() -> coverView.setImageBitmap(fb));
        }
      } catch (Exception e) { Log.w(TAG, "cover error: " + e.getMessage()); }
    }).start();
  }

  public void hide() {
    if (!isShowing) return;
    try { if (floatingView != null) windowManager.removeView(floatingView); } catch (Exception e) {}
    floatingView = null; isShowing = false; isVertical = false;
  }

  public boolean isShowing() { return isShowing; }

  private void sendAction(String action) {
    WritableMap p = Arguments.createMap();
    p.putString("action", action);
    eventEmitter.sendEvent("onMiniPlayerAction", p);
  }

  private int dp(int v) { return (int) (v * context.getResources().getDisplayMetrics().density + 0.5f); }
}
