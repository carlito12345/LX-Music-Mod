/**
 * @format
 */
import './shim'
import { AppRegistry } from 'react-native'
import MiniPlayer from './src/screens/MiniPlayer'
import MiniPlayerVertical from './src/screens/MiniPlayerVertical'

import './src/app'

AppRegistry.registerComponent('MiniPlayer', () => MiniPlayer)
AppRegistry.registerComponent('MiniPlayerVertical', () => MiniPlayerVertical)
// import './test'
// import '@/utils/errorHandle'
// Navigation.registerComponent('com.myApp.WelcomeScreen', () => App)
// Navigation.events().registerAppLaunchedListener(() => {
//   Navigation.setRoot({
//     root: {
//       stack: {
//         children: [
//           {
//             component: {
//               name: 'com.myApp.WelcomeScreen',
//             },
//           },
//         ],
//       },
//     },
//   })
// })
