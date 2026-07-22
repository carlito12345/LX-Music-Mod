/**
 * 颜色对比度计算工具
 * 根据背景亮度自动选择合适的文字颜色
 */

// 将 hex 颜色转换为 RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// 计算相对亮度 (0-1)
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0.5

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

// 根据背景颜色自动选择文字颜色
export function getContrastTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  // 亮度 > 0.5 使用深色文字,否则使用浅色文字
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

// 根据背景颜色生成合适的次要文字颜色(带透明度)
export function getSecondaryTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  return luminance > 0.5 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.75)'
}

// 根据背景颜色生成合适的控制按钮颜色
export function getControlColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

// 生成磨砂玻璃背景色(基于背景色)
export function getFrostedGlassBg(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  return luminance > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)'
}

// 生成磨砂玻璃边框色
export function getFrostedGlassBorder(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  return luminance > 0.5 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
}
