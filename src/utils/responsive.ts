/**
 * 响应式工具 v3 - 自适应 DPI 和屏幕大小
 * 基准: 360dp x 690dp (标准手机竖屏)
 * 安全fallback: 如果 Dimensions 返回 0 则使用 360
 */
import { Dimensions } from 'react-native'

const { width: _W, height: _H } = Dimensions.get('window')
const SCREEN_W = Math.max(_W, 320) || 360
const SCREEN_H = Math.max(_H, 480) || 690
const BASE_W = 360
const BASE_H = 690
const wScale = SCREEN_W / BASE_W
const hScale = SCREEN_H / BASE_H

/** 间距缩放 */
export const rs = (px: number) => {
  const s = 1 + (wScale - 1) * 0.35
  return Math.round(px * Math.min(s, 1.6))
}

/** 字体缩放 */
export const rf = (px: number) => {
  const s = 1 + (wScale - 1) * 0.3
  return Math.round(px * Math.min(s, 1.5))
}

/** 圆角缩放 */
export const rr = (px: number) => {
  const s = 1 + (wScale - 1) * 0.4
  return Math.round(px * Math.min(s, 1.8))
}

/** 垂直间距缩放 */
export const rv = (px: number) => {
  const s = 1 + (hScale - 1) * 0.3
  return Math.round(px * Math.min(s, 1.6))
}
