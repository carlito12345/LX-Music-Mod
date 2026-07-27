package cn.toside.music.mobile.boot;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
      Log.d("[Boot]", "Boot completed, starting service...");
      try {
        Class.forName("cn.toside.music.mobile.miniplayer.MiniPlayerService").getMethod("start", Context.class, int.class, int.class).invoke(null, context, 500, 800);
      } catch (Exception e) { Log.w("[Boot]", "Svc start failed: " + e.getMessage()); }
      Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
      if (launchIntent != null) {
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(launchIntent);
      }
    }
  }
}
