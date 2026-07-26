/**
 * @format
 */
import './shim'
import { AppRegistry } from 'react-native'
import MiniPlayer from './src/screens/MiniPlayer'

import './src/app'

AppRegistry.registerComponent('MiniPlayer', () => MiniPlayer)
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
