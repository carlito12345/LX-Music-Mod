package cn.toside.music.mobile.permission;

import android.Manifest;
import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

/**
 * PermissionModule - 统一的权限检测与跳转模块
 * 支持: 悬浮窗/通知/所有文件访问/电池优化/后台运行
 */
@ReactModule(name = PermissionModule.NAME)
public class PermissionModule extends ReactContextBaseJavaModule {
  public static final String NAME = "PermissionModule";

  public PermissionModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  // ========== 悬浮窗权限 ==========
  @ReactMethod
  public void hasOverlayPermission(Promise promise) {
    try {
      promise.resolve(Settings.canDrawOverlays(getReactApplicationContext()));
    } catch (Exception e) {
      promise.reject("OVERLAY_CHECK_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void openOverlaySettings() {
    try {
      Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:" + getReactApplicationContext().getPackageName()));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getReactApplicationContext().startActivity(intent);
    } catch (Exception ignored) {}
  }

  // ========== 通知权限 (Android 13+) ==========
  @ReactMethod
  public void hasNotificationPermission(Promise promise) {
    try {
      if (Build.VERSION.SDK_INT >= 33) {
        boolean granted = ContextCompat.checkSelfPermission(
            getReactApplicationContext(), Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED;
        promise.resolve(granted);
      } else {
        promise.resolve(true); // 13 以下默认授予
      }
    } catch (Exception e) {
      promise.reject("NOTIFICATION_CHECK_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void openNotificationSettings() {
    try {
      Intent intent = new Intent();
      if (Build.VERSION.SDK_INT >= 26) {
        intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
        intent.putExtra(Settings.EXTRA_APP_PACKAGE, getReactApplicationContext().getPackageName());
      } else if (Build.VERSION.SDK_INT >= 21) {
        intent.setAction("android.settings.APP_NOTIFICATION_SETTINGS");
        intent.putExtra("app_package", getReactApplicationContext().getPackageName());
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getReactApplicationContext().startActivity(intent);
    } catch (Exception ignored) {}
  }

  // ========== 所有文件访问权限 (Android 11+) ==========
  @ReactMethod
  public void hasManageExternalStoragePermission(Promise promise) {
    try {
      if (Build.VERSION.SDK_INT >= 30) {
        // MANAGE_EXTERNAL_STORAGE 是特殊权限,必须用 Environment.isExternalStorageManager() 检测
        boolean granted = android.os.Environment.isExternalStorageManager();
        promise.resolve(granted);
      } else {
        promise.resolve(true); // Android 10 及以下不需要
      }
    } catch (Exception e) {
      promise.reject("MANAGE_STORAGE_CHECK_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void openManageExternalStorageSettings() {
    try {
      if (Build.VERSION.SDK_INT >= 30) {
        Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
            Uri.parse("package:" + getReactApplicationContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
      }
    } catch (Exception e) {
      // 部分机型没有该 ACTION,直接打开应用详情
      openAppDetails();
    }
  }

  // ========== 电池优化/后台运行 ==========
  @ReactMethod
  public void hasIgnoreBatteryOptimization(Promise promise) {
    try {
      PowerManager pm = (PowerManager) getReactApplicationContext().getSystemService(Context.POWER_SERVICE);
      if (pm == null) { promise.resolve(false); return; }
      promise.resolve(pm.isIgnoringBatteryOptimizations(getReactApplicationContext().getPackageName()));
    } catch (Exception e) {
      promise.reject("BATTERY_CHECK_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void openBatteryOptimizationSettings() {
    try {
      Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          Uri.parse("package:" + getReactApplicationContext().getPackageName()));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getReactApplicationContext().startActivity(intent);
    } catch (Exception ignored) {}
  }

  // ========== 通用: 打开应用详情页 ==========
  @ReactMethod
  public void openAppDetails() {
    try {
      Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
          Uri.parse("package:" + getReactApplicationContext().getPackageName()));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getReactApplicationContext().startActivity(intent);
    } catch (Exception ignored) {}
  }
}
