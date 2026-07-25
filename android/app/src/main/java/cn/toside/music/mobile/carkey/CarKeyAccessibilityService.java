package cn.toside.music.mobile.carkey;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.util.Log;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * 无障碍服务 - 独立捕获方向盘按键事件
 * 需在系统设置→无障碍→LX Music中手动开启
 * 无需Root、无需GIB
 */
public class CarKeyAccessibilityService extends AccessibilityService {
  private static final String TAG = "[CarKey]";

  @Override
  public void onCreate() {
    super.onCreate();
    Log.d(TAG, "AccessibilityService created");
  }

  @Override
  public void onAccessibilityEvent(AccessibilityEvent event) {
    // 不需要处理UI事件
  }

  @Override
  public void onInterrupt() {
    Log.d(TAG, "AccessibilityService interrupted");
  }

  @Override
  public void onDestroy() {
    Log.d(TAG, "AccessibilityService destroyed");
    super.onDestroy();
  }

  @Override
  protected boolean onKeyEvent(KeyEvent event) {
    // Geely OneOS API 已连接时,不处理按键(避免双重触发)
    if (GeelyCarKeyManager.isInstanceConnected()) {
      return false;
    }
    
    if (event.getAction() == KeyEvent.ACTION_DOWN) {
      int keyCode = event.getKeyCode();
      String action = mapToAction(keyCode);
      if (action != null) {
        Log.d(TAG, "Key captured: " + keyCode + " -> " + action);
        CarKeyBridge.sendKeyEvent(keyCode, action, "AccessibilityService");
        return true; // 消费按键,防止传给其他应用
      }
    }
    return super.onKeyEvent(event);
  }

  private String mapToAction(int keyCode) {
    // Geely/ECarX 自定义键值
    if (keyCode == 200087) return "next";
    if (keyCode == 200088) return "previous";
    if (keyCode == 200085) return "playPause";
    if (keyCode == 200600) return "playPause"; // 多功能键
    if (keyCode == 210005) return "next";      // seek next
    if (keyCode == 210006) return "previous";  // seek prev

    // 标准 Android 媒体键
    if (keyCode == KeyEvent.KEYCODE_MEDIA_NEXT || keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) return "next";
    if (keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS || keyCode == KeyEvent.KEYCODE_MEDIA_REWIND) return "previous";
    if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY ||
        keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE || keyCode == KeyEvent.KEYCODE_HEADSETHOOK) return "playPause";
    if (keyCode == KeyEvent.KEYCODE_MEDIA_STOP) return "stop";

    return null; // 不感兴趣的键
  }
}
