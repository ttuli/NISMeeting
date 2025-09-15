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
                            <button class="copy-btn" @click="copyMeetingInfo" title="复制会议信息">
                                <svg class="copy-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                                复制
                            </button>
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
                    <!-- 选项卡头部 -->
                    <div class="tabs-header">
                        <div 
                            class="tab-item" 
                            :class="{ 'active': activeTab === 'chat' }"
                            @click="switchTab('chat')"
                        >
                            <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                            </svg>
                            聊天
                            <span v-if="unreadCount > 0 && activeTab !== 'chat'" class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
                        </div>
                        <div 
                            class="tab-item" 
                            :class="{ 'active': activeTab === 'members' }"
                            @click="switchTab('members')"
                        >
                            <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2 .95l-2.92 3.68c-.3.38-.08.97.4.97h2.32l-2.8 7H14z"/>
                                <path d="M12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2.5 16v-7H6v-2c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v2h-2v7h-2z"/>
                            </svg>
                            成员
                            <span class="member-count">{{ meetingStore.members.length }}</span>
                        </div>
                    </div>

                    <!-- 聊天内容 -->
                    <div v-if="activeTab === 'chat'" class="chat-content">
                        <div class="chat-messages" ref="chatMessages">
                            <div v-for="(message, index) in messages" :key="index" class="message-item">
                                <CusImage :uid="message.uid" class="message-avatar"></CusImage>
                                <div class="message-content">
                                    <div class="message-header">
                                        <span class="message-name">{{ message.name }}</span>
                                        <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
                                    </div>
                                    <div class="message-text">{{ message.content }}</div>
                                </div>
                            </div>
                            <div v-if="messages.length === 0" class="empty-chat">
                                <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 13h-2v-2h2v2zm0-4h-2V7h2v4z"/>
                                </svg>
                                <p>暂无聊天消息</p>
                            </div>
                        </div>
                        <div class="chat-input">
                            <div class="input-container">
                                <input 
                                    v-model="chatInput" 
                                    @keyup.enter="sendMessage"
                                    placeholder="输入消息..." 
                                    class="message-input"
                                    maxlength="100"
                                />
                                <button @click="sendMessage" class="send-btn" :disabled="!chatInput.trim()">
                                    <svg class="send-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                    </svg>
                                </button>
                                <button @click="toggleEmojiPicker" class="emoji-btn" :class="{ 'active': showEmojiPicker }">
                                😀
                                </button>
                            </div>
                        </div>
                        <div v-if="showEmojiPicker" class="emoji-picker">
                            <span 
                                v-for="emoji in emojiCategories" 
                                :key="emoji" 
                                @click="insertEmoji(emoji)"
                                class="emoji-item"
                                >
                                {{ emoji }}
                            </span>
                        </div>
                    </div>

                    <!-- 成员列表内容 -->
                    <div v-if="activeTab === 'members'" class="members-content">
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
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useUserInfoStore } from '@/stores/userInfoStore';
import ControlBar from './ControlBar.vue';
import ConfirmDialog from '../modal/ConfirmDialog.vue';
import CusImage from '../CusImage.vue';
import 'splitpanes/dist/splitpanes.css'
import LiveKitManager from '@/utils/livekit'
import { useMeetingStore } from '@/stores/meetingStore'
import TrackArea from './TrackArea.vue';
import { ElMessage } from 'element-plus';

const meetingStore = useMeetingStore()
const liveKitManager = new LiveKitManager({},import.meta.env.VITE_WS_URL)
liveKitManager.on('chat-message',async (data : Uint8Array) => {
    const d = JSON.parse(data.toString())
    console.dir(d)
    if (!d) {
        ElMessage.error("接收消息失败")
        return
    }
    const date = new Date()
    messages.value.push({
        uid:d.uid,
        name:d.name,
        content:d.data,
        timestamp:date.getTime()
    })
})

const isVideoOn = ref(false)
const isMicOn = ref(false)
const isVoiceOn = ref(false)

// 聊天相关
const activeTab = ref('chat')
const chatInput = ref('')
const chatMessages = ref<HTMLElement>()
const messages = ref<Array<{
    uid: string,
    name: string,
    content: string,
    timestamp: number
}>>([])
const unreadCount = ref(0)

const showEmojiPicker = ref(false)
const emojiCategories = ref([
'😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', 
'😌', '😍', '🥰', '😘', '😗', '😙', '😚','👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘',
 '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝',
'❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'
])

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const insertEmoji = (emoji:any) => {
  chatInput.value += emoji
  showEmojiPicker.value = false
}

