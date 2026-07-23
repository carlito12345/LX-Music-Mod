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
  
  // 检查播放队列是否已有该歌单的数据
  const existingQueue = listState.allMusicList.get(LIST_IDS.TEMP) || []
  const hasExistingData = listState.tempListMeta.id === listId && existingQueue.length > 0
  
  if (hasExistingData) {
    // 播放队列已有数据,直接播放,不覆盖
    void playList(LIST_IDS.TEMP, index)
    
    // 后台尝试加载完整列表
    try {
      const fullList = await getListDetailAll(source, id)
      if (fullList.length > existingQueue.length) {
        await setTempList(listId, [...fullList])
      }
    } catch (e) {
      console.warn('[Songlist] Failed to load full list:', e)
    }
  } else {
    // 播放队列没有数据,按原逻辑处理
    let isPlayingList = false
    if (!list?.length) list = (await getListDetail(id, source, 1)).list
    if (list?.length) {
      await setTempList(listId, [...list])
      void playList(LIST_IDS.TEMP, index)
      isPlayingList = true
    }
    const fullList = await getListDetailAll(source, id)
    if (!fullList.length) return
    if (isPlayingList) {
      if (listState.tempListMeta.id == listId) {
        await setTempList(listId, [...fullList])
      }
    } else {
      await setTempList(listId, [...fullList])
      void playList(LIST_IDS.TEMP, index)
    }
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
