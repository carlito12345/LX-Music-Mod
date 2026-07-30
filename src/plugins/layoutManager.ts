type Listener = (layout: string) => void
let currentLayout = 'default'
const listeners: Listener[] = []

export const getLayout = () => currentLayout
export const setLayout = (layout: string) => {
  currentLayout = layout
  listeners.forEach(fn => fn(layout))
}
export const onLayoutChange = (fn: Listener) => {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}