// 切换选项卡
const switchTab = (tab: string) => {
    activeTab.value = tab
    if (tab === 'chat') {
        unreadCount.value = 0
        nextTick(() => {
            scrollToBottom()
        })
    }
}

// 格式化消息时间
const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) { // 小于1分钟
        return '刚刚'
    } else if (diff < 3600000) { // 小于1小时
        return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) { // 小于1天
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else {
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }
}

// 发送消息
const sendMessage = async () => {
    if (!chatInput.value.trim()) return
    
    const newMessage = {
        uid: userInfoStore.userInfo.userId,
        name: userInfoStore.userInfo.nickName,
        content: chatInput.value.trim(),
        timestamp: Date.now()
    }
    const d = JSON.stringify(newMessage)
    console.dir(d)
    if (d === undefined) {
        ElMessage.error("发送失败")
        return
    }
    let res = await liveKitManager.sendMsg({
        uid:userInfoStore.userInfo.userId,
        name: userInfoStore.userInfo.nickName,
        data:d
    })
    if (!res) {
        ElMessage.error("发送消息失败")
        return
    }

    messages.value.push(newMessage)
    chatInput.value = ''
    
    nextTick(() => {
        scrollToBottom()
    })
}

// 滚动到底部
const scrollToBottom = () => {
    if (chatMessages.value) {
        chatMessages.value.scrollTop = chatMessages.value.scrollHeight
    }
}

// 格式化时间
const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp*1000).toLocaleTimeString();
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

    if(!isVideoOn.value && openVoice)
        openVideo = true
    if(!openVideo && isVoiceOn.value)
        openVoice = false

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

// 复制会议信息到剪贴板
const copyMeetingInfo = async () => {
    try {
        const meetingInfo = `会议ID: ${meetingStore.meeting.meetingId}
        会议名称: ${meetingStore.meeting.meetingName}
        会议描述: ${meetingStore.meeting.description}
        会议密码: ${meetingStore.meeting.meetingPassword}
        开始时间: ${meetingStore.meeting.startTime ? formatTime(meetingStore.meeting.startTime) : '未设置'}`;
        
        await navigator.clipboard.writeText(meetingInfo);
        ElMessage.success('会议信息已复制到剪贴板');
    } catch (err) {
        ElMessage.error('复制失败!')
    }
};

onMounted(async () => {

    window.ipcRenderer.once('initData', (event, data : any) => {
        console.dir(data)
        userInfoStore.setUserInfo(data.userInfo,data.token)
        isMicOn.value = data.enableMicrophone
        isVideoOn.value = data.enableVideo
        isVoiceOn.value = data.enableVideo
        liveKitManager.connectToRoom(import.meta.env.VITE_WS_URL,data.token).then(() => {
            handleStream(isVideoOn.value,isMicOn.value,isVoiceOn.value)
        })
        
    })
    window.ipcRenderer.send('get-initData')

})

onUnmounted(() => {
    window.ipcRenderer.removeAllListeners("meeting-info-update")
})

