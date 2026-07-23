package cn.toside.music.mobile.usb;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Environment;
import android.os.storage.StorageManager;
import android.os.storage.StorageVolume;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class USBModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  private boolean isListening = false;

  USBModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "USBModule";
  }

  @ReactMethod
  public void startListening(Promise promise) {
    if (isListening) {
      promise.resolve(true);
      return;
    }
    try {
      IntentFilter filter = new IntentFilter();
      filter.addAction(Intent.ACTION_MEDIA_MOUNTED);
      filter.addAction(Intent.ACTION_MEDIA_UNMOUNTED);
      filter.addAction(Intent.ACTION_MEDIA_EJECT);
      filter.addDataScheme("file");
      reactContext.registerReceiver(usbReceiver, filter);
      isListening = true;
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("USB_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void stopListening(Promise promise) {
    try {
      if (isListening) {
        reactContext.unregisterReceiver(usbReceiver);
        isListening = false;
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("USB_ERROR", e.getMessage());
    }
  }

  @ReactMethod
  public void getExternalStoragePaths(Promise promise) {
    try {
      WritableArray paths = Arguments.createArray();
      StorageManager storageManager = (StorageManager) reactContext.getSystemService(Context.STORAGE_SERVICE);
      if (storageManager != null) {
        List<StorageVolume> volumes = storageManager.getStorageVolumes();
        for (StorageVolume volume : volumes) {
          try {
            File volumeFile = volume.getDirectory();
            if (volumeFile != null && !volumeFile.getAbsolutePath().startsWith("/emulated/")
                && !volumeFile.getAbsolutePath().equals(Environment.getExternalStorageDirectory().getAbsolutePath())) {
              paths.pushString(volumeFile.getAbsolutePath());
            }
          } catch (Exception e) {}
        }
      }
      // Fallback: check common mount points
      String[] mountPoints = {"/mnt/media_rw", "/storage", "/mnt/usb"};
      for (String base : mountPoints) {
        File dir = new File(base);
        if (dir.exists() && dir.isDirectory()) {
          for (File f : dir.listFiles()) {
            String p = f.getAbsolutePath();
            if (!p.contains("emulated") && !p.contains("self") && f.isDirectory()) {
              if (!isInPaths(paths, p)) {
                paths.pushString(p);
              }
            }
          }
        }
      }
      promise.resolve(paths);
    } catch (Exception e) {
      promise.reject("USB_ERROR", e.getMessage());
    }
  }

  private boolean isInPaths(WritableArray paths, String path) {
    for (int i = 0; i < paths.size(); i++) {
      if (paths.getString(i) != null && path.startsWith(paths.getString(i))) return true;
    }
    return false;
  }

  private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      String action = intent.getAction();
      String path = intent.getData() != null ? intent.getData().getPath() : "";

      WritableMap params = Arguments.createMap();
      params.putString("action", action);
      params.putString("path", path);

      if (Intent.ACTION_MEDIA_MOUNTED.equals(action)) {
        Log.d("[USB]", "Mounted: " + path);
        sendEvent("onUSBMounted", params);
      } else if (Intent.ACTION_MEDIA_UNMOUNTED.equals(action) || Intent.ACTION_MEDIA_EJECT.equals(action)) {
        Log.d("[USB]", "Unmounted: " + path);
        sendEvent("onUSBUnmounted", params);
      }
    }
  };

  private void sendEvent(String eventName, WritableMap params) {
    if (reactContext.hasActiveReactInstance()) {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
    }
  }

  @ReactMethod
  public void addListener(String eventName) {}
  @ReactMethod
  public void removeListeners(Integer count) {}
}
