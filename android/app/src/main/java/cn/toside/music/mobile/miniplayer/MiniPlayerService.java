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
  private int initialW = 500, initialH = 800;

  @Override
  public void onCreate() {
    super.onCreate();
    Log.d(TAG, "Service created");
    createNotificationChannel();
    startForeground(NOTIFY_ID, buildNotification());
    isRunning = true;
    ensureView();
    if (miniPlayerView != null) miniPlayerView.show(false, initialW, initialH);
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent != null) {
      String action = intent.getAction();
      if ("HIDE".equals(action)) { hideView(); stopSelf(); }
      else if ("SHOW".equals(action)) {
        initialW = intent.getIntExtra("width", 500);
        initialH = intent.getIntExtra("height", 800);
        ensureView();
        if (miniPlayerView != null) miniPlayerView.show(false, initialW, initialH);
      }
    }
    return START_STICKY;
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

  private void ensureView() {
    if (miniPlayerView == null) {
      miniPlayerView = new MiniPlayerView(this, null);
      miniPlayerView.setCallback(this);
    }
  }

  private void hideView() { if (miniPlayerView != null) { miniPlayerView.hide(); miniPlayerView = null; } }

  public static void updatePlaybackInfo(String t, String a, boolean p, int progress, int maxP) {
    if (miniPlayerView != null) miniPlayerView.updatePlaybackInfo(t, a, p, progress, maxP);
  }
  public static void updateCover(String path) { if (miniPlayerView != null) miniPlayerView.updateCover(path); }
  public static void updateLrc(String text) { if (miniPlayerView != null) miniPlayerView.updateLrc(text); }
  public static void setStyle(int bg, int lines, String hc) {
    if (miniPlayerView != null) miniPlayerView.setStyle(bg, lines, hc);
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
