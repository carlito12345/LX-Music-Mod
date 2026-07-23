import { createList, setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { getListDetail, getListDetailAll } from '@/core/songlist'
import { LIST_IDS } from '@/config/constant'
import listState from '@/store/list/state'
import syncSourceList from '@/core/syncSourceList'
import { confirmDialog, toMD5, toast } from '@/utils/tools'
import { type Source } from '@/store/songlist/state'

const getListId = (id: string, source: LX.OnlineSource) => `${source}__${id}`

export const handlePlay = async(id: string, source: Source, list?: LX.Music.MusicInfoOnline[], index = 0) => {
  const listId = getListId(id, source)
  
  // 如果传入的列表有数据,立即播放
  if (list && list.length > 0) {
    await setTempList(listId, [...list])
    void playList(LIST_IDS.TEMP, index)
    // 后台加载完整列表
    try {
      const fullList = await getListDetailAll(source, id)
      if (fullList.length > list.length && listState.tempListMeta.id == listId) {
        await setTempList(listId, [...fullList])
      }
    } catch (e) {
      console.warn('[Songlist] Failed to load full list:', e)
    }
    return
  }
  
  // 传入列表为空,先加载完整列表再播放
  try {
    const fullList = await getListDetailAll(source, id)
    if (fullList.length > 0) {
      await setTempList(listId, [...fullList])
      void playList(LIST_IDS.TEMP, index)
      return
    }
  } catch (e) {
    console.warn('[Songlist] Failed to load full list, trying page 1:', e)
  }
  
  // 最后尝试加载第一页
  try {
    const detail = await getListDetail(id, source, 1)
    const pageList = detail.list || []
    if (pageList.length > 0) {
      await setTempList(listId, [...pageList])
      void playList(LIST_IDS.TEMP, index)
    }
  } catch (e) {
    console.error('[Songlist] Failed to load any songs:', e)
  }
}

export const handleCollect = async(id: string, source: Source, name: string) => {
  const listId = getListId(id, source)

  const targetList = listState.userList.find(l => l.sourceListId == listId)
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: global.i18n.t('list_import_part_button_cancel'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    void syncSourceList(targetList)
    return
  }

  const list = await getListDetailAll(source, id)
  await createList({
    name,
    id: `${source}_${toMD5(listId)}`,
    list,
    source,
    sourceListId: id,
  })
  toast(global.i18n.t('collect_success'))
}
