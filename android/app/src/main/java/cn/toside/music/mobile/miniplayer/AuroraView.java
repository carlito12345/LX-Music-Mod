package cn.toside.music.mobile.miniplayer;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.view.View;

/**
 * AuroraView - 原生极光背景
 * 多个径向渐变光斑相位差漂移+呼吸,Canvas 绘制,零依赖
 */
public class AuroraView extends View {
  private static final int BLOB_COUNT = 4;
  private int[] colors = { 0xFF00E676, 0xFF00B0FF, 0xFFD500F9, 0xFF00E676 };
  private final Paint[] paints = new Paint[BLOB_COUNT];
  private final float[] cx = new float[BLOB_COUNT];  // 中心 X (0-1)
  private final float[] cy = new float[BLOB_COUNT];  // 中心 Y (0-1)
  private final float[] radius = new float[BLOB_COUNT];
  private final float[] phase = new float[BLOB_COUNT];
  private final float[] amplitude = new float[BLOB_COUNT];
  private final float[] baseAlpha = new float[BLOB_COUNT];
  private ValueAnimator animator;
  private float progress = 0f;
  private float w = 1f, h = 1f;

  public AuroraView(Context context) {
    super(context);
    for (int i = 0; i < BLOB_COUNT; i++) {
      paints[i] = new Paint(Paint.ANTI_ALIAS_FLAG);
      cx[i] = 0.25f + (i % 2) * 0.5f;
      cy[i] = 0.3f + (i % 3) * 0.2f;
      radius[i] = 0.6f + (i % 3) * 0.15f;
      phase[i] = i * 1.57f; // 相位差错开 90°
      amplitude[i] = 0.12f + (i % 2) * 0.06f;
      baseAlpha[i] = 0.5f + (i % 3) * 0.1f;
    }
    animator = ValueAnimator.ofFloat(0f, 1f);
    animator.setDuration(14000);
    animator.setRepeatCount(ValueAnimator.INFINITE);
    animator.addUpdateListener(a -> {
      progress = (float) a.getAnimatedValue();
      invalidate();
    });
    animator.start();
  }

  public void setColors(int[] newColors) {
    if (newColors != null && newColors.length >= 2) {
      int[] use = new int[BLOB_COUNT];
      for (int i = 0; i < BLOB_COUNT; i++) use[i] = newColors[i % newColors.length];
      colors = use;
    }
  }

  public void setIntensity(float intensity) {
    for (int i = 0; i < BLOB_COUNT; i++) {
      amplitude[i] = (0.12f + (i % 2) * 0.06f) * Math.max(0.1f, Math.min(2f, intensity));
    }
  }

  @Override protected void onSizeChanged(int width, int height, int ow, int oh) {
    super.onSizeChanged(width, height, ow, oh);
    w = Math.max(width, 1);
    h = Math.max(height, 1);
  }

  @Override protected void onDraw(Canvas canvas) {
    super.onDraw(canvas);
    float t = progress * (float) Math.PI * 2f;
    for (int i = 0; i < BLOB_COUNT; i++) {
      float sin = (float) Math.sin(t + phase[i]);
      float sin2 = (float) Math.sin(t * 0.7f + phase[i] * 1.3f);
      float x = (cx[i] + sin * amplitude[i]) * w;
      float y = (cy[i] + sin2 * amplitude[i] * 0.8f) * h;
      float r = radius[i] * Math.max(w, h) * 0.55f;
      // 呼吸透明度
      float alpha = baseAlpha[i] * (0.85f + 0.15f * (float) Math.sin(t * 0.5f + phase[i]));
      alpha = Math.max(0.08f, Math.min(1f, alpha));
      paints[i].setShader(new RadialGradient(x, y, r,
          withAlpha(colors[i], (int) (alpha * 255)),
          withAlpha(colors[i], 0),
          Shader.TileMode.CLAMP));
      canvas.drawCircle(x, y, r, paints[i]);
    }
  }

  private int withAlpha(int color, int alpha) {
    return (color & 0x00FFFFFF) | (alpha << 24);
  }

  @Override protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    if (animator != null) { animator.cancel(); animator = null; }
  }
}
