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
                <el-button class="refresh-btn" type="primary" @click="getHistoryMeeting">刷新</el-button>
                <div class="history-none" v-if="historyMeetingList.length===0">暂无会议记录</div>
                <div class="history-list">
                    <div v-for="v in historyMeetingList" class="history-card">
                        <div class="history-title">
                            <label class="history-title-name">{{ v.meetingName }}</label>
                            <!-- <label class="history-title-description">{{ v.description }}</label> -->
                        </div>
                        <div class="host-info">
                            <label>创建人: </label>
                            <CusImage class="history-card-avatar" :uid="v.hostId"/>
                            <label>{{ v.hostName }}</label>
                        </div>
                        <label class="meeting-time">{{ convertTime(v.startTime) }}</label>
                    </div>    
                </div>
            </div>
        </div> 
    </div>
</template>

<script setup lang="ts">
import { useUserInfoStore } from '@/stores/userInfoStore'
import TitleBar from '@/views/component/title/TitleBar.vue'
import { ref,onMounted, onUnmounted,watch } from 'vue'
import CusImage from '@/views/component/CusImage.vue'
import DynamicEditButton from '../component/DynamicEditButton.vue'
import { HistoryMeeting } from '@/apis/meeting'
import { Ping,offline } from '@/apis/user'

const userInfoStore = useUserInfoStore()
const titleHeight = ref(30)
const avatarSize = ref('90px')
let gettingHistory = false;

const historyMeetingList = ref<any[]>([])

watch(historyMeetingList, (newList) => { newList.sort((a, b) => { return b.startTime - a.startTime }) }, { deep: true })

function padZero(n: number): string {
  return n < 10 ? "0" + n : n.toString()
}
const convertTime = (seconds: number): string => {
  const date = new Date(seconds * 1000)

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = padZero(date.getHours())
  const minute = padZero(date.getMinutes())
  const second = padZero(date.getSeconds())


  return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`
}

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

const getHistoryMeeting = async () => {
    if (gettingHistory) {
        return
    }
    gettingHistory = true
    try {
        let res = await HistoryMeeting({
            userId:userInfoStore.userInfo.userId
        })
        console.dir(res)
        if(res.data.list !== null) {
            historyMeetingList.value = res.data.list
        } else {
            historyMeetingList.value = []
        }
        
    } finally {
        gettingHistory = false;
    }
}

onMounted(() => {
    Ping()
    window.ipcRenderer.once('offline',(e) => {
        offline()
    })
    window.ipcRenderer.send('create-tray')
    window.ipcRenderer.on('add-history-meeting',(e,data) => {
        historyMeetingList.value.push(data)
    })
    getHistoryMeeting()
})
onUnmounted(() => {
    window.ipcRenderer.removeAllListeners('add-history-meeting')
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
        -webkit-app-region: no-drag;
        flex: 1;
        margin-left: 20px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 15px;
        padding: 20px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: auto;
        position: relative;
        .refresh-btn {
            position: absolute;
            right: 10px;
            top: 15px;
        }
        .history-list {
            padding: 10px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            
            &::-webkit-scrollbar {
                width: 6px;
            }
            
            &::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
            }
            
            &::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 3px;
            }
            
            &::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #764ba2, #f093fb);
            }
        }
        .history-card {
            width: 98%;
            height: 100px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            display: flex;
            overflow: hidden;
            flex-direction: column;
            box-shadow: 
                0 8px 32px rgba(31, 38, 135, 0.15),
                0 2px 8px rgba(0, 0, 0, 0.1);
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            
            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                border-radius: 20px 20px 0 0;
            }
            
            &:hover {
                transform: translateY(-4px) scale(1.02);
                box-shadow: 
                    0 16px 40px rgba(31, 38, 135, 0.2),
                    0 8px 16px rgba(0, 0, 0, 0.15);
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.9) 100%);
                border-color: rgba(255, 255, 255, 0.5);
                
                &::before {
                    height: 4px;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #ffecd2 75%, #fcb69f 100%);
                }
            }
            
            &:active {
                transform: translateY(-2px) scale(1.01);
                transition: all 0.1s ease;
            }
            
            .history-title {
                width: 100%;
                height: 55%;
                padding: 12px 16px 8px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                
                .history-title-name {
                    font-weight: 700;
                    font-size: 18px;
                    color: #2d3748;
                    margin-bottom: 2px;
                    line-height: 1.3;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }
                
                .history-title-description {
                    font-size: 14px;
                    font-weight: 500;
                    color: #718096;
                    line-height: 1.4;
                }
            }
            
            .host-info {
                display: flex;
                gap: 8px;
                align-items: center;
                font-size: 14px;
                padding: 0 16px 12px;
                color: #4a5568;
                font-weight: 500;
                
                label:first-child {
                    color: #667eea;
                    font-weight: 600;
                }
            }
            
            .history-card-avatar {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                box-shadow: 
                    0 2px 8px rgba(0, 0, 0, 0.15),
                    0 0 0 2px rgba(255, 255, 255, 0.8);
                transition: all 0.3s ease;
            }
            
            .meeting-time {
                position: absolute;
                top: 12px;
                right: 16px;
                font-size: 13px;
                font-weight: 600;
                color: #667eea;
                background: rgba(102, 126, 234, 0.1);
                padding: 4px 10px;
                border-radius: 12px;
                backdrop-filter: blur(5px);
                border: 1px solid rgba(102, 126, 234, 0.2);
            }
        }
    }

    .right-panel h2 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 20px;
    }

    .history-none {
        -webkit-app-region: no-drag;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #718096;
        font-size: 16px;
        font-weight: 500;
        border: 2px dashed rgba(102, 126, 234, 0.3);
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(10px);
        margin: 20px 0;
    }
}
</style>