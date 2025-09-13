<template>
  <div class="meeting-room">
    <div class="participants-grid" :class="{ expanded: expandedParticipant }">
      <div
        v-for="participant in meetingStore.participants"
        :key="participant.id"
        class="participant-item"
        :class="{ 
          'is-expanded': expandedParticipant === participant.id,
          'is-hidden': expandedParticipant && expandedParticipant !== participant.id
        }"
        @click="toggleExpand(participant.id)"
      >
        <!-- 有视频时优先显示视频 -->
        <div v-if="participant.videoRef" class="video-container">
          <video 
            :ref="participant.videoRef"
            :muted="false"
            autoplay
            playsinline
          ></video>
          
          <!-- 隐藏的音频元素，仍然播放 -->
          <audio 
            v-for="audio in participant.audioRefs"
            :key="audio.id"
            :ref="audio.ref" 
            :muted="audio.muted"
            autoplay
            style="display: none;"
          ></audio>
          
          <!-- 悬浮信息 -->
          <div class="participant-info">
            <img :src="participant.avatar" :alt="participant.name" class="avatar">
            <span class="name">{{ participant.name }}</span>
            <!-- 显示音频数量指示 -->
            <span v-if="participant.audios.length > 0" class="audio-count">
              🎵 {{ participant.audios.length }}
            </span>
          </div>
        </div>

        <!-- 没有视频时显示音频界面 -->
        <div v-else class="audio-container">
          <audio 
            v-for="audio in participant.audioRefs"
            :key="audio.id"
            :src="audio.url" 
            :ref="audio"
            :muted="audio.muted"
            autoplay
            style="display: none;"
          ></audio>
          
          <div class="audio-display">
            <CusImage :uid="participant.id"/>
            <span class="name">{{ participant.name }}</span>
            <!-- 显示音频数量 -->
            <span class="audio-count">🎵 {{ participant.audios.length }} 音频源</span>
          </div>
        </div>

        <!-- 扩展模式下的关闭按钮 -->
        <button 
          v-if="expandedParticipant === participant.id"
          class="close-btn"
          @click.stop="toggleExpand(null)"
        >
          ×
        </button>
      </div>
    </div>

    <!-- 控制按钮 -->
    <!-- <div class="controls">
      <div class="main-controls">
        <button @click="addVideoParticipant">添加视频参与者</button>
        <button @click="addAudioParticipant">添加音频参与者</button>
        <button @click="removeParticipant">移除最后一个</button>
      </div>
      
      参与者管理
      <div class="participant-controls" v-if="participants.length > 0">
        <h4>参与者管理:</h4>
        <div v-for="participant in participants" :key="participant.id" class="participant-control-item">
          <span>{{ participant.name }}</span>
          <div class="control-buttons">
            <button 
              @click="addAudioToParticipant(participant.id)"
              class="small-btn"
            >
              + 音频
            </button>
            <button 
              @click="toggleVideoForParticipant(participant.id)"
              class="small-btn"
              :class="{ active: participant.video }"
            >
              {{ participant.video ? '关闭' : '开启' }}视频
            </button>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CusImage from '../CusImage.vue'
import { useMeetingStore } from '@/stores/meetingStore'
const meetingStore = useMeetingStore()

// const participants = ref<Participant[]>([
//   {
//     id: '1',
//     name: '张三',
//     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
//     video: {
//       url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
//       muted: true
//     },
//     audios: [
//       { id: 'a1', url: '', muted: false },
//       { id: 'a2', url: '', muted: false }
//     ]
//   },
//   {
//     id: '2', 
//     name: '李四',
//     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
//     audios: [
//       { id: 'a3', url: '', muted: false }
//     ]
//   },
//   {
//     id: '3',
//     name: '王五',
//     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', 
//     video: {
//       url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
//       muted: true
//     },
//     audios: [
//       { id: 'a4', url: '', muted: false }
//     ]
//   },
//   {
//     id: '4',
//     name: '赵六',
//     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
//     audios: [
//       { id: 'a5', url: '', muted: false },
//       { id: 'a6', url: '', muted: false },
//       { id: 'a7', url: '', muted: false }
//     ]
//   }
// ])

