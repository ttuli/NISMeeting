<template>
    <div>
        <TitleBar class="title" :btnheight="30" theme="night" :needMax="true"
        :closeLogic="closeLogic"></TitleBar>
        <div class="mainContainA">
            <div class="meetingArea">
                <div class="head">
                    <div class="meeting-header">
                        <h1 class="title-font">{{ meetingStore.meeting.meetingName }}</h1>
                        <p class="descrip-font">{{ meetingStore.meeting.description }}</p>
                        <div class="meeting-meta">
                            <span class="meeting-id">会议ID: {{ meetingStore.meeting.meetingId }}</span>
                            <span class="meeting-time" v-if="meetingStore.meeting.startTime">
                                开始时间: {{ formatTime(meetingStore.meeting.startTime) }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="meetingContent">
                    <TrackArea class="video-container"></TrackArea>
                    <ControlBar class="controlBar"
                    :isMicOn="isMicOn"
                    :isVideoOn="isVideoOn"
                    :isVoiceOn="isVoiceOn"
                    @micToggle="micToggle"
                    @videoToggle="videoToggle"
                    @voiceToggle="voiceToggle"
                    @exit="closeLogic"></ControlBar>
                </div>
            </div>
            <button class="asideBtn" @click="asideClick" :class="{ 'collapsed': collapsed }">
                <svg class="sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            </button>
            <el-aside class="asideBar" :class="{ 'collapsed': collapsed }">
                <div class="sidebar-content">
                    <div class="member-header">
                        <h3 class="memberTitle">
                            <svg class="people-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2 .95l-2.92 3.68c-.3.38-.08.97.4.97h2.32l-2.8 7H14z"/>
                                <path d="M12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2.5 16v-7H6v-2c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v2h-2v7h-2z"/>
                            </svg>
                            参会成员
                            <span class="member-count">{{ meetingStore.members.length }}</span>
                        </h3>
                    </div>

                    <div class="members-list">
                        <div v-for="(member, index) in meetingStore.members" :key="member.uid" 
                             class="member-item" :class="{ 'is-host': meetingStore.meeting.hostId === member.uid, 'is-me': member.uid === userInfoStore.userInfo.userId }">
                            <CusImage :uid="member.uid" class="memberAvatar"></CusImage>
                            <div class="member-info">
                                <div class="member-badges">
                                    <span v-if="meetingStore.meeting.hostId === member.uid" class="host-badge">主持人</span>
                                    <span v-if="member.uid === userInfoStore.userInfo.userId" class="me-badge">我</span>
                                </div>
                                <div class="member-name" :title="member.name">{{ member.name }}</div>
                                <div class="member-status">
                                    <svg v-if="member.micOn" class="status-icon mic-on" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                                    </svg>
                                    <svg v-else class="status-icon mic-off" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.42-2.31.42-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-aside>
        </div>
        <ConfirmDialog v-if="showConfirmDialog" class="confirmDialog"
        @cancel="onCancel"
        @confirm="onConfirm"
        :content="confirmText"></ConfirmDialog>
    </div>
</template>

<script lang="ts" setup>
import TitleBar from '../title/TitleBar.vue';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useUserInfoStore } from '@/stores/userInfoStore';
import ControlBar from './ControlBar.vue';
import ConfirmDialog from '../modal/ConfirmDialog.vue';
import CusImage from '../CusImage.vue';
import 'splitpanes/dist/splitpanes.css'
import LiveKitManager from '@/utils/livekit'
import { useMeetingStore } from '@/stores/meetingStore'
import TrackArea from './TrackArea.vue';
const meetingStore = useMeetingStore()

const liveKitManager = new LiveKitManager({},import.meta.env.VITE_WS_URL)

const isVideoOn = ref(false)
const isMicOn = ref(false)
const isVoiceOn = ref(false)

// 格式化时间
const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
}

const micToggle = async () => {
    handleStream(isVideoOn.value,!isMicOn.value,isVoiceOn.value)
}
const videoToggle = async () => {
    handleStream(!isVideoOn.value,isMicOn.value,isVoiceOn.value)
}
const voiceToggle = async () => {
    handleStream(isVideoOn.value,isMicOn.value,!isVoiceOn.value)
}

