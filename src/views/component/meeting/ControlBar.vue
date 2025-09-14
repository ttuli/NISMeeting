<template>
<div 
    class="control-bar-container"
    @mouseenter="showControlBar"
    @mouseleave="startHideTimer"
>
    <div 
    class="control-bar"
    :class="{ 'visible': isVisible, 'hidden': !isVisible }"
    >
        <div class="control-buttons">
        <!-- 麦克风控制 -->
            <button 
                class="control-btn"
                :class="{ 'active': isMicOn, 'inactive': !isMicOn }"
                @click="toggleMic"
                :title="isMicOn ? '关闭麦克风' : '开启麦克风'"
            >
                <svg v-if="isMicOn" class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                <path d="M12 18v4"/>
                <path d="M8 22h8"/>
                </svg>
                <svg v-else class="icon" viewBox="0 0 24 24" fill="currentColor">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12L9 9Z"/>
                <path d="M15 9.34V5a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-1"/>
                <path d="M19 11v-1"/>
                <path d="M12 18v4"/>
                <path d="M8 22h8"/>
                </svg>
            </button>

            <!-- 视频控制 -->
            <button 
                class="control-btn"
                :class="{ 'active': isVideoOn, 'inactive': !isVideoOn }"
                @click="toggleVideo"
                :title="isVideoOn ? '关闭屏幕共享' : '开启屏幕共享'"
            >
                <svg v-if="isVideoOn" class="icon" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <svg v-else class="icon" viewBox="0 0 24 24" fill="currentColor">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M16.5 16.5 12 12l-4.5-4.5"/>
                <path d="M3 7v10a2 2 0 0 0 2 2h9"/>
                <path d="M7 3h8a2 2 0 0 1 2 2v8"/>
                <path d="m15 12 8-5v10l-3.5-2"/>
                </svg>
            </button>

            <button 
                class="control-btn"
                :class="{ 'active': isVoiceOn, 'inactive': !isVoiceOn }"
                @click="toggleVoice"
                :title="isVoiceOn ? '关闭声音' : '开启声音'"
            >
                <svg v-if="isVoiceOn" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- 扬声器主体 -->
                <path d="M3 9v6h4l5 5V4l-5 5H3z" fill="currentColor"/>
                
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.07 5.93a9 9 0 0 1 0 12.73" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>

                <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9v6h4l5 5V4l-5 5H3z" fill="currentColor"/>
                <line x1="17" y1="7" x2="21" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="21" y1="7" x2="17" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>

            <!-- 退出按钮 -->
            <button 
                class="control-btn exit-btn"
                @click="handleExit"
                title="退出"
            >
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 6 6 18"/>
                <path d="M6 6l12 12"/>
                </svg>
            </button>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref,onMounted,onUnmounted } from 'vue'

const prop = withDefaults(defineProps<{
    isMicOn?: boolean
    isVideoOn?: boolean
    isVoiceOn?: boolean
}>(), {
    isMicOn: false,
    isVideoOn: false,
    isVoiceOn: false
})

// 状态管理
const isVisible = ref<boolean>(true)
const hideTimer = ref<number>(0)

// 事件定义
const emit = defineEmits<{
    micToggle: []
    videoToggle: []
    voiceToggle: []
    exit: []
}>()

const toggleMic = (): void => {
    emit('micToggle')
}

const toggleVideo = (): void => {
    emit('videoToggle')
}

const toggleVoice = () => {
    emit('voiceToggle')
}

const handleExit = (): void => {
    emit('exit')
}
const showControlBar = () => {
    isVisible.value = true
}
const startHideTimer = () => {
    isVisible.value = false
}

// 生命周期管理
onMounted(() => {
    setTimeout(() => {
        isVisible.value = false
    }, 3000)
})

onUnmounted(() => {
    if (hideTimer.value) {
        clearTimeout(hideTimer.value)
    }
})
</script>

<style scoped lang="scss">
.control-bar-container {
    // background-color: rgb(0, 244, 253);
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 120px;
    .checkArea {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .control-bar {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 50px;
        padding: 12px 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        pointer-events: auto;
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        opacity: 0;
        
        &.visible {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        
        &.hidden {
            opacity: 0;
            transform: translateX(-50%) translateY(100px);
        }
    }

    .trigger-area {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        pointer-events: auto;
        background: transparent;
    }
}
.control-buttons {
    display: flex;
    align-items: center;
    gap: 16px;
}

.control-btn {
    position: relative;
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        transform: scale(1.05);
        background: rgba(255, 255, 255, 0.2);
    }
    
    &:active {
        transform: scale(0.95);
    }
    
    &.active {
        background: #4CAF50;
        color: #ffffff;
    
        &:hover {
            background: #45a049;
        }
    }
    
    &.inactive {
        background: #f44336;
        color: #ffffff;
    
        &:hover {
            background: #da190b;
        }
    }
    
    &.exit-btn {
        background: #ff4757;
        
        &:hover {
            background: #ff3838;
        }
    }
}

.icon {
    width: 24px;
    height: 24px;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
}

</style>