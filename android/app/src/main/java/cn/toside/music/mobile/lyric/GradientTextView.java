package cn.toside.music.mobile.lyric;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.LinearGradient;
import android.graphics.Shader;
import android.text.TextPaint;
import android.widget.TextView;

@SuppressLint("AppCompatCustomView")
public class GradientTextView extends TextView {
  private int[] gradientColors = null;
  private float[] gradientPositions = null;
  private boolean useGradient = false;

  public GradientTextView(Context context) {
    super(context);
  }

  public void setGradientColors(int[] colors, float[] positions) {
    this.gradientColors = colors;
    this.gradientPositions = positions;
    this.useGradient = colors != null && colors.length >= 2;
    invalidate();
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);
    applyGradient();
  }

  private void applyGradient() {
    if (!useGradient) {
      getPaint().setShader(null);
      return;
    }
    TextPaint paint = getPaint();
    int width = getMeasuredWidth();
    int height = getMeasuredHeight();
    if (width <= 0 || height <= 0) return;
    LinearGradient shader = new LinearGradient(0, 0, width, 0, gradientColors, gradientPositions, Shader.TileMode.CLAMP);
    paint.setShader(shader);
    invalidate();
  }
}
