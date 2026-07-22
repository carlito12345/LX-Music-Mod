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
  
  // 直接使用传入的列表(UI已经加载的歌曲)
  if (list && list.length > 0) {
    await setTempList(listId, [...list])
    void playList(LIST_IDS.TEMP, index)
    
    // 后台尝试加载完整列表并更新
    try {
      const fullList = await getListDetailAll(source, id)
      if (fullList.length > list.length) {
        await setTempList(listId, [...fullList])
      }
    } catch (e) {
      console.warn('[Songlist] Failed to load full list in background:', e)
    }
  } else {
    // 如果传入的列表为空,尝试加载第一页
    try {
      const detail = await getListDetail(id, source, 1)
      const playList_data = detail.list || []
      if (playList_data.length > 0) {
        await setTempList(listId, [...playList_data])
        void playList(LIST_IDS.TEMP, index)
      }
    } catch (e) {
      console.error('[Songlist] Failed to load any songs:', e)
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
