package cn.toside.music.mobile.logger;

import android.content.Context;
import android.os.Environment;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class NativeLoggerModule extends ReactContextBaseJavaModule {
  private static final String TAG = "[NativeLogger]";
  private static final String LOG_DIR = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS) + "/LXMusic_Logs";
  private static final long MAX_LOG_SIZE = 50 * 1024 * 1024L;

  // 静态自初始化:首次调用时自动创建文件
  private static boolean initialized = false;
  private static File logFile = null;

  public NativeLoggerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() { return "NativeLogger"; }

  // JS 调用以确认路径
  @ReactMethod
  public void getLogPath(Promise promise) {
    ensureInit();
    promise.resolve(logFile != null ? logFile.getAbsolutePath() : LOG_DIR);
  }

  private static synchronized void ensureInit() {
    if (initialized) return;
    initialized = true;
    try {
      File dir = new File(LOG_DIR);
      if (!dir.exists()) dir.mkdirs();
      String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
      logFile = new File(dir, "log_" + dateStr + ".log");
      // 写一条启动标记
      String timeStr = new SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault()).format(new Date());
      String line = "[" + timeStr + "][NativeLogger] Native logger auto-initialized\n";
      FileOutputStream fos = new FileOutputStream(logFile, true);
      fos.write(line.getBytes("UTF-8"));
      fos.close();
      Log.d(TAG, "Auto-init: " + logFile.getAbsolutePath());
    } catch (Exception e) {
      Log.e(TAG, "Auto-init failed", e);
    }
  }

  // 供其他原生模块调用的静态方法
  public static void write(String tag, String level, String message) {
    ensureInit();
    if (logFile == null) return;
    try {
      if (logFile.exists() && logFile.length() > MAX_LOG_SIZE) {
        String ts = String.valueOf(System.currentTimeMillis());
        File renamed = new File(logFile.getParent(), logFile.getName() + "." + ts + ".bak");
        logFile.renameTo(renamed);
        String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        logFile = new File(logFile.getParent(), "log_" + dateStr + ".log");
      }
      String timeStr = new SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault()).format(new Date());
      String line = "[" + timeStr + "][" + tag + "][" + level + "] " + message + "\n";
      FileOutputStream fos = new FileOutputStream(logFile, true);
      fos.write(line.getBytes("UTF-8"));
      fos.close();
    } catch (Exception e) {
      Log.e(TAG, "Write failed", e);
    }
  }
}
