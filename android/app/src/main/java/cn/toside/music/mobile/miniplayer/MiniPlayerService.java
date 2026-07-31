package cn.toside.music.mobile.miniplayer;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import static cn.toside.music.mobile.logger.NativeLoggerModule.write;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class MiniPlayerService extends Service implements MiniPlayerView.MiniPlayerCallback {
  private static final String TAG = "[MiniPlayerSvc]";
  private static final String CHANNEL_ID = "mini_player_channel";
  private static final int NOTIFY_ID = 1001;
  public static final String ACTION_BUTTON = "cn.toside.music.mobile.MINI_PLAYER_BUTTON";
  public static final String EXTRA_ACTION = "button_action";

  private static MiniPlayerView miniPlayerView = null;
  public static boolean isRunning = false;
  private int initialW = 500, initialH = 900;

  @Override
  public void onCreate() {
    super.onCreate();
    Log.d(TAG, "Service onCreate"); write("MiniSvc", "INFO", "Service onCreate");
    try {
      createNotificationChannel();
      startForeground(NOTIFY_ID, buildNotification());
    } catch (Exception e) {
      Log.e(TAG, "startForeground FAILED: " + e.getMessage());
    }
    isRunning = true;
    // 窗口创建统一由 onStartCommand("SHOW") 处理,避免竞态产生孤儿窗口
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent != null) {
      String action = intent.getAction();
      if ("HIDE".equals(action)) { write("MiniSvc", "INFO", "Action: HIDE"); hideView(); stopForeground(true); stopSelf(); }
      else if ("REFRESH".equals(action)) {
        // App 请求刷新:小窗已存在则保持,等待App推送数据
        Log.d(TAG, "Refresh requested");
      }
      else if ("SHOW".equals(action)) { write("MiniSvc", "INFO", "Action: SHOW");
        initialW = intent.getIntExtra("width", 500);
        initialH = intent.getIntExtra("height", 800);
        if (miniPlayerView != null && miniPlayerView.isAlive()) {
          Log.d(TAG, "窗口存活(已显示或创建中),跳过");
        } else {
          // 无窗口 或 死对象 → 清理重建
          Log.d(TAG, "重建窗口 (view=" + (miniPlayerView != null ? "dead" : "null") + ")");
          if (miniPlayerView != null) { miniPlayerView.hide(); miniPlayerView = null; }
          ensureView();
          miniPlayerView.show(false, initialW, initialH);
          miniPlayerView.updatePlaybackInfo("加载中...", "等待数据同步", false, 0, 0);
        }
      }
    }
    return START_STICKY;
  }

  @Override
  public void onTaskRemoved(Intent rootIntent) {
    super.onTaskRemoved(rootIntent);
    Log.d(TAG, "Task removed, restarting service..."); write("MiniSvc", "INFO", "Task removed - restarting");
    // 重新启动前台服务(用户划掉任务时,服务继续运行)
    ensureView();
    if (miniPlayerView != null) miniPlayerView.show(false, initialW, initialH);
  }

  @Override
  public void onDestroy() { super.onDestroy(); hideView(); isRunning = false; }

  @Nullable @Override public IBinder onBind(Intent intent) { return null; }

  @Override
  public void onAction(String action) {
    Intent i = new Intent(ACTION_BUTTON);
    i.putExtra(EXTRA_ACTION, action);
    i.setPackage(getPackageName());
    sendBroadcast(i);
  }

  @Override
  public void onSeek(double ratio) {
    Intent i = new Intent(ACTION_BUTTON);
    i.putExtra(EXTRA_ACTION, "seek");
    i.putExtra("ratio", ratio);
    i.setPackage(getPackageName());
    sendBroadcast(i);
  }

  @Override
  public void onExpand() {
    // 关闭小窗service,拉起App主页
    Log.d(TAG, "Expand: closing service, launching app");
    Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
    if (launchIntent != null) {
      launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      startActivity(launchIntent);
    }
    hideView();
    stopForeground(true);
    stopSelf();
  }

  private void ensureView() {
    if (miniPlayerView == null) {
      miniPlayerView = new MiniPlayerView(this, null);
      miniPlayerView.setCallback(this);
    }
  }

  private void hideView() { if (miniPlayerView != null) { miniPlayerView.hide(); miniPlayerView = null; } }

  public static boolean hasView() {
    return miniPlayerView != null && miniPlayerView.isAlive();
  }

  public static void updatePlaybackInfo(String t, String a, boolean p, int progress, int maxP) {
    if (miniPlayerView != null) miniPlayerView.updatePlaybackInfo(t, a, p, progress, maxP);
  }
  public static void updateCover(String path) { if (miniPlayerView != null) miniPlayerView.updateCover(path); }
  public static void updateLrc(String text) { if (miniPlayerView != null) miniPlayerView.updateLrc(text); }
  public static void setStyle(int bg, int lines, String hc) {
    if (miniPlayerView != null) miniPlayerView.setStyle(bg, lines, hc, 15, 6);
  }
  public static void setStyle(int bg, int lines, String hc, int fontSize, int lineSpacing) {
    if (miniPlayerView != null) miniPlayerView.setStyle(bg, lines, hc, fontSize, lineSpacing);
  }
  public static void setLyricOffset(int offsetMs) {
    if (miniPlayerView != null) miniPlayerView.setLyricOffset(offsetMs);
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "迷你播放器", NotificationManager.IMPORTANCE_LOW);
      ch.setDescription("迷你播放器后台常驻");
      ch.setShowBadge(false);
      NotificationManager nm = getSystemService(NotificationManager.class);
      if (nm != null) nm.createNotificationChannel(ch);
    }
  }

  private Notification buildNotification() {
    return new NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("迷你播放器")
      .setContentText("正在运行")
      .setSmallIcon(android.R.drawable.ic_media_play)
      .setOngoing(true).setPriority(NotificationCompat.PRIORITY_LOW)
      .build();
  }

  public static void start(Context ctx, int w, int h) {
    Intent i = new Intent(ctx, MiniPlayerService.class);
    i.setAction("SHOW"); i.putExtra("width", w); i.putExtra("height", h);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(i);
    else ctx.startService(i);
  }

  public static void stop(Context ctx) {
    Intent i = new Intent(ctx, MiniPlayerService.class);
    i.setAction("HIDE"); ctx.startService(i);
  }
}
