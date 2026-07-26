package cn.toside.music.mobile.miniplayer;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MiniPlayerView {
  private static final String TAG = "[MiniPlayer]";
  private final Context context;
  private final MiniPlayerEvent eventEmitter;
  private WindowManager windowManager;
  private FrameLayout floatingView;
  private ImageView coverView;
  private TextView titleView;
  private TextView artistView;
  private Button playPauseBtn;
  private Button nextBtn;
  private Button prevBtn;
  private ImageButton closeBtn;
  private ProgressBar progressBar;

  private boolean isShowing = false;
  private int initialX, initialY;
  private float initialTouchX, initialTouchY;

  // 默认尺寸 (dp) - 自适应
  private int windowWidth = 360;
  private int windowHeight = 80;
  private boolean isCollapsed = false;
  private String currentCover = "";
  private String currentTitle = "";
  private String currentArtist = "";
  private boolean isPlaying = false;

  private static final int COLLAPSED_WIDTH = 80;
  private static final int EXPANDED_WIDTH = 360;
  private static final int WINDOW_HEIGHT = 80;

  public MiniPlayerView(Context context, MiniPlayerEvent eventEmitter) {
    this.context = context;
    this.eventEmitter = eventEmitter;
  }

  public void show(boolean isLandscape) {
    if (isShowing) return;
    isShowing = true;

    windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    Point size = new Point();
    windowManager.getDefaultDisplay().getSize(size);
    int screenWidth = Math.min(size.x, size.y);
    int screenHeight = Math.max(size.x, size.y);

    windowWidth = Math.min(EXPANDED_WIDTH, screenWidth / 2);
    windowHeight = WINDOW_HEIGHT;

    int layoutFlag;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
    } else {
      layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
    }

    final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
        dpToPx(windowWidth),
        dpToPx(windowHeight),
        layoutFlag,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
        PixelFormat.TRANSLUCENT
    );
    params.gravity = Gravity.TOP | Gravity.START;
    params.x = 0;
    params.y = screenHeight / 2;

    // 创建布局
    floatingView = new FrameLayout(context);

    // 主容器
    LinearLayout mainLayout = new LinearLayout(context);
    mainLayout.setOrientation(LinearLayout.HORIZONTAL);
    mainLayout.setBackgroundColor(0xCC1A1A2E);
    mainLayout.setPadding(8, 8, 8, 8);
    mainLayout.setLayoutParams(new FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
    ));

    // 封面
    coverView = new ImageView(context);
    LinearLayout.LayoutParams coverParams = new LinearLayout.LayoutParams(
        dpToPx(64), dpToPx(64)
    );
    coverView.setLayoutParams(coverParams);
    coverView.setScaleType(ImageView.ScaleType.CENTER_CROP);
    coverView.setImageResource(android.R.drawable.ic_menu_gallery);
    mainLayout.addView(coverView);

    // 文字信息
    LinearLayout textLayout = new LinearLayout(context);
    textLayout.setOrientation(LinearLayout.VERTICAL);
    textLayout.setPadding(dpToPx(8), 0, 0, 0);
    LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
        0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f
    );
    textLayout.setLayoutParams(textParams);

    titleView = new TextView(context);
    titleView.setTextColor(0xFFFFFFFF);
    titleView.setTextSize(14);
    titleView.setMaxLines(1);
    titleView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    titleView.setText(currentTitle.isEmpty() ? "未播放" : currentTitle);
    textLayout.addView(titleView);

    artistView = new TextView(context);
    artistView.setTextColor(0xAAFFFFFF);
    artistView.setTextSize(12);
    artistView.setMaxLines(1);
    artistView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    artistView.setText(currentArtist);
    textLayout.addView(artistView);

    // 进度条
    progressBar = new ProgressBar(context, null, android.R.attr.progressBarStyleHorizontal);
    progressBar.setMax(100);
    progressBar.setProgress(0);
    progressBar.setLayoutParams(new LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(2)
    ));
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      progressBar.setMin(0);
    }
    textLayout.addView(progressBar);

    mainLayout.addView(textLayout);

    // 控制按钮组
    LinearLayout btnLayout = new LinearLayout(context);
    btnLayout.setOrientation(LinearLayout.HORIZONTAL);
    btnLayout.setGravity(android.view.Gravity.CENTER);
    btnLayout.setPadding(dpToPx(4), 0, 0, 0);

    prevBtn = createButton("\u25C0"); // ◀
    prevBtn.setOnClickListener(v -> sendAction("previous"));
    btnLayout.addView(prevBtn);

    playPauseBtn = createButton(isPlaying ? "\u23F8" : "\u25B6"); // ⏸ / ▶
    playPauseBtn.setOnClickListener(v -> sendAction("playPause"));
    btnLayout.addView(playPauseBtn);

    nextBtn = createButton("\u25B6"); // ▶
    nextBtn.setOnClickListener(v -> sendAction("next"));
    btnLayout.addView(nextBtn);

    mainLayout.addView(btnLayout);

    // 关闭按钮
    closeBtn = new ImageButton(context);
  closeBtn.setImageResource(android.R.drawable.ic_menu_close_clear_cancel);
    closeBtn.setBackgroundColor(0x00000000);
    closeBtn.setPadding(0, 0, 0, 0);
    closeBtn.setScaleType(ImageView.ScaleType.FIT_CENTER);
    closeBtn.setLayoutParams(new LinearLayout.LayoutParams(
        dpToPx(24), dpToPx(24)
    ));
    closeBtn.setOnClickListener(v -> hide());
    mainLayout.addView(closeBtn);

    floatingView.addView(mainLayout);

    // 拖拽逻辑
    floatingView.setOnTouchListener((v, event) -> {
      switch (event.getAction()) {
        case MotionEvent.ACTION_DOWN:
          initialX = params.x;
          initialY = params.y;
          initialTouchX = event.getRawX();
          initialTouchY = event.getRawY();
          return true;

        case MotionEvent.ACTION_MOVE:
          params.x = initialX + (int) (event.getRawX() - initialTouchX);
          params.y = initialY + (int) (event.getRawY() - initialTouchY);
          try {
            windowManager.updateViewLayout(floatingView, params);
          } catch (Exception e) { /* ignore */ }
          return true;

        case MotionEvent.ACTION_UP:
          float dx = event.getRawX() - initialTouchX;
          float dy = event.getRawY() - initialTouchY;
          float distance = (float) Math.sqrt(dx * dx + dy * dy);
          if (distance < 10) {
            toggleCollapse();
          }
          return true;
      }
      return false;
    });

    try {
      windowManager.addView(floatingView, params);
    } catch (Exception e) {
      Log.e(TAG, "Failed to show floating window", e);
      isShowing = false;
    }
  }

  public void hide() {
    if (!isShowing || floatingView == null) return;
    try {
      windowManager.removeView(floatingView);
    } catch (Exception e) { /* ignore */ }
    isShowing = false;
    floatingView = null;
  }

  public void updateCover(String coverPath) {
    currentCover = coverPath;
    if (coverView == null || coverPath.isEmpty()) return;
    new Thread(() -> {
      try {
        Bitmap bitmap = null;
        if (coverPath.startsWith("http")) {
          URL url = new URL(coverPath);
          HttpURLConnection conn = (HttpURLConnection) url.openConnection();
          conn.setConnectTimeout(3000);
          conn.setReadTimeout(3000);
          conn.setInstanceFollowRedirects(true);
          InputStream is = conn.getInputStream();
          bitmap = BitmapFactory.decodeStream(is);
          is.close();
          conn.disconnect();
        } else if (coverPath.startsWith("/") || coverPath.startsWith("file://")) {
          String filePath = coverPath.replace("file://", "");
          bitmap = BitmapFactory.decodeFile(filePath);
        }

        if (bitmap != null) {
          final Bitmap finalBitmap = bitmap;
          new Handler(Looper.getMainLooper()).post(() -> {
            coverView.setImageBitmap(finalBitmap);
          });
        }
      } catch (Exception e) {
        Log.w(TAG, "Failed to load cover: " + e.getMessage());
      }
    }).start();
  }

  public void updatePlaybackInfo(String title, String artist, boolean playing, int progress, int maxProgress) {
    currentTitle = title;
    currentArtist = artist;
    isPlaying = playing;

    new Handler(Looper.getMainLooper()).post(() -> {
      if (titleView != null) titleView.setText(title.isEmpty() ? "未播放" : title);
      if (artistView != null) artistView.setText(artist);
      if (playPauseBtn != null) {
        playPauseBtn.setText(playing ? "\u23F8" : "\u25B6");
      }
      if (progressBar != null && maxProgress > 0) {
        progressBar.setMax(maxProgress);
        progressBar.setProgress(progress);
      }
    });
  }

  public boolean isShowing() { return isShowing; }

  private void toggleCollapse() {
    isCollapsed = !isCollapsed;
    if (windowManager == null || floatingView == null) return;
    // 折叠/展开时调整宽度
    WindowManager.LayoutParams params = (WindowManager.LayoutParams) floatingView.getLayoutParams();
    params.width = dpToPx(isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH);
    try {
      windowManager.updateViewLayout(floatingView, params);
    } catch (Exception e) { /* ignore */ }
  }

  private void sendAction(String action) {
    WritableMap params = Arguments.createMap();
    params.putString("action", action);
    eventEmitter.sendEvent("onMiniPlayerAction", params);
  }

  private Button createButton(String text) {
    Button btn = new Button(context);
    btn.setText(text);
    btn.setTextColor(0xFFFFFFFF);
    btn.setBackgroundColor(0x33333333);
    btn.setTextSize(16);
    btn.setPadding(dpToPx(4), dpToPx(4), dpToPx(4), dpToPx(4));
    btn.setLayoutParams(new LinearLayout.LayoutParams(
        dpToPx(36), dpToPx(36)
    ));
    return btn;
  }

  private int dpToPx(int dp) {
    float density = context.getResources().getDisplayMetrics().density;
    return (int) (dp * density + 0.5f);
  }
}
