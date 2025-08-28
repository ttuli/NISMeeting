import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
          path: "/",
          name: "默认路径",
          redirect: "/login",
        },
        {
          path: "/login",
          name: "登录",
          component: () => import('@/views/login/Login.vue'),
        },
        {
          path: "/main",
          name: "主界面",
          component: () => import('@/views/main/MainInterface.vue'),
        },
        {
          path: "/meetingModal",
          name: "会议相关窗口",
          component: () => import('@/views/component/modal/MeetingModal.vue'),
        },
        {
          path: "/profileEdit",
          name: "编辑个人信息",
          component: () => import('@/views/component/InfoEdit.vue'),
        },
        {
          path: "/imageDetali",
          name: "图片查看器",
          component: () => import('@/views/component/ImageViewer.vue'),
        },
        {
          path: "/meeting",
          name: "会议界面",
          component: () => import('@/views/component/meeting/MeetingInterface.vue'),
        }
    ]
}) 

router.afterEach((to) => {
  window.ipcRenderer.send('router-changed', to.fullPath)
})

export default router
