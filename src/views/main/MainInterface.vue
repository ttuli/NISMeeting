<template>
    <div class="main-interface">
        <TitleBar class="titlebar" :btnheight="titleHeight" :closeLogic="closeLogic"></TitleBar>
        <div class="container">
            <div class="left-panel">
                <div class="profile">
                    <CusImage :uid="userInfoStore.userInfo.userId" class="profile-image"/>
                    <DynamicEditButton class="avatarEdit"></DynamicEditButton>
                </div>
                <el-text>{{ userInfoStore.userInfo.nickName }}</el-text>
                <el-button type="primary" @click="editProfile">编辑资料</el-button>
                <span class="interval-span"></span>
                <button class="btn" @click="handleMeeting('join')">加入会议</button>
                <button class="btn" @click="handleMeeting('create')">创建会议</button>
            </div>

            <div class="right-panel">
                <h2>历史会议</h2>
                <div class="history-list-contain" v-if="historyMeetingList.length===0">暂无会议记录</div>
                <div v-for="v in historyMeetingList">
                    <div class="history-card">
                        <div class="history-title">
                            <label class="history-title-name">{{ v.meetingName }}</label>
                            <label class="history-title-description">{{ v.description }}</label>
                        </div>
                        <CusImage class="history-card-avatar"/>
                    </div>
                </div>
            </div>
        </div> 
    </div>
</template>

<script setup lang="ts">
import { useUserInfoStore } from '@/stores/userInfoStore'
import TitleBar from '@/views/component/title/TitleBar.vue'
import { ref,onMounted } from 'vue'
import CusImage from '@/views/component/CusImage.vue'
import DynamicEditButton from '../component/DynamicEditButton.vue'

const userInfoStore = useUserInfoStore()
const titleHeight = ref(30)
const avatarSize = ref('90px')

const historyMeetingList = ref<any[]>([
    {
        meetingName:"项目讨论会",
        description:"一次项目讨论会",
        hostId:123456,
        hostName:'张三',
        startTime:0,
        endTime:0,
    }
])

const handleMeeting = (type : string) => {
    window.ipcRenderer.send('handle-meeting', {
        type: type,
        userInfo: { ...userInfoStore.userInfo },
        token: userInfoStore.token
    })
}
const editProfile = () => {
    window.ipcRenderer.send('edit-profile',{
        userInfo: { ...userInfoStore.userInfo },
        token: userInfoStore.token
    })
}
onMounted(() => {
    window.ipcRenderer.send('create-tray')
})
const closeLogic = () => {
    window.ipcRenderer.send('window-hide')
}
</script>

<style lang="scss" scoped>
.main-interface {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    display: flex;
    flex-direction: column;
    -webkit-app-region: drag;
    .titlebar {
        position: absolute;
        height: v-bind(titleHeight);
        width: 100%;
    }
    .container {
        display: flex;
        flex-direction: row;
        min-height: 100vh;
        padding: 20px;
        padding-top: 40px;
        box-sizing: border-box;
    }

    /* 左侧信息框 */
    .left-panel {
        -webkit-app-region: no-drag;
        width: 250px;
        background: #ffffff;
        border-radius: 15px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
    }

    .profile {
        position: relative;
        width: v-bind(avatarSize);
        height: v-bind(avatarSize);
        border-radius: 50%;
        background: #c3cfe2;
        display: flex;
        font-size: 24px;
        color: #fff;
        margin-bottom: 10px;
    }   
    .profile-image {
        width: v-bind(avatarSize);
        height: v-bind(avatarSize);
        border-radius: 50%;
    }
    .avatarEdit {
        position: absolute;
        right: -5px;
        bottom: -5px;
        border: none;
        width: 20px;
        height: 20px;
        background-color: chocolate;
    }
    .interval-span {
        height: 20%;
    }

    .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 200px;
        height: 50px;
        border-radius: 50px;
        border: 0;
        outline: 0;
        font-size: 18px;
        background: #08f;
        color: #fff;
        &:hover {
            background-color: #357ab7;
        }
        &:active {
            transform: scale(0.9, 0.9);
            transition: 200ms;
        }
        &:not(:active) {
            transition: 200ms;
        }
    }

    /* 右侧历史会议区域 */
    .right-panel {
        flex: 1;
        margin-left: 20px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 15px;
        padding: 20px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;

        .history-card {
            width: 100%;
            height: 100px;
            background-color: rgb(255, 255, 255);
            border-radius: 15px 15px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 6px 0 rgba(0,0,0,0.3);
            .history-title {
                width: 100%;
                height: 50%;
                padding-left: 8px;
                padding-top: 5px;
                display: flex;
                flex-direction: column;
                .history-title-name {
                    font-weight: bold;
                    font-size: 18px;
                }
                .history-title-description {
                    font-weight: 500;
                }
            }
            .history-card-avatar {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                box-shadow: 0 0 6px 0 rgba(0,0,0,0.3);
            }
        }
    }

    .right-panel h2 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 20px;
    }

    .history-list-contain {
        -webkit-app-region: no-drag;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 16px;
        border: 2px dashed #ccc;
        border-radius: 10px;
    }
}
</style>