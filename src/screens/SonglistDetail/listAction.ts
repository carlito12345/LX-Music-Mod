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
  toast('正在加载列表...')
  
  // 首先尝试加载完整列表
  let playList_data: LX.Music.MusicInfoOnline[] = []
  try {
    playList_data = await getListDetailAll(source, id)
  } catch (e) {
    console.warn('[Songlist] Failed to load full list, trying page 1:', e)
  }
  
  // 如果完整列表加载失败,尝试加载第一页
  if (playList_data.length === 0) {
    try {
      const detail = await getListDetail(id, source, 1)
      playList_data = detail.list || []
    } catch (e) {
      console.error('[Songlist] Failed to load page 1:', e)
    }
  }
  
  // 如果还是失败,使用传入的列表
  if (playList_data.length === 0 && list && list.length > 0) {
    playList_data = list
  }
  
  // 播放列表
  if (playList_data.length > 0) {
    await setTempList(listId, [...playList_data])
    void playList(LIST_IDS.TEMP, index)
    toast(`已加载 ${playList_data.length} 首歌曲`)
  } else {
    toast('加载列表失败')
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
