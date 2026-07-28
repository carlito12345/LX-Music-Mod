package cn.toside.music.mobile.miniplayer;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.text.SpannableString;
import android.text.style.ForegroundColorSpan;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

public class MiniPlayerView {
  private static final String TAG = "[MiniPlayer]";
  private static final int WIN_W = 500, WIN_H = 800;
  private final Context context;
  private final MiniPlayerEvent eventEmitter;
  private WindowManager windowManager;
  private FrameLayout floatingView;
  private ImageView coverView;
  private TextView titleView, artistView, lrcView;
  private View progressFill;
  private int highlightColor = 0xFFFFFFFF;
  private int[] gradientColors = null; // 渐变色数组,null=不启用
  private FrameLayout playBtnContainer;
  private View isPlayView, pauseView;
  private boolean isShowing = false;
  private volatile boolean isPending = false;
  private boolean isPlaying = false;
  private int customW = 500, customH = 800;
  private int initialX, initialY;
  private float initialTouchX, initialTouchY;

  public MiniPlayerView(Context context, MiniPlayerEvent eventEmitter) {
    this.context = context;
    this.eventEmitter = eventEmitter;
  }

  public void show(boolean unused) { show(unused, 500, 800); }
  public void show(boolean unused, int w, int h) {
    if (isShowing || isPending) return;
    this.customW = w; this.customH = h;
    isPending = true;
    new Handler(Looper.getMainLooper()).post(this::showOnMainThread);
  }

