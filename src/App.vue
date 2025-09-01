<script lang="ts" setup>
import { reactive,onMounted,onUnmounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useUserInfoStore } from './stores/userInfoStore'

const userInfoStore = useUserInfoStore()

const locale = zhCn
const config = reactive({
  max: 1
})

onMounted(() => {
  window.ipcRenderer.on('update-info',(e,uinfo) => {
    userInfoStore.setUserInfo(uinfo,'')
  })
})
onUnmounted(() => {
  window.ipcRenderer.removeAllListeners('update-info')
})
</script>

<template>
  <el-config-provider :locale="locale" :message="config">
    <router-view class="root"></router-view>
  </el-config-provider>
</template>

<style scoped>
.root {
  top: 0;
  left: 0;
}
</style>