// 监听消息变化，自动滚动到底部
watch(() => messages.value.length, () => {
    if (activeTab.value === 'chat') {
        nextTick(() => {
            scrollToBottom()
        })
    }
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
                    align-items: center;
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

                    .copy-btn {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        padding: 6px 12px;
                        background: linear-gradient(135deg, rgba(100, 255, 218, 0.1) 0%, rgba(100, 255, 218, 0.2) 100%);
                        border: 1px solid rgba(100, 255, 218, 0.3);
                        border-radius: 16px;
                        color: #64ffda;
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                        
                        .copy-icon {
                            width: 14px;
                            height: 14px;
                        }
                        
                        &:hover {
                            background: linear-gradient(135deg, rgba(100, 255, 218, 0.2) 0%, rgba(100, 255, 218, 0.3) 100%);
                            border-color: rgba(100, 255, 218, 0.5);
                            transform: translateY(-1px);
                            box-shadow: 0 4px 12px rgba(100, 255, 218, 0.2);
                        }
                        
                        &:active {
                            transform: translateY(0);
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
            
            .tabs-header {
                display: flex;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
                
                .tab-item {
                    flex: 1;
                    padding: 16px 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    color: #8892b0;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    position: relative;
                    
                    .tab-icon {
                        width: 16px;
                        height: 16px;
                    }
                    
                    .member-count {
                        background: rgba(100, 255, 218, 0.2);
                        color: #64ffda;
                        padding: 2px 6px;
                        border-radius: 10px;
                        font-size: 11px;
                        margin-left: 4px;
                    }
                    
                    .unread-badge {
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        color: white;
                        padding: 2px 6px;
                        border-radius: 10px;
                        font-size: 11px;
                        font-weight: 600;
                        min-width: 18px;
                        text-align: center;
                        margin-left: 4px;
                        animation: pulse 2s infinite;
                    }
                    
                    &:hover {
                        color: #ffffff;
                        background: rgba(255, 255, 255, 0.05);
                    }
                    
                    &.active {
                        color: #64ffda;
                        background: rgba(100, 255, 218, 0.1);
                        
                        &::after {
                            content: '';
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            height: 2px;
                            background: linear-gradient(135deg, #64ffda, #7c3aed);
                        }
                    }
                }
            }
            
            .chat-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px 8px;
                    
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
                    
                    .message-item {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 16px;
                        animation: fadeInUp 0.3s ease;
                        
                        .message-avatar {
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            flex-shrink: 0;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                        }
                        
                        .message-content {
                            flex: 1;
                            min-width: 0;
                            max-width: 70%;
                            
                            .message-header {
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                margin-bottom: 4px;
                                
                                .message-name {
                                    font-size: 12px;
                                    font-weight: 600;
                                    color: #64ffda;
                                }
                                
                                .message-time {
                                    font-size: 10px;
                                    color: #8892b0;
                                }
                            }
                            
                            .message-text {
                                background: rgba(255, 255, 255, 0.08);
                                padding: 8px 12px;
                                border-radius: 12px;
                                font-size: 14px;
                                color: #ffffff;
                                line-height: 1.4;
                                word-wrap: break-word;
                                word-break: break-word;
                                border: 1px solid rgba(255, 255, 255, 0.1);
                            }
                        }
                        
                        &:last-child {
                            margin-bottom: 0;
                        }
                    }
                    
                    .empty-chat {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        color: #8892b0;
                        
                        .empty-icon {
                            width: 48px;
                            height: 48px;
                            opacity: 0.5;
                            margin-bottom: 12px;
                        }
                        
                        p {
                            font-size: 14px;
                            margin: 0;
                        }
                    }
                }
                
                .chat-input {
                    padding: 12px 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    flex-shrink: 0;
                    
                    .input-container {
                        display: flex;
                        gap: 8px;
                        align-items: center;

                        .emoji-btn {
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            background: rgba(255, 255, 255, 0.08);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.3s ease;
                            flex-shrink: 0;
                            font-size: 18px;
                            
                            &:hover {
                                background: rgba(255, 255, 255, 0.12);
                                transform: scale(1.05);
                            }
                            
                            &:active {
                                transform: scale(0.95);
                            }
                            
                            &.active {
                                background: rgba(100, 255, 218, 0.2);
                                border-color: rgba(100, 255, 218, 0.5);
                            }
                        }
                        
                        .message-input {
                            flex: 1;
                            background: rgba(255, 255, 255, 0.08);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 20px;
                            padding: 10px 16px;
                            color: #ffffff;
                            font-size: 14px;
                            outline: none;
                            transition: all 0.3s ease;
                            position:relative;
                            
                            &::placeholder {
                                color: #8892b0;
                            }
                            
                            &:focus {
                                border-color: rgba(100, 255, 218, 0.5);
                                background: rgba(255, 255, 255, 0.12);
                                box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
                            }
                        }
                        .send-btn {
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #64ffda, #7c3aed);
                            border: none;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.3s ease;
                            flex-shrink: 0;
                            position: absolute;
                            z-index: 3;
                            right: 57px;
                            
                            .send-icon {
                                width: 16px;
                                height: 16px;
                                color: #ffffff;
                            }
                            
                            &:hover:not(:disabled) {
                                transform: scale(1.05);
                                box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3);
                            }
                            
                            &:active:not(:disabled) {
                                transform: scale(0.95);
                            }
                            
                            &:disabled {
                                opacity: 0.5;
                                cursor: not-allowed;
                                background: rgba(255, 255, 255, 0.1);
                            }
                        }
                    }
                    .emoji-picker {
                        position: absolute;
                        bottom: 100%;
                        left: 0;
                        right: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(15, 15, 35, 0.95);
                        display: grid;
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        max-height: 300px;
                        overflow-y: auto;
                        z-index: 100;
                        margin-bottom: 8px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                        animation: slideUp 0.3s ease;
                        
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
                        .emoji-item {
                            width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            border-radius: 6px;
                            transition: all 0.2s ease;
                            font-size: 18px;
                            
                            &:hover {
                                background: rgba(100, 255, 218, 0.1);
                                transform: scale(1.2);
                            }
                            
                            &:active {
                                transform: scale(1.1);
                            }
                        }
                    }
                }
            }
            
            .members-content {
                flex: 1;
                overflow: hidden;
                
                .members-list {
                    height: 100%;
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

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}
</style>