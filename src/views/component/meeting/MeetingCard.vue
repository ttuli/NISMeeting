<template>
  <div class="meeting-card">
    <div class="meeting-header">
      <h3 class="meeting-title">{{ meeting.name }}</h3>
      <span class="meeting-status" :class="statusClass">
        {{ statusText }}
      </span>
    </div>
    
    <div class="meeting-details">
      <p class="meeting-description">{{ meeting.details }}</p>
    </div>
    
    <div class="meeting-footer">
      <div class="creator-info">
        <span class="creator-label">创建人：</span>
        <span class="creator-name">{{ meeting.creator }}</span>
      </div>
      
      <div class="time-info">
        <div v-if="meeting.endTime === 0" class="ongoing">
          <span class="time-label">开始时间：</span>
          <span class="time-value">{{ formatTime(meeting.startTime) }}</span>
        </div>
        <div v-else class="completed">
          <div class="time-row">
            <span class="time-label">开始时间：</span>
            <span class="time-value">{{ formatTime(meeting.startTime) }}</span>
          </div>
          <div class="time-row">
            <span class="time-label">结束时间：</span>
            <span class="time-value">{{ formatTime(meeting.endTime) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 定义props
const props = defineProps({
  meeting: {
    type: Object,
    required: true,
    default: () => ({
      name: '',
      details: '',
      hostId: '',
      hostName: '',
      startTime: 0,
      endTime: 0
    })
  }
})

// 计算会议状态
const statusText = computed(() => {
  return props.meeting.endTime === 0 ? '正在进行' : '已结束'
})

const statusClass = computed(() => {
  return props.meeting.endTime === 0 ? 'ongoing' : 'completed'
})

// 格式化时间函数
const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.meeting-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  max-width: 400px;
}

.meeting-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.meeting-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.meeting-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  flex: 1;
}

.meeting-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.meeting-status.ongoing {
  background: #dcfce7;
  color: #166534;
}

.meeting-status.completed {
  background: #e5e7eb;
  color: #4b5563;
}

.meeting-details {
  margin-bottom: 20px;
}

.meeting-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.meeting-footer {
  border-top: 1px solid #f3f4f6;
  padding-top: 16px;
}

.creator-info {
  margin-bottom: 12px;
}

.creator-label {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
}

.creator-name {
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.time-info {
  font-size: 13px;
}

.time-row {
  margin-bottom: 4px;
}

.time-row:last-child {
  margin-bottom: 0;
}

.time-label {
  color: #9ca3af;
  font-weight: 500;
}

.time-value {
  color: #4b5563;
  margin-left: 4px;
}

.ongoing .time-label,
.completed .time-label {
  color: #9ca3af;
  font-weight: 500;
}

.ongoing .time-value,
.completed .time-value {
  color: #4b5563;
}
</style>