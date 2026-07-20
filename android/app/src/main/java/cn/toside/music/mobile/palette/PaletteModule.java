package cn.toside.music.mobile.palette;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import androidx.palette.graphics.Palette;
import com.facebook.react.bridge.*;
import java.io.InputStream;
import java.net.URL;
import java.net.HttpURLConnection;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class PaletteModule extends ReactContextBaseJavaModule {
  private static final ExecutorService executor = Executors.newSingleThreadExecutor();

  public PaletteModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "PaletteModule";
  }

  @ReactMethod
  public void getDominantColor(String imageUrl, final Promise promise) {
    executor.execute(() -> {
      try {
        HttpURLConnection conn = (HttpURLConnection) new URL(imageUrl).openConnection();
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);
        conn.connect();
        InputStream is = conn.getInputStream();
        // 缩小图片以加快速度
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inSampleSize = 8;
        Bitmap bitmap = BitmapFactory.decodeStream(is, null, opts);
        is.close();
        conn.disconnect();
        if (bitmap == null) {
          promise.resolve("#1a1a2e");
          return;
        }
        Palette palette = Palette.from(bitmap).generate();
        int color = palette.getDominantColor(0xFF1a1a2e);
        bitmap.recycle();
        String hex = String.format("#%06X", 0xFFFFFF & color);
        promise.resolve(hex);
      } catch (Exception e) {
        promise.resolve("#1a1a2e");
      }
    });
  }
}
