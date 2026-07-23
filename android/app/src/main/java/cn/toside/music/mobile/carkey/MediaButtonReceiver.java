package cn.toside.music.mobile.carkey;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.view.KeyEvent;

/**
 * 方向盘媒体按键接收器 - 在应用未启动时也能响应
 */
public class MediaButtonReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    String action = intent.getAction();
    if (Intent.ACTION_MEDIA_BUTTON.equals(action)) {
      KeyEvent event = intent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
      if (event != null && event.getAction() == KeyEvent.ACTION_DOWN) {
        int keyCode = event.getKeyCode();
        Log.d("[CarKey]", "Media button pressed: " + keyCode);

        // 只有播放/暂停键才启动应用
        if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
            || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY
            || keyCode == 85) {
          Log.d("[CarKey]", "Play button pressed, launching app...");
          Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
          if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(launchIntent);
          }
        }
      }
    }
  }
}
