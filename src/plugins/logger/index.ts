/**
 * Logger - 日志系统
 * 输出日志文件到 Download/LXMusic_Logs/
 */
import RNFS from 'react-native-fs'
import { Platform } from 'react-native'

const LOG_DIR = RNFS.DownloadDirectoryPath + '/LXMusic_Logs'
const MAX_LOG_SIZE = 5 * 1024 * 1024 // 5MB 单个日志上限
const MAX_LOG_FILES = 7 // 保留最近 7 天

let logQueue: string[] = []
let isWriting = false
let todayStr = ''

const getDateStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getTimeStr = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

// 日志配置
const config = {
  enabled: false as boolean,
  level: 'DEBUG' as LogLevel,  // 最低记录级别
  maxLines: 2000,              // 内存保留行数
}

export const setEnabled = (v: boolean) => { config.enabled = v }
export const setLevel = (v: LogLevel) => { config.level = v }

const LEVEL_ORDER: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }

const shouldLog = (level: LogLevel) => LEVEL_ORDER[level] >= LEVEL_ORDER[config.level]

// 确保目录存在
const ensureDir = async () => {
  try {
    const exists = await RNFS.exists(LOG_DIR)
    if (!exists) await RNFS.mkdir(LOG_DIR)
  } catch {}
}

// 清理旧日志文件
const cleanOldLogs = async () => {
  try {
    const files = await RNFS.readDir(LOG_DIR)
    const logFiles = files.filter(f => f.isFile() && f.name.endsWith('.log'))
      .sort((a, b) => b.mtime - a.mtime)
    while (logFiles.length > MAX_LOG_FILES) {
      const old = logFiles.pop()
      if (old) await RNFS.unlink(old.path).catch(() => {})
    }
  } catch {}
}

// 写入队列
const writeLog = async (level: LogLevel, tag: string, message: string) => {
  if (!config.enabled || !shouldLog(level)) return

  const dateStr = getDateStr()
  const timeStr = getTimeStr()
  const line = `[${dateStr} ${timeStr}][${level}][${tag}] ${message}\n`

  logQueue.push(line)
  if (logQueue.length > config.maxLines) logQueue.shift()

  if (!isWriting) {
    isWriting = true
    await flushLogs(dateStr)
    isWriting = false
  }
}

const flushLogs = async (dateStr: string) => {
  if (logQueue.length === 0) return
  try {
    await ensureDir()
    const filePath = `${LOG_DIR}/log_${dateStr}.log`
    const content = logQueue.join('')
    logQueue = []

    const exists = await RNFS.exists(filePath)
    const fileInfo = exists ? await RNFS.stat(filePath) : null
    if (fileInfo && fileInfo.size > MAX_LOG_SIZE) {
      // 日志过大,重命名旧文件
      const ts = Date.now()
      await RNFS.moveFile(filePath, `${LOG_DIR}/log_${dateStr}_${ts}.log`).catch(() => {})
    }

    await RNFS.appendFile(filePath, content, 'utf8')
  } catch {}
}

export const logger = {
  debug: (tag: string, msg: string) => writeLog('DEBUG', tag, msg),
  info: (tag: string, msg: string) => writeLog('INFO', tag, msg),
  warn: (tag: string, msg: string) => writeLog('WARN', tag, msg),
  error: (tag: string, msg: string) => writeLog('ERROR', tag, msg),
}

// 捕获未处理异常
export const setupGlobalErrorHandler = () => {
  const originalHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler()
  
  global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    logger.error('FATAL', `[${isFatal ? 'FATAL' : 'NON-FATAL'}] ${error.name}: ${error.message}\n${error.stack || ''}`)
    // 立即刷新日志
    flushLogs(getDateStr()).then(() => {
      if (originalHandler) originalHandler(error, isFatal)
    })
  })
}

// 获取日志内容(用于调试面板)
export const getLogContent = async (days: number = 1): Promise<string> => {
  try {
    await ensureDir()
    const files = await RNFS.readDir(LOG_DIR)
    const logFiles = files.filter(f => f.isFile() && f.name.endsWith('.log'))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, days)

    let content = ''
    for (const f of logFiles) {
      content += `=== ${f.name} ===\n`
      content += await RNFS.readFile(f.path, 'utf8').catch(() => '')
      content += '\n\n'
    }
    return content
  } catch { return '无日志' }
}

// 清除所有日志
export const clearLogs = async () => {
  try {
    const exists = await RNFS.exists(LOG_DIR)
    if (exists) await RNFS.unlink(LOG_DIR)
    await RNFS.mkdir(LOG_DIR)
  } catch {}
}

export default {
  setEnabled, setLevel, logger, setupGlobalErrorHandler,
  getLogContent, clearLogs,
}
