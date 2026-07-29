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

/**
 * NativeLogger - 原生日志模块
 * 所有原生模块(CarKey/MediaInteraction/MiniPlayer)通过此模块写日志
 * 日志文件保存在 Download/LXMusic_Logs/
 */
public class NativeLoggerModule extends ReactContextBaseJavaModule {
  private static final String TAG = "[NativeLogger]";
  private static final String LOG_DIR = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS) + "/LXMusic_Logs";
  private static final long MAX_LOG_SIZE = 50 * 1024 * 1024L; // 50MB
  private static boolean enabled = false;
  private static File logFile = null;

  public NativeLoggerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() { return "NativeLogger"; }

  // 从 JS 层调用以启用/禁用原生日志
  @ReactMethod
  public void setEnabled(boolean enable, Promise promise) {
    enabled = enable;
    if (enable) {
      try {
        File dir = new File(LOG_DIR);
        if (!dir.exists()) dir.mkdirs();
        String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        logFile = new File(dir, "log_" + dateStr + ".log");

        // 写入一条启动日志
        writeNative("NLogger", "Native logger enabled");
        Log.d(TAG, "Native logger enabled, file: " + logFile.getAbsolutePath());
        promise.resolve(logFile.getAbsolutePath());
      } catch (Exception e) {
        Log.e(TAG, "Failed to init native logger", e);
        promise.reject("ERROR", e.getMessage());
      }
    } else {
      logFile = null;
      promise.resolve(true);
    }
  }

  // 供其他原生模块调用的静态方法
  public static void write(String tag, String level, String message) {
    if (!enabled || logFile == null) return;
    writeNative(tag, "[" + level + "] " + message);
  }

  private static void writeNative(String tag, String message) {
    if (logFile == null) return;
    try {
      if (logFile.exists() && logFile.length() > MAX_LOG_SIZE) {
        String ts = String.valueOf(System.currentTimeMillis());
        File renamed = new File(logFile.getParent(), logFile.getName() + "." + ts + ".bak");
        logFile.renameTo(renamed);
        logFile = new File(logFile.getParent(), new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date()) + ".log");
      }
      String timeStr = new SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault()).format(new Date());
      String line = "[" + timeStr + "][" + tag + "] " + message + "\n";
      FileOutputStream fos = new FileOutputStream(logFile, true);
      OutputStreamWriter writer = new OutputStreamWriter(fos, "UTF-8");
      writer.write(line);
      writer.flush();
      writer.close();
      fos.close();
    } catch (Exception e) {
      Log.e(TAG, "Write failed", e);
    }
  }

}
