/**
 * Logger - 日志系统
 * 输出日志文件到 Download/LXMusic_Logs/
 * 开启时 hook console.log/warn/error,记录所有操作
 */
import RNFS from 'react-native-fs'

const LOG_DIR = RNFS.DownloadDirectoryPath + '/LXMusic_Logs'
const MAX_LOG_SIZE = 50 * 1024 * 1024 // 50MB

let enabled = false
let level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' = 'DEBUG'
let origLog: any = null, origWarn: any = null, origError: any = null

// 定期检测现有日志文件并追加
let logPoller: any = null
const EXISTING_LOG_PATH = ''

export const setEnabled = (v: boolean) => {
  enabled = v
  if (v) {
    hookConsole()
    writeNow('LOGGER', '日志系统已开启')
    // 定期读取并追加旧日志系统的内容
    logPoller = setInterval(async () => {
      try {
        const { temporaryDirectoryPath } = require('react-native-fs')
        const oldLogPath = temporaryDirectoryPath + '/error.log'
        const exists = await RNFS.exists(oldLogPath)
        if (exists) {
          const content = await RNFS.readFile(oldLogPath, 'utf8')
          if (content) {
            writeNow('OLDLOG', content.substring(0, 5000), 'INFO')
          }
        }
      } catch {}
    }, 10000)
  } else {
    unhookConsole()
    if (logPoller) { clearInterval(logPoller); logPoller = null }
  }
}
export const isEnabled = () => enabled
export const setLevel = (l: string) => { level = l as any }

const LEVEL_ORDER: Record<string, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }
const shouldLog = (lvl: string) => LEVEL_ORDER[lvl] >= LEVEL_ORDER[level]

// 直接写入文件(同步异步转换)
export const writeNow = async (tag: string, msg: string, lvl = 'INFO') => {
  if (!enabled || !shouldLog(lvl)) return
  try {
    const d = new Date()
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
    const line = `[${dateStr} ${timeStr}][${lvl}][${tag}] ${msg}\n`

    const dirExists = await RNFS.exists(LOG_DIR)
    if (!dirExists) await RNFS.mkdir(LOG_DIR)

    const filePath = `${LOG_DIR}/log_${dateStr}.log`
    const fileExists = await RNFS.exists(filePath)

    if (fileExists) {
      const stat = await RNFS.stat(filePath)
      if (stat.size > MAX_LOG_SIZE) {
        const ts = Date.now()
        await RNFS.moveFile(filePath, `${LOG_DIR}/log_${dateStr}_${ts}.log`).catch(() => {})
      }
      await RNFS.appendFile(filePath, line, 'utf8')
    } else {
      await RNFS.writeFile(filePath, line, 'utf8')
    }
  } catch (e: any) {
    console.warn('[LOGGER] write failed:', e?.message)
  }
}

// Hook console
const hookConsole = () => {
  const makeHook = (origName: string, lvl: string) => {
    const orig = (console as any)[origName]
    if (!orig) return
    ;(console as any)[origName] = (...args: any[]) => {
      orig(...args)
      const msg = args.map(a => typeof a === 'string' ? a : (a instanceof Error ? a.stack || a.message : JSON.stringify(a))).join(' ')
      writeNow('CONSOLE', msg, lvl)
    }
  }
  // Hook 所有 console 级别
  if (!origLog) { origLog = console.log; makeHook('log', 'INFO') }
  if (!origWarn) { origWarn = console.warn; makeHook('warn', 'WARN') }
  if (!origError) { origError = console.error; makeHook('error', 'ERROR') }
  makeHook('info', 'INFO')
  makeHook('debug', 'DEBUG')

  // 捕获未处理的 Promise 拒绝
  const origRejectionHandler = global.ErrorUtils?.getGlobalHandler
  global.ErrorUtils?.setGlobalHandler?.((error: any, isFatal?: boolean) => {
    writeNow('FATAL', `${isFatal ? 'FATAL' : 'NON-FATAL'}: ${error?.stack || error?.message || error}`, 'ERROR')
    if (origRejectionHandler) origRejectionHandler(error, isFatal)
  })
}

const unhookConsole = () => {
  if (origLog) { console.log = origLog; origLog = null }
  if (origWarn) { console.warn = origWarn; origWarn = null }
  if (origError) { console.error = origError; origError = null }
}

// 获取日志内容
export const getLogContent = async (days = 1): Promise<string> => {
  try {
    const dirExists = await RNFS.exists(LOG_DIR)
    if (!dirExists) return '无日志'
    const files = await RNFS.readDir(LOG_DIR)
    const logFiles = files.filter(f => f.isFile() && f.name.endsWith('.log'))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, days)
    let content = ''
    for (const f of logFiles) {
      content += `=== ${f.name} ===\n`
      try { content += await RNFS.readFile(f.path, 'utf8') } catch {}
      content += '\n\n'
    }
    return content || '无日志'
  } catch { return '无日志' }
}

// 清除日志
export const clearLogs = async () => {
  try {
    if (await RNFS.exists(LOG_DIR)) await RNFS.unlink(LOG_DIR)
    await RNFS.mkdir(LOG_DIR)
  } catch {}
}

// 测试写入
export const test = async () => {
  try {
    const dirExists = await RNFS.exists(LOG_DIR)
    if (!dirExists) await RNFS.mkdir(LOG_DIR)
    const d = new Date()
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const filePath = `${LOG_DIR}/log_${dateStr}.log`
    await RNFS.writeFile(filePath, `[${dateStr} ${d.toLocaleTimeString()}][INFO][LOGGER] 日志系统已初始化\n`, 'utf8')
    return true
  } catch {
    return false
  }
}

export default { setEnabled, isEnabled, setLevel, getLogContent, clearLogs, test, writeNow }