const userInfoStore = useUserInfoStore()
const collapsed = ref(false)
const asideBarWidth = computed(() => {
    return collapsed.value ? '0px' : '280px';
});

const showConfirmDialog = ref(false);
let confirmText = ref('确认退出会议？')

let handling = false
const handleStream = async (openVideo: boolean, openMic: boolean, openVoice: boolean) => {
    if (handling) return
    handling = true
    setTimeout(() => {
        handling = false
    },1000)

    await liveKitManager.setLocalTrack(openVideo,openVoice,openMic)

    isVideoOn.value=openVideo
    isMicOn.value=openMic
    isVoiceOn.value=openVoice
}
const asideClick = () => {
    collapsed.value = !collapsed.value;
}
const closeLogic = () => {
    showConfirmDialog.value = true;
}

const onCancel = () => {
    showConfirmDialog.value = false;
}
const onConfirm = async () => {
    liveKitManager.disconnect()
    window.close()
}

onMounted(async () => {
    window.ipcRenderer.once('initData', (event, data : any) => {
        console.dir(data)
        userInfoStore.setUserInfo(data.userInfo,data.token)
        isMicOn.value = data.enableMicrophone
        isVideoOn.value = data.enableVideo
        isVoiceOn.value = data.enableVideo
        liveKitManager.connectToRoom(import.meta.env.VITE_WS_URL,data.token).then(() => {
            liveKitManager.setLocalTrack(isVideoOn.value,isVoiceOn.value,isMicOn.value)
        })
        
    })
    // window.ipcRenderer.on("meeting-info-update", (event, data: any) => {
    //     console.dir(data)
    //     if (data.HostId === userInfoStore.userInfo.userId && meetingInfo.hostId !== userInfoStore.userInfo.userId) {
    //         ElMessage.info("你已成为主持人")
    //     }
    //     meetingInfo.hostId = data.HostId
    //     memberList.value = []
    //     memberList.value = data.members
    // })
    window.ipcRenderer.send('get-initData')
})
onUnmounted(() => {
    window.ipcRenderer.removeAllListeners("meeting-info-update")
})
</script>

