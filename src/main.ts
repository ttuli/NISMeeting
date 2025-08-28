import { createApp } from 'vue'
import App from './App.vue'
import Elementpuls from 'element-plus'
import 'element-plus/dist/index.css'
import './style/CusElmessage.css'
import router from './views/router'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { createPinia } from 'pinia'

const app = createApp(App)
app.use(Elementpuls)
app.use(createPinia())
app.use(router)
app.mount('#app')