const expandedParticipant = ref<string | null>(null)

const toggleExpand = (id: string | null) => {
  expandedParticipant.value = expandedParticipant.value === id ? null : id
}

const addVideoParticipant = () => {
  const id = Date.now().toString()
  participants.value.push({
    id,
    name: `用户${participants.value.length + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    video: {
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      muted: true
    },
    audios: [
      { id: `${id}_a1`, url: '', muted: false }
    ]
  })
}

const addAudioParticipant = () => {
  const id = Date.now().toString()
  participants.value.push({
    id,
    name: `用户${participants.value.length + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    audios: [
      { id: `${id}_a1`, url: '', muted: false }
    ]
  })
}

const addAudioToParticipant = (participantId: string) => {
  const participant = participants.value.find(p => p.id === participantId)
  if (participant) {
    const audioId = `${participantId}_a${Date.now()}`
    participant.audios.push({
      id: audioId,
      url: '',
      muted: false
    })
  }
}

const toggleVideoForParticipant = (participantId: string) => {
  const participant = participants.value.find(p => p.id === participantId)
  if (participant) {
    if (participant.video) {
      // 移除视频
      participant.video = undefined
    } else {
      // 添加视频
      participant.video = {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        muted: true
      }
    }
  }
}

const removeParticipant = () => {
  if (participants.value.length > 0) {
    const removed = participants.value.pop()
    if (expandedParticipant.value === removed?.id) {
      expandedParticipant.value = null
    }
  }
}
</script>

<style lang="scss" scoped>
.meeting-room {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: #1a1a1a;
    display: flex;
    flex-direction: column;
    position: fixed;
}

.participants-grid {
  flex: 1;
  display: grid;
  gap: 8px;
  padding: 16px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-auto-rows: minmax(200px, 1fr);
  transition: all 0.3s ease;

  &.expanded {
    grid-template-columns: 1fr;
    grid-auto-rows: 1fr;
    gap: 0;
    padding: 0;
  }
}

.participant-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #2d2d2d;

  &.is-expanded {
    position: fixed;
    width: 100%;
    height: 100%;
    border-radius: 0;
    z-index: 10;
  }

  &.is-hidden {
    opacity: 0;
    pointer-events: none;
    transform: scale(0.8);
  }

  &:hover:not(.is-expanded) {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);

    .participant-info {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.video-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.audio-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .audio-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
}

.participant-info {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.name {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.audio-count {
  color: #fff;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  margin-top: 4px;
}

.audio-display {
  .avatar {
    width: 80px;
    height: 80px;
    border: 3px solid rgba(255, 255, 255, 0.8);
  }

  .name {
    font-size: 16px;
    font-weight: 600;
    margin-top: 8px;
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  z-index: 20;

  &:hover {
    background: rgba(255, 0, 0, 0.7);
    transform: scale(1.1);
  }
}

.controls {
  padding: 16px;
  background: #2d2d2d;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .main-controls {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  button {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    background: #4a90e2;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #357abd;
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.participant-controls {
  h4 {
    color: #fff;
    margin: 0 0 12px 0;
    font-size: 14px;
  }
}

.participant-control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  margin-bottom: 8px;

  span {
    color: #fff;
    font-size: 14px;
  }

  .control-buttons {
    display: flex;
    gap: 8px;
  }

  .small-btn {
    padding: 4px 8px;
    font-size: 12px;
    background: #666;
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #777;
    }

    &.active {
      background: #4a90e2;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .participants-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    grid-auto-rows: minmax(180px, 1fr);
  }

  .participant-info {
    bottom: 8px;
    right: 8px;
    
    .avatar {
      width: 32px;
      height: 32px;
    }
    
    .name {
      font-size: 11px;
    }
  }

  .audio-display .avatar {
    width: 60px;
    height: 60px;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .participants-grid {
    grid-template-columns: 1fr;
    padding: 8px;
  }
  
  .controls {
    .main-controls {
      flex-direction: column;
      
      button {
        width: 100%;
      }
    }
    
    .participant-control-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
}
</style>