  private void showOnMainThread() {
    isPending = false;
    if (isShowing) { Log.d(TAG, "already showing, skip duplicate"); return; }
    windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    Point size = new Point();
    windowManager.getDefaultDisplay().getSize(size);
    int sw = Math.min(size.x, size.y), sh = Math.max(size.x, size.y);
    float density = context.getResources().getDisplayMetrics().density;
    int w = (int)(customW * density), h = (int)(customH * density);
    if (w > sw * 0.95f) w = (int)(sw * 0.95f);
    if (h > sh * 0.95f) h = (int)(sh * 0.95f);
    
    int flag = Build.VERSION.SDK_INT >= 26 ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
    WindowManager.LayoutParams params = new WindowManager.LayoutParams(w, h, flag, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
    params.gravity = Gravity.TOP | Gravity.START;
    params.x = (sw - w) / 2;
    params.y = (int)(sh * 0.12f);

    floatingView = new FrameLayout(context);
    GradientDrawable winBg = new GradientDrawable();
    winBg.setCornerRadius(dp(20));
    winBg.setColor(0xE61A1A2E);
    floatingView.setBackground(winBg);
    floatingView.setClipToOutline(true);

    LinearLayout root = new LinearLayout(context);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setPadding(dp(16), dp(20), dp(16), dp(16));

    // 右上角扩展按钮(关闭service并返回App)
    TextView expandBtn = new TextView(context);
    expandBtn.setText("\u2715"); // ✕
    expandBtn.setTextColor(Color.argb(150, 255, 255, 255));
    expandBtn.setTextSize(16);
    expandBtn.setGravity(Gravity.CENTER);
    FrameLayout.LayoutParams expandLp = new FrameLayout.LayoutParams(dp(36), dp(36), Gravity.TOP | Gravity.END);
    expandLp.topMargin = dp(8);
    expandLp.rightMargin = dp(8);
    expandBtn.setLayoutParams(expandLp);
    expandBtn.setOnClickListener(v -> {
      if (callback != null) callback.onExpand();
    });

    // Cover
    coverView = new ImageView(context);
    int coverPx = dp(140);
    LinearLayout.LayoutParams coverLp = new LinearLayout.LayoutParams(coverPx, coverPx);
    coverLp.gravity = Gravity.CENTER_HORIZONTAL;
    coverView.setLayoutParams(coverLp);
    coverView.setScaleType(ImageView.ScaleType.CENTER_CROP);
    coverView.setImageResource(android.R.drawable.ic_menu_gallery);
    GradientDrawable coverBg = new GradientDrawable();
    coverBg.setCornerRadius(dp(18));
    coverView.setBackground(coverBg);
    coverView.setClipToOutline(true);
    coverView.setElevation(dp(8));
    coverView.setOnClickListener(v -> {
      if (callback != null) callback.onExpand();
    });
    root.addView(coverView);

    // Title
    titleView = new TextView(context);
    titleView.setTextColor(Color.WHITE); titleView.setTextSize(17);
    titleView.setTypeface(null, android.graphics.Typeface.BOLD);
    titleView.setMaxLines(1); titleView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    titleView.setGravity(Gravity.CENTER);
    titleView.setPadding(0, dp(10), 0, 0);
    root.addView(titleView);

    // Artist
    artistView = new TextView(context);
    artistView.setTextColor(Color.argb(153, 255, 255, 255)); artistView.setTextSize(14);
    artistView.setMaxLines(1); artistView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    artistView.setGravity(Gravity.CENTER);
    artistView.setPadding(0, dp(2), 0, 0);
    root.addView(artistView);

    // Lyrics
    lrcView = new TextView(context);
    lrcView.setTextColor(Color.argb(180, 255, 255, 255)); lrcView.setTextSize(15);
    lrcView.setMaxLines(5); lrcView.setMinLines(2);
    lrcView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    lrcView.setGravity(Gravity.CENTER);
    lrcView.setPadding(dp(12), dp(16), dp(12), dp(16));
    lrcView.setLineSpacing(dp(6), 1f);
    lrcView.setText("♪");
    lrcView.setLayoutParams(new LinearLayout.LayoutParams(-1, 0, 1));
    root.addView(lrcView);

        // Progress bar (FrameLayout with track background + white fill)
    FrameLayout progContainer = new FrameLayout(context);
    progContainer.setLayoutParams(new LinearLayout.LayoutParams(-1, dp(5)));
    GradientDrawable progBg = new GradientDrawable();
    progBg.setCornerRadius(dp(3)); progBg.setColor(Color.argb(40, 255, 255, 255));
    progContainer.setBackground(progBg);
    
    progressFill = new View(context);
    progressFill.setLayoutParams(new FrameLayout.LayoutParams(0, -1, Gravity.START));
    GradientDrawable progFillG = new GradientDrawable();
    progFillG.setCornerRadius(dp(3)); progFillG.setColor(Color.WHITE);
    progressFill.setBackground(progFillG);
    progContainer.addView(progressFill);
    
    // 进度条触摸拖动跳转
    progContainer.setOnTouchListener(new View.OnTouchListener() {
      private boolean seeking = false;
      @Override public boolean onTouch(View v, MotionEvent ev) {
        switch (ev.getAction()) {
          case MotionEvent.ACTION_DOWN:
            seeking = true;
            // 不拦截事件,让父视图也能处理
          case MotionEvent.ACTION_MOVE: {
            float ratio = Math.max(0, Math.min(1, ev.getX() / v.getWidth()));
            if (progressFill != null) {
              FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) progressFill.getLayoutParams();
              lp.width = (int)(ratio * v.getWidth());
              progressFill.requestLayout();
            }
            if (ev.getAction() == MotionEvent.ACTION_UP && seeking) {
              seeking = false;
              // 发送跳转事件
              if (callback != null) {
                callback.onSeek(ratio);
              } else if (eventEmitter != null) {
                com.facebook.react.bridge.WritableMap p = com.facebook.react.bridge.Arguments.createMap();
                p.putDouble("ratio", ratio);
                eventEmitter.sendEvent("onMiniPlayerSeek", p);
              }
            }
            return true;
          }
        }
        return false;
      }
    });
    
    root.addView(progContainer);
    // Controls
    LinearLayout controls = new LinearLayout(context);
    controls.setOrientation(LinearLayout.HORIZONTAL);
    controls.setGravity(Gravity.CENTER);
    LinearLayout.LayoutParams ctrlLp = new LinearLayout.LayoutParams(-1, -2);
    ctrlLp.topMargin = dp(12);
    controls.setLayoutParams(ctrlLp);

    int btnPx = dp(48), playPx = dp(60);

    // Prev
    createCtrl(controls, btnPx, false);

    // Play/Pause
    playBtnContainer = new FrameLayout(context);
    playBtnContainer.setLayoutParams(new LinearLayout.LayoutParams(playPx, playPx));
    applyCircle(playBtnContainer, playPx/2, Color.argb(30, 255, 255, 255));
    isPlayView = createPlayIcon(playPx);
    pauseView = createPauseIcon(playPx);
    playBtnContainer.addView(isPlayView, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));
    playBtnContainer.setOnClickListener(v -> {
      isPlaying = !isPlaying;
      View icon = isPlaying ? pauseView : isPlayView;
      playBtnContainer.removeAllViews();
      playBtnContainer.addView(icon, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));
      sendAction("playPause");
    });
    controls.addView(playBtnContainer);

    // Next
    createCtrl(controls, btnPx, true);

    root.addView(controls);
    floatingView.addView(root, new FrameLayout.LayoutParams(-1, -1));
    floatingView.addView(expandBtn);

    // Drag
    floatingView.setOnTouchListener((v, ev) -> {
      switch (ev.getAction()) {
        case MotionEvent.ACTION_DOWN:
          initialX = params.x; initialY = params.y;
          initialTouchX = ev.getRawX(); initialTouchY = ev.getRawY();
          return true;
        case MotionEvent.ACTION_MOVE:
          params.x = initialX + (int)(ev.getRawX() - initialTouchX);
          params.y = initialY + (int)(ev.getRawY() - initialTouchY);
          try { windowManager.updateViewLayout(floatingView, params); } catch (Exception ignored) {}
          return true;
      }
      return false;
    });

    try {
      windowManager.addView(floatingView, params);
      isShowing = true;
      if (eventEmitter != null) {
        WritableMap ready = Arguments.createMap();
        eventEmitter.sendEvent("onMiniPlayerReady", ready);
      }
    } catch (Exception e) { Log.e(TAG, "show error", e); }
  }

  public void updatePlaybackInfo(String title, String artist, boolean playing, int progress, int maxProgress) {
    isPlaying = playing;
    new Handler(Looper.getMainLooper()).post(() -> {
      if (titleView != null) titleView.setText(title.isEmpty() ? "未播放" : title);
      if (artistView != null) artistView.setText(artist);
      if (playBtnContainer != null) {
        View icon = isPlaying ? pauseView : isPlayView;
        playBtnContainer.removeAllViews();
        playBtnContainer.addView(icon, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));
      }
      if (maxProgress > 0 && progressFill != null) {
        try {
          FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) progressFill.getLayoutParams();
          View parent = (View) progressFill.getParent();
          if (parent != null && parent.getWidth() > 0) {
            lp.width = (int)((float)progress / maxProgress * parent.getWidth());
            progressFill.requestLayout();
          }
        } catch (Exception e) {
          Log.w(TAG, "progress error: " + e.getMessage());
        }
      }
    });
  }

  public void updateCover(String path) {
    if (coverView == null || path == null || path.isEmpty()) return;
    new Thread(() -> {
      try {
        java.io.InputStream is;
        if (path.startsWith("http")) {
          java.net.URL url = new java.net.URL(path);
          java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
          conn.setConnectTimeout(5000); conn.setReadTimeout(5000); conn.setInstanceFollowRedirects(true);
          is = conn.getInputStream();
          android.graphics.Bitmap bmp = android.graphics.BitmapFactory.decodeStream(is);
          is.close(); conn.disconnect();
          if (bmp != null) { final android.graphics.Bitmap fb = bmp; new Handler(Looper.getMainLooper()).post(() -> coverView.setImageBitmap(fb)); }
        } else {
          is = new java.io.FileInputStream(path.replace("file://", ""));
          android.graphics.Bitmap bmp = android.graphics.BitmapFactory.decodeStream(is);
          is.close();
          if (bmp != null) { final android.graphics.Bitmap fb = bmp; new Handler(Looper.getMainLooper()).post(() -> coverView.setImageBitmap(fb)); }
        }
      } catch (Exception e) { Log.w(TAG, "cover: " + e.getMessage()); }
    }).start();
  }

  public void setStyle(int bgColor, int lyricLines, String highlightColorStr) {
    if (highlightColorStr != null && highlightColorStr.contains(",")) {
      // 逗号分隔 = 渐变色列表
      try {
        String[] parts = highlightColorStr.split(",");
        int[] colors = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
          colors[i] = android.graphics.Color.parseColor(parts[i].trim());
        }
        this.gradientColors = colors.length >= 2 ? colors : null;
      } catch (Exception ignored) { this.gradientColors = null; }
    } else if (highlightColorStr != null && highlightColorStr.startsWith("#")) {
      this.gradientColors = null;
      try {
        this.highlightColor = android.graphics.Color.parseColor(highlightColorStr);
      } catch (Exception ignored) {}
    }
    if (floatingView != null) {
      new Handler(Looper.getMainLooper()).post(() -> {
        GradientDrawable winBg = (GradientDrawable) floatingView.getBackground();
        if (winBg != null) winBg.setColor(bgColor);
        if (lrcView != null) {
          lrcView.setMaxLines(lyricLines > 0 ? lyricLines : 3);
          lrcView.setMinLines(Math.min(lyricLines, 2));
        }
      });
    }
  }

  public void updateLrc(String text) {
    new Handler(Looper.getMainLooper()).post(() -> {
      if (lrcView == null) return;
      if (text == null || text.isEmpty()) {
        lrcView.setText("\u266A");
        lrcView.getPaint().setShader(null);
        return;
      }
      String[] lines = text.split("\\n");
      SpannableString ss = new SpannableString(text);
      int hlStart = 0, hlEnd = text.length();
      if (lines.length >= 3) {
        int pos = 0;
        for (int i = 0; i < 2; i++) pos = text.indexOf('\n', pos) + 1;
        int lineEnd = text.indexOf('\n', pos);
        if (lineEnd < 0) lineEnd = text.length();
        hlStart = pos; hlEnd = lineEnd;
      } else if (lines.length > 0) {
        hlStart = text.lastIndexOf('\n') + 1;
        hlEnd = text.length();
      }
      if (gradientColors != null && gradientColors.length >= 2) {
        // 渐变模式:当前行用渐变 span
        ss.setSpan(new GradientSpan(gradientColors), hlStart, hlEnd, 0);
      } else {
        ss.setSpan(new ForegroundColorSpan(highlightColor), hlStart, hlEnd, 0);
      }
      lrcView.setText(ss);
    });
  }

  // 字符级渐变着色 Span
  private static class GradientSpan extends android.text.style.CharacterStyle
      implements android.text.style.UpdateAppearance {
    private final int[] colors;
    GradientSpan(int[] colors) { this.colors = colors; }
    @Override
    public void updateDrawState(android.text.TextPaint paint) {
      android.graphics.LinearGradient lg = new android.graphics.LinearGradient(
          0, 0, 600, 0, colors, null, android.graphics.Shader.TileMode.CLAMP);
      paint.setShader(lg);
    }
  }

  public void hide() {
    try { if (floatingView != null && windowManager != null) windowManager.removeView(floatingView); } catch (Exception ignored) {}
    floatingView = null; isShowing = false;
  }

  public boolean isShowing() { return isShowing; }

  // 检查窗口是否真实挂载到屏幕(而不仅是内部标志)
  public boolean isReallyShowing() {
    return isShowing && floatingView != null && floatingView.isAttachedToWindow();
  }

  // 窗口是否可用:真实挂载 或 正在创建(post等待中)
  public boolean isAlive() {
    if (isPending) return true;
    return isShowing && floatingView != null && floatingView.isAttachedToWindow();
  }



  private void createCtrl(LinearLayout parent, int size, boolean isNext) {
    FrameLayout btn = new FrameLayout(context);
    btn.setLayoutParams(new LinearLayout.LayoutParams(size, size));
    applyCircle(btn, size/2, Color.argb(30, 255, 255, 255));
    View icon = isNext ? createSkipNextIcon(size) : createSkipPrevIcon(size);
    btn.addView(icon, new FrameLayout.LayoutParams(size/2, size/2, Gravity.CENTER));
    btn.setOnClickListener(v -> sendAction(isNext ? "next" : "previous"));
    parent.addView(btn);
  }

  private void applyCircle(View v, int radius, int color) {
    GradientDrawable gd = new GradientDrawable();
    gd.setCornerRadius(radius); gd.setColor(color); v.setBackground(gd);
  }

  private Paint whiteFill() { Paint p = new Paint(); p.setColor(0xFFFFFFFF); p.setAntiAlias(true); p.setStyle(Paint.Style.FILL); return p; }

  private View createPlayIcon(int size) {
    return new View(context) {
      @Override protected void onDraw(Canvas c) {
        int w = getWidth(), h = getHeight(); Paint p = whiteFill();
        Path path = new Path(); path.moveTo(w*0.3f, h*0.15f); path.lineTo(w*0.85f, h*0.5f); path.lineTo(w*0.3f, h*0.85f); path.close();
        c.drawPath(path, p);
      }
    };
  }

  private View createPauseIcon(int size) {
    return new View(context) {
      @Override protected void onDraw(Canvas c) {
        int w = getWidth(), h = getHeight(); Paint p = whiteFill();
        float totalW = w * 0.50f; // 2 bars + gap
        float barW = totalW * 0.4f;
        float gap = totalW * 0.2f;
        float startX = (w - totalW) / 2f;
        c.drawRect(startX, h*0.12f, startX+barW, h*0.88f, p);
        c.drawRect(startX+barW+gap, h*0.12f, startX+barW*2+gap, h*0.88f, p);
      }
    };
  }

  private View createSkipPrevIcon(int size) {
    return new View(context) {
      @Override protected void onDraw(Canvas c) {
        int w = getWidth(), h = getHeight(); Paint p = whiteFill();
        float bw = w*0.2f;
        c.drawRect(w*0.1f, h*0.12f, w*0.1f+bw, h*0.88f, p);
        Path path = new Path(); path.moveTo(w*0.85f, h*0.12f); path.lineTo(w*0.25f, h*0.5f); path.lineTo(w*0.85f, h*0.88f); path.close();
        c.drawPath(path, p);
      }
    };
  }

  private View createSkipNextIcon(int size) {
    return new View(context) {
      @Override protected void onDraw(Canvas c) {
        int w = getWidth(), h = getHeight(); Paint p = whiteFill();
        float bw = w*0.2f;
        c.drawRect(w*0.9f-bw, h*0.12f, w*0.9f, h*0.88f, p);
        Path path = new Path(); path.moveTo(w*0.15f, h*0.12f); path.lineTo(w*0.75f, h*0.5f); path.lineTo(w*0.15f, h*0.88f); path.close();
        c.drawPath(path, p);
      }
    };
  }

  private int dp(int v) { return (int)(v * context.getResources().getDisplayMetrics().density + 0.5f); }
  
  public interface MiniPlayerCallback {
    void onAction(String action);
    void onExpand();
    void onSeek(double ratio);
  }
  
  public void setCallback(MiniPlayerCallback cb) { this.callback = cb; }
  private MiniPlayerCallback callback = null;
  
  private void sendAction(String action) {
    if (callback != null) { callback.onAction(action); return; }
    if (eventEmitter != null) {
      WritableMap p = Arguments.createMap(); p.putString("action", action);
      eventEmitter.sendEvent("onMiniPlayerAction", p);
    }
  }
}
