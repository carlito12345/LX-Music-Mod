import { createStyle } from '@/utils/tools'

export default createStyle({
  container: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 9,
    paddingBottom: 9,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  // title: {

  // },
  label: {
    width: 50,
    textAlign: 'center',
  },
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 5,
  },
})
