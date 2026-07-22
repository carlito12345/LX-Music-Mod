import { memo, useCallback, useState } from 'react'
import { View, TextInput } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const theme = useTheme()
  const lineCount = useSettingValue('playDetail.vertical.style.lrcLineCount')
  const [text, setText] = useState(String(lineCount || ''))

  const handleChange = useCallback((value: string) => {
    setText(value)
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1 && num <= 10) {
      updateSetting({ 'playDetail.vertical.style.lrcLineCount': num } as any)
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text size={14} color={theme['c-primary-font']} style={styles.title}>歌词行数</Text>
      <View style={styles.row}>
        <Text size={12} color={theme['c-font-label']}>显示行数</Text>
        <TextInput
          style={[styles.input, { borderColor: theme['c-hair-2'], color: theme['c-font'] }]}
          value={text}
          onChangeText={handleChange}
          keyboardType="number-pad"
          placeholder="1-10"
          placeholderTextColor={theme['c-font-label']}
        />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  title: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
    fontSize: 14,
    textAlign: 'center',
  },
})
