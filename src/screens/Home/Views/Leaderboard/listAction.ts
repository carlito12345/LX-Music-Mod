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
  
  // 优先使用传入的列表(当前已加载的歌曲)
  let playList_data = list && list.length > 0 ? list : []
  
  // 如果传入的列表为空,尝试加载第一页
  if (playList_data.length === 0) {
    try {
      const detail = await getListDetail(id, 1)
      playList_data = detail.list || []
    } catch (e) {
      console.error('[Leaderboard] Failed to load page 1:', e)
    }
  }
  
  // 立即播放已有数据
  if (playList_data.length > 0) {
    await setTempList(listId, [...playList_data])
    void playList(LIST_IDS.TEMP, index)
  }
  
  // 后台加载完整列表并更新
  try {
    const fullList = await getListDetailAll(id)
    if (fullList.length > playList_data.length) {
      await setTempList(listId, [...fullList])
      // 如果用户还在播放同一首歌,不需要重新播放,列表已更新
    }
  } catch (e) {
    console.warn('[Leaderboard] Failed to load full list:', e)
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
