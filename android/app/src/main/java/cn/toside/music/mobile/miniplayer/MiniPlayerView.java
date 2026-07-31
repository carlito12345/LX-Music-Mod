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
import static cn.toside.music.mobile.logger.NativeLoggerModule.write;
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
  private static final int WIN_W = 500, WIN_H = 900;
  private final Context context;
  private final MiniPlayerEvent eventEmitter;
  private WindowManager windowManager;
  private FrameLayout floatingView;
  private ImageView bgImage;   // Neri毛玻璃背景
  private View bgOverlay;      // 暗色遮罩
  private ImageView coverView;
  private TextView titleView, artistView, lrcView;
  private View progressFill;
  // LRC 解析相关
  private String rawLrc = "";
  private int currentLyricProgress = 0;
  private int lyricOffsetMs = 0;
  private int lyricFontSize = 13;
  private int lyricLineSpacing = 6;
  private int lyricMaxLines = 3;
  private int currentLyricMax = 0;
  private Runnable lrcUpdateTask;
  private android.widget.TextView timeText;
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

  private void showOnMainThread() { write("MiniView", "INFO", "showOnMainThread");
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
    winBg.setColor(0xB3000000); // 半透明黑,让模糊背景透出
    floatingView.setBackground(winBg);
    floatingView.setClipToOutline(true);

    LinearLayout root = new LinearLayout(context);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setPadding(dp(12), dp(14), dp(12), dp(10));

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

// Neri竖屏布局: 封面居中 → 歌名歌手 → 进度条 → 时间 → 歌词 → 控件
    // === 封面 140dp 圆角 14dp 居中 ===
    coverView = new ImageView(context);
    int coverPx = dp(140);
    LinearLayout.LayoutParams coverLp = new LinearLayout.LayoutParams(coverPx, coverPx);
    coverLp.gravity = Gravity.CENTER_HORIZONTAL;
    coverLp.topMargin = dp(4);
    coverView.setLayoutParams(coverLp);
    coverView.setScaleType(ImageView.ScaleType.CENTER_CROP);
    coverView.setImageResource(android.R.drawable.ic_menu_gallery);
    GradientDrawable coverBg = new GradientDrawable();
    coverBg.setCornerRadius(dp(14));
    coverView.setBackground(coverBg);
    coverView.setClipToOutline(true);
    coverView.setElevation(dp(8));
    coverView.setOnClickListener(v -> { sendAction("expand"); });
    root.addView(coverView);
    
    // === 歌名 + 歌手(居中)===
    titleView = new TextView(context);
    titleView.setTextColor(Color.WHITE); titleView.setTextSize(17);
    titleView.setTypeface(null, android.graphics.Typeface.BOLD);
    titleView.setMaxLines(2); titleView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    titleView.setGravity(Gravity.CENTER);
    titleView.setPadding(0, dp(8), 0, 0);
    root.addView(titleView);
    
    artistView = new TextView(context);
    artistView.setTextColor(Color.argb(140, 255, 255, 255)); artistView.setTextSize(14);
    artistView.setMaxLines(1); artistView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    artistView.setGravity(Gravity.CENTER);
    artistView.setPadding(0, dp(3), 0, 0);
    root.addView(artistView);
    
    // === 进度条 (细线) ===
    FrameLayout progContainer = new FrameLayout(context);
    LinearLayout.LayoutParams progLp = new LinearLayout.LayoutParams(-1, dp(3));
    progLp.topMargin = dp(14);
    progContainer.setLayoutParams(progLp);
    GradientDrawable progBg = new GradientDrawable();
    progBg.setCornerRadius(dp(2)); progBg.setColor(Color.argb(25, 255, 255, 255));
    progContainer.setBackground(progBg);
    progressFill = new View(context);
    progressFill.setLayoutParams(new FrameLayout.LayoutParams(0, -1, Gravity.START));
    GradientDrawable progFillG = new GradientDrawable();
    progFillG.setCornerRadius(dp(2)); progFillG.setColor(Color.argb(240, 255, 255, 255));
    progressFill.setBackground(progFillG);
    progContainer.addView(progressFill);
    
    // 时间文字
    timeText = new android.widget.TextView(context);
    timeText.setTextColor(Color.argb(180, 255, 255, 255));
    timeText.setTextSize(11);
    timeText.setGravity(Gravity.END);
    timeText.setText("0:00 / 0:00");
    FrameLayout.LayoutParams tl = new FrameLayout.LayoutParams(-1, -2);
    tl.topMargin = dp(22);
    tl.leftMargin = dp(4);
    timeText.setLayoutParams(tl);
    root.addView(timeText);
    
    // 歌词 - 占满中间剩余空间(weight=1),控件固定在底部
    lrcView = new TextView(context);
    lrcView.setTextColor(Color.argb(140, 255, 255, 255)); lrcView.setTextSize(13);
    lrcView.setMaxLines(3); lrcView.setMinLines(1);
    lrcView.setGravity(Gravity.CENTER);
    lrcView.setPadding(0, dp(6), 0, 0);
    lrcView.setText("♪");
    lrcView.setLayoutParams(new LinearLayout.LayoutParams(-1, 0, 1));
    root.addView(lrcView);
    
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
    ctrlLp.topMargin = dp(8);
    controls.setLayoutParams(ctrlLp);

    int btnPx = dp(48), playPx = dp(60);

    // Like (喜欢)
    TextView likeBtn = new TextView(context);
    likeBtn.setText("♡"); // ♡
    likeBtn.setTextColor(Color.argb(140, 255, 255, 255));
    likeBtn.setTextSize(22);
    likeBtn.setGravity(Gravity.CENTER);
    likeBtn.setPadding(dp(4), 0, dp(4), 0);
    likeBtn.setOnClickListener(v -> { sendAction("like"); });
    controls.addView(likeBtn);

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

    // Mode button
    TextView modeBtn = new TextView(context);
    modeBtn.setText("\u21BB");
    modeBtn.setTextColor(Color.argb(140, 255, 255, 255));
    modeBtn.setTextSize(20);
    modeBtn.setGravity(Gravity.CENTER);
    modeBtn.setPadding(dp(4), 0, dp(4), 0);
    modeBtn.setOnClickListener(v -> { sendAction("changePlayMode"); });
    controls.addView(modeBtn);

    root.addView(controls);
    // Neri毛玻璃背景层: 模糊封面 + 暗色遮罩
    bgImage = new ImageView(context);
    bgImage.setScaleType(ImageView.ScaleType.CENTER_CROP);
    floatingView.addView(bgImage, new FrameLayout.LayoutParams(-1, -1));
    bgOverlay = new View(context);
    bgOverlay.setBackgroundColor(0x99000000); // 60% 暗色
    floatingView.addView(bgOverlay, new FrameLayout.LayoutParams(-1, -1));
    
    floatingView.addView(root, new FrameLayout.LayoutParams(-1, -1));
    floatingView.addView(expandBtn);

    // Drag - 仅顶部区域拖动窗口,进度条/按钮区域让子 View 处理
    floatingView.setOnTouchListener((v, ev) -> {
      switch (ev.getAction()) {
        case MotionEvent.ACTION_DOWN:
          // 只在窗口顶部 45% 区域(封面+歌名区)响应拖拽
          if (ev.getY() < v.getHeight() * 0.45f) {
            initialX = params.x; initialY = params.y;
            initialTouchX = ev.getRawX(); initialTouchY = ev.getRawY();
            return true;
          }
          return false; // 不拦截,让进度条/按钮处理
        case MotionEvent.ACTION_MOVE:
          if (initialTouchX > 0) {
            params.x = initialX + (int)(ev.getRawX() - initialTouchX);
            params.y = initialY + (int)(ev.getRawY() - initialTouchY);
            try { windowManager.updateViewLayout(floatingView, params); } catch (Exception ignored) {}
            return true;
          }
          return false;
        case MotionEvent.ACTION_UP:
        case MotionEvent.ACTION_CANCEL:
          initialTouchX = 0; initialTouchY = 0;
          return false;
      }
      return false;
    });

    try {
      windowManager.addView(floatingView, params);
      isShowing = true;
      // 启动原生 LRC 更新定时器(后台不卡)
      if (lrcUpdateTask == null) {
        lrcUpdateTask = new Runnable() {
          @Override public void run() {
            // 播放中自推进时间(app后台 JS 冻结时歌词继续走)
            if (isPlaying) {
              currentLyricProgress += 500;
              updateLrcNow();
            }
            new Handler(Looper.getMainLooper()).postDelayed(this, 500);
          }
        };
      }
      new Handler(Looper.getMainLooper()).postDelayed(lrcUpdateTask, 500);
      if (eventEmitter != null) {
        WritableMap ready = Arguments.createMap();
        eventEmitter.sendEvent("onMiniPlayerReady", ready);
      }
    } catch (Exception e) { Log.e(TAG, "show error", e); }
  }

  public void updatePlaybackInfo(String title, String artist, boolean playing, int progress, int maxProgress) { Log.d(TAG, "updateInfo prog=" + progress + " max=" + maxProgress + " title=" + title);
    write("MiniView", "INFO", "updateInfo: " + title + " - " + artist + " playing=" + playing + " prog=" + progress + " max=" + maxProgress);
    isPlaying = playing;
    new Handler(Looper.getMainLooper()).post(() -> {
      if (titleView != null) titleView.setText(title.isEmpty() ? "未播放" : title);
      if (artistView != null) artistView.setText(artist);
      if (playBtnContainer != null) {
        View icon = isPlaying ? pauseView : isPlayView;
        playBtnContainer.removeAllViews();
        playBtnContainer.addView(icon, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));
      }
      if (progressFill != null) {
        try {
          View parent = (View) progressFill.getParent();
          if (parent != null && parent.getWidth() > 0) {
            int pw = parent.getWidth();
            int fw = 0;
            if (maxProgress > 0) {
              fw = (int)((float)progress / maxProgress * pw);
            } else if (progress > 0) {
              fw = pw; // 没有总时长时占满
            }
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) progressFill.getLayoutParams();
            lp.width = Math.min(fw, pw);
            progressFill.requestLayout();
          }
        } catch (Exception e) {
          Log.w(TAG, "progress error: " + e.getMessage());
        }
      }
      // 更新时间显示(即使无总时长也显示当前时间)
      // 同步歌词进度(关键:否则歌词从0开始只靠定时器推进)
      if (progress > 0 && progress != currentLyricProgress) {
        currentLyricProgress = progress;
        if (!rawLrc.isEmpty()) updateLrcNow();
      }
      // 更新时间显示(即使无总时长也显示当前时间)
      if (timeText != null) {
        int nowS = (int)(progress / 1000);
        int maxS = (int)(maxProgress / 1000);
        String t = (nowS / 60) + ":" + String.format("%02d", nowS % 60);
        if (maxS > 0) t += " / " + (maxS / 60) + ":" + String.format("%02d", maxS % 60);
        timeText.setText(t);
      }
    });
  }

  public void updateCover(String path) { write("MiniView", "INFO", "updateCover: " + (path != null ? path.substring(Math.max(0, path.length()-30)) : "null"));
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
          if (bmp != null) { final android.graphics.Bitmap fb = bmp; new Handler(Looper.getMainLooper()).post(() -> {
            coverView.setImageBitmap(fb);
            setBlurredBackground(fb);
          }); }
        } else {
          is = new java.io.FileInputStream(path.replace("file://", ""));
          android.graphics.Bitmap bmp = android.graphics.BitmapFactory.decodeStream(is);
          is.close();
          if (bmp != null) { final android.graphics.Bitmap fb = bmp; new Handler(Looper.getMainLooper()).post(() -> {
            coverView.setImageBitmap(fb);
            setBlurredBackground(fb);
          }); }
        }
      } catch (Exception e) { Log.w(TAG, "cover: " + e.getMessage()); }
    }).start();
  }

  public void setLyricOffset(int offsetMs) {
    this.lyricOffsetMs = offsetMs;
  }

  public void setStyle(int bgColor, int lyricLines, String highlightColorStr) {
    setStyle(bgColor, lyricLines, highlightColorStr, 15, 6);
  }

  public void setStyle(int bgColor, int lyricLines, String highlightColorStr, int fontSize, int lineSpacing) {
    write("MiniView", "INFO", "setStyle lines=" + lyricLines + " fs=" + fontSize + " ls=" + lineSpacing);
    this.lyricMaxLines = lyricLines > 0 ? lyricLines : 3;
    this.lyricFontSize = fontSize > 0 ? fontSize : 13;
    this.lyricLineSpacing = lineSpacing > 0 ? lineSpacing : 6;
    new Handler(Looper.getMainLooper()).post(() -> {
      if (lrcView != null) {
        lrcView.setTextSize(lyricFontSize);
        lrcView.setMaxLines(lyricMaxLines);
        lrcView.setLineSpacing(dp(lyricLineSpacing), 1f);
      }
    });
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
        // 背景改为模糊封面+暗遮罩,不再用纯色
        if (bgOverlay != null) {
          bgOverlay.setBackgroundColor(0x99000000);
        }
      });
    }
  }

  // 原生 LRC 解析(后台不卡)
  private void updateLrcNow() {
    if (lrcView == null || rawLrc.isEmpty()) return;
    int timeSec = (currentLyricProgress + lyricOffsetMs) / 1000;
    String[] lines = rawLrc.split("\n");
    if (lines.length == 0) return;
    
    // 定位当前行
    int currentIdx = 0;
    for (int i = lines.length - 1; i >= 0; i--) {
      String line = lines[i];
      if (line.length() < 4 || line.charAt(0) != '[') continue;
      int p1 = line.indexOf(':');
      if (p1 < 3) continue;
      try {
        int min = Integer.parseInt(line.substring(1, p1));
        float sec = Float.parseFloat(line.substring(p1 + 1, p1 + 3));
        if ((min * 60 + (int)sec) <= timeSec) { currentIdx = i; break; }
      } catch (Exception ignored) {}
    }
    
    // 提取显示范围(当前行前后各2行)
    int start = Math.max(0, currentIdx - 2);
    int end = Math.min(lines.length, currentIdx + 3);
    java.util.List<String> texts = new java.util.ArrayList<>();
    java.util.List<Integer> lineStart = new java.util.ArrayList<>();
    StringBuilder sb = new StringBuilder();
    for (int i = start; i < end; i++) {
      String line = lines[i];
      int p = line.indexOf(']');
      if (p > 0 && line.charAt(0) == '[') {
        if (sb.length() > 0) sb.append("\n");
        lineStart.add(sb.length());
        texts.add(line.substring(p + 1).trim());
        sb.append(line.substring(p + 1).trim());
      }
    }
    if (sb.length() == 0) return;
    
    // 每次渲染应用样式设置(防止被覆盖)
    lrcView.setTextSize(lyricFontSize > 0 ? lyricFontSize : 13);
    lrcView.setMaxLines(lyricMaxLines > 0 ? lyricMaxLines : 3);
    lrcView.setLineSpacing(dp(lyricLineSpacing > 0 ? lyricLineSpacing : 6), 1f);
    
    // 高亮当前行
    String full = sb.toString();
    android.text.SpannableString ss = new android.text.SpannableString(full);
    int currentDisplayIdx = currentIdx - start;
    try {
      int hlStart = currentDisplayIdx >= 0 && currentDisplayIdx < lineStart.size() ? lineStart.get(currentDisplayIdx) : 0;
      int hlEnd = currentDisplayIdx >= 0 && currentDisplayIdx < lineStart.size()
        ? (currentDisplayIdx + 1 < lineStart.size() ? lineStart.get(currentDisplayIdx + 1) : full.length())
        : 0;
      if (gradientColors != null && gradientColors.length >= 2) {
        // 渐变高亮
        ss.setSpan(new GradientSpan(gradientColors), hlStart, hlEnd, 0);
      } else {
        ss.setSpan(new android.text.style.ForegroundColorSpan(highlightColor), hlStart, hlEnd, 0);
      }
      // 非当前行半透明
      for (int i = 0; i < lineStart.size(); i++) {
        if (i == currentDisplayIdx) continue;
        int s2 = lineStart.get(i);
        int e2 = i + 1 < lineStart.size() ? lineStart.get(i + 1) : full.length();
        ss.setSpan(new android.text.style.ForegroundColorSpan(0x99FFFFFF), s2, e2, 0);
      }
    } catch (Exception ignored) {}
    lrcView.setText(ss);
    lrcView.invalidate();
  }
  // 下采样放大实现自然模糊(Neri毛玻璃)
  private void setBlurredBackground(android.graphics.Bitmap src) {
    try {
      int w = src.getWidth(), h = src.getHeight();
      if (w <= 0 || h <= 0) return;
      android.graphics.Bitmap small = android.graphics.Bitmap.createScaledBitmap(src, Math.max(1, w/12), Math.max(1, h/12), true);
      android.graphics.Bitmap blurred = android.graphics.Bitmap.createScaledBitmap(small, w, h, true);
      if (blurred != null && bgImage != null) bgImage.setImageBitmap(blurred);
    } catch (Exception e) { Log.w(TAG, "blur bg: " + e.getMessage()); }
  }
  public void updateLrc(String text) {
    // 存储原始 LRC(带时间戳),由原生解析器定位歌词行并应用偏移
    this.rawLrc = text != null ? text : "";
    new Handler(Looper.getMainLooper()).post(() -> {
      if (lrcView == null) return;
      if (rawLrc.isEmpty()) {
        lrcView.setText("\u266A");
        return;
      }
      updateLrcNow();
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

  public void hide() { write("MiniView", "INFO", "hide");
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
