package cn.toside.music.mobile.spectrum;

import android.content.Context;
import android.media.AudioManager;
import android.media.audiofx.Visualizer;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import javax.annotation.Nullable;

public class SpectrumModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext reactContext;
  private Visualizer visualizer;
  private boolean isListening = false;
  private int captureSize = 128;
  private int retryCount = 0;
  private static final int MAX_RETRIES = 8;
  private static final long RETRY_DELAY_MS = 1500;
  private static final String TAG = "SpectrumModule";
  private final Handler mainHandler = new Handler(Looper.getMainLooper());

  SpectrumModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "SpectrumModule";
  }

  @ReactMethod
  public void startListening(int audioSessionId, Promise promise) {
    stopInternal();
    retryCount = 0;
    tryCreateVisualizer(audioSessionId, promise);
  }

  private void tryCreateVisualizer(int audioSessionId, Promise promise) {
    try {
      int sessionId = audioSessionId > 0 ? audioSessionId : 0;

      // First try: create with session 0
      visualizer = new Visualizer(sessionId);
      int[] sizes = Visualizer.getCaptureSizeRange();
      captureSize = sizes[1] > 256 ? 256 : sizes[1];

      int status = visualizer.setCaptureSize(captureSize);
      if (status != Visualizer.SUCCESS) {
        captureSize = visualizer.getCaptureSize();
      }

      // Set listener BEFORE enabling
      visualizer.setDataCaptureListener(
        new Visualizer.OnDataCaptureListener() {
          @Override
          public void onWaveFormDataCapture(Visualizer visualizer, byte[] waveform, int samplingRate) {}

          @Override
          public void onFftDataCapture(Visualizer visualizer, byte[] fft, int samplingRate) {
            sendSpectrumData(fft, samplingRate);
          }
        },
        Visualizer.getMaxCaptureRate() / 3, // ~40ms interval
        false,
        true
      );

      visualizer.setEnabled(true);
      isListening = true;
      retryCount = 0;
      Log.d(TAG, "Visualizer started successfully (session=" + sessionId + ")");
      promise.resolve(true);
    } catch (Exception e) {
      int attempt = retryCount + 1;
      Log.w(TAG, "Visualizer attempt " + attempt + "/" + MAX_RETRIES + " failed: " + e.getMessage());

      if (retryCount < MAX_RETRIES) {
        retryCount++;
        mainHandler.postDelayed(() -> tryCreateVisualizer(audioSessionId, promise), RETRY_DELAY_MS);
      } else {
        Log.e(TAG, "Visualizer failed after " + MAX_RETRIES + " attempts");
        promise.reject("SPECTRUM_UNAVAILABLE", "Visualizer engine not available on this device");
      }
    }
  }

  @ReactMethod
  public void stopListening(Promise promise) {
    stopInternal();
    promise.resolve(true);
  }

  private void stopInternal() {
    try {
      if (visualizer != null) {
        visualizer.setEnabled(false);
        visualizer.release();
        visualizer = null;
      }
      isListening = false;
      retryCount = 0;
    } catch (Exception e) {
      Log.e(TAG, "Error stopping: " + e.getMessage());
    }
  }

  private void sendSpectrumData(byte[] fft, int samplingRate) {
    if (!reactContext.hasActiveReactInstance()) return;

    int bins = fft.length / 2;
    int targetBins = 32;
    WritableArray magnitudes = Arguments.createArray();

    for (int i = 0; i < targetBins; i++) {
      int idx = (i * bins) / targetBins;
      if (idx >= bins) idx = bins - 1;
      int realIdx = idx * 2;
      if (realIdx + 1 < fft.length) {
        byte real = fft[realIdx];
        byte imag = fft[realIdx + 1];
        float normalized = (float) Math.min(Math.sqrt(real * real + imag * imag) / 128.0, 1.0);
        magnitudes.pushDouble(normalized);
      } else {
        magnitudes.pushDouble(0);
      }
    }
    sendEvent("onSpectrumData", magnitudes);
  }

  private void sendEvent(String eventName, @Nullable WritableArray params) {
    if (reactContext.hasActiveReactInstance()) {
      reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    }
  }

  @ReactMethod
  public void addListener(String eventName) {}
  @ReactMethod
  public void removeListeners(Integer count) {}
}
