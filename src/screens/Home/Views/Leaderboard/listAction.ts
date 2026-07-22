import { createList, setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { getListDetail, getListDetailAll } from '@/core/leaderboard'
import { LIST_IDS } from '@/config/constant'
import listState from '@/store/list/state'
import syncSourceList from '@/core/syncSourceList'
import { confirmDialog, toMD5, toast } from '@/utils/tools'


const getListId = (id: string) => `board__${id}`

export const handlePlay = async(id: string, list?: LX.Music.MusicInfoOnline[], index = 0) => {
  const listId = getListId(id)
  
  // 直接使用传入的列表(UI已经加载的歌曲)
  if (list && list.length > 0) {
    await setTempList(listId, [...list])
    void playList(LIST_IDS.TEMP, index)
    
    // 后台尝试加载完整列表并更新
    try {
      const fullList = await getListDetailAll(id)
      if (fullList.length > list.length) {
        await setTempList(listId, [...fullList])
      }
    } catch (e) {
      console.warn('[Leaderboard] Failed to load full list in background:', e)
    }
  } else {
    // 如果传入的列表为空,尝试加载第一页
    try {
      const detail = await getListDetail(id, 1)
      const playList_data = detail.list || []
      if (playList_data.length > 0) {
        await setTempList(listId, [...playList_data])
        void playList(LIST_IDS.TEMP, index)
      }
    } catch (e) {
      console.error('[Leaderboard] Failed to load any songs:', e)
    }
  }
}


export const handleCollect = async(id: string, name: string, source: LX.OnlineSource) => {
  const listId = getListId(id)
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

  const list = await getListDetailAll(id)
  await createList({
    name,
    id: `${source}_${toMD5(listId)}`,
    list,
    source,
    sourceListId: listId,
  })
  toast(global.i18n.t('collect_success'))
}