<style scoped lang="scss">
.confirmDialog {
    position: fixed;
    width: 100%;
    height: 100%;
}
.title {
    position: fixed;
    width: 100%;
    height: 30px;
    background-color: black;
}
.mainContainA {
    -webkit-app-region: no-drag;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    margin-top: 30px;
    width: 100%;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    height: calc(100vh - 30px);
    position: fixed;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    
    .meetingArea {
        width: calc(100% - v-bind(asideBarWidth));
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: width 0.3s ease;
        
        .head {
            width: 100%;
            display: flex;
            flex-direction: column;
            padding: 0px 20px 10px;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            
            .meeting-header {
                .title-font {
                    color: #ffffff;
                    font-size: 24px;
                    font-weight: 600;
                    margin: 0 0 8px 0;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                
                .descrip-font {
                    color: #b8bcc8;
                    font-size: 16px;
                    margin: 0 0 12px 0;
                    line-height: 1.4;
                }
                
                .meeting-meta {
                    display: flex;
                    gap: 20px;
                    font-size: 14px;
                    color: #8892b0;
                    
                    .meeting-id, .meeting-time {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        
                        &::before {
                            content: "•";
                            color: #64ffda;
                        }
                    }
                }
            }
        }
        
        .meetingContent {
            flex: 1;
            position: relative;
            display: flex;
            overflow: hidden;
            min-height: 0;
            
            .video-container {
                width: 100%;
                height: auto;
                overflow: hidden;
                background: linear-gradient(45deg, #1a1a2e 0%, #16213e 100%);
                position: relative;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            
            .controlBar {
                position: absolute;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10;
            }
        }
    }
    
    .asideBtn {
        position: fixed;
        top: 50%;
        right: v-bind(asideBarWidth);
        width: 36px;
        height: 60px;
        background: linear-gradient(135deg, rgba(100, 255, 218, 0.1) 0%, rgba(100, 255, 218, 0.2) 100%);
        border: 1px solid rgba(100, 255, 218, 0.3);
        border-radius: 18px 0 0 18px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.3s ease;
        z-index: 20;
        backdrop-filter: blur(10px);
        
        .sidebar-icon {
            width: 18px;
            height: 18px;
            color: #64ffda;
            transition: all 0.3s ease;
        }
        
        &:hover {
            background: linear-gradient(135deg, rgba(100, 255, 218, 0.2) 0%, rgba(100, 255, 218, 0.3) 100%);
            transform: translateY(-10%) scale(1.05);
            
            .sidebar-icon {
                transform: scale(1.1);
            }
        }
        
        &.collapsed {
            .sidebar-icon {
                transform: rotate(180deg);
            }
        }
    }
    
    .asideBar {
        width: v-bind(asideBarWidth);
        height: 100%;
        background: rgba(15, 15, 35, 0.9);
        backdrop-filter: blur(20px);
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
        overflow: hidden;
        flex-shrink: 0;
        
        &.collapsed {
            transform: translateX(100%);
        }
        
        .sidebar-content {
            height: 100%;
            display: flex;
            flex-direction: column;
            
            .member-header {
                padding: 20px 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
                
                .memberTitle {
                    color: #ffffff;
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    
                    .people-icon {
                        width: 18px;
                        height: 18px;
                        color: #64ffda;
                    }
                    
                    .member-count {
                        background: linear-gradient(135deg, #64ffda, #7c3aed);
                        color: #ffffff;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 500;
                        margin-left: auto;
                    }
                }
            }
            
            .members-list {
                flex: 1;
                overflow-y: auto;
                padding: 8px 0;
                
                &::-webkit-scrollbar {
                    width: 4px;
                }
                
                &::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                &::-webkit-scrollbar-thumb {
                    background: rgba(100, 255, 218, 0.3);
                    border-radius: 2px;
                }
                
                .member-item {
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                    border-radius: 8px;
                    margin: 2px 8px;
                    
                    &:hover {
                        background: rgba(255, 255, 255, 0.05);
                    }
                    
                    &.is-host {
                        background: rgba(100, 255, 218, 0.05);
                        border: 1px solid rgba(100, 255, 218, 0.2);
                    }
                    
                    &.is-me {
                        background: rgba(124, 58, 237, 0.1);
                        border: 1px solid rgba(124, 58, 237, 0.3);
                    }
                    
                    .memberAvatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        flex-shrink: 0;
                        border: 2px solid rgba(255, 255, 255, 0.1);
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    }
                    
                    .member-info {
                        flex: 1;
                        min-width: 0;
                        
                        .member-badges {
                            display: flex;
                            gap: 6px;
                            margin-bottom: 4px;
                            
                            .host-badge {
                                background: linear-gradient(135deg, #10b981, #059669);
                                color: white;
                                padding: 2px 6px;
                                border-radius: 10px;
                                font-size: 10px;
                                font-weight: 500;
                                text-transform: uppercase;
                            }
                            
                            .me-badge {
                                background: linear-gradient(135deg, #7c3aed, #5b21b6);
                                color: white;
                                padding: 2px 6px;
                                border-radius: 10px;
                                font-size: 10px;
                                font-weight: 500;
                            }
                        }
                        
                        .member-name {
                            color: #ffffff;
                            font-size: 14px;
                            font-weight: 500;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            margin-bottom: 2px;
                        }
                        
                        .member-status {
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            
                            .status-icon {
                                width: 14px;
                                height: 14px;
                                
                                &.mic-on {
                                    color: #10b981;
                                }
                                
                                &.mic-off {
                                    color: #ef4444;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

.title-font {
    color: rgb(223, 223, 223);
    font-size: 22px;
    text-align: left;
}
.descrip-font {
    color: rgb(165, 165, 165);
    font-size: 17px;
    text-align: left;
}
</style>