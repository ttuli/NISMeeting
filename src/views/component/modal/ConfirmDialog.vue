<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="modal-overlay">
        <div class="modal-container" @click.stop>
          <!-- 关闭按钮 -->
          <button class="close-btn" @click="handleClose" aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- 标题 -->
          <h3 v-if="title" class="modal-title">{{ title }}</h3>

          <!-- 自定义内容 -->
          <div class="modal-content">
            <slot>
              <p>{{ content || '确认进行此操作吗？' }}</p>
            </slot>
          </div>

          <!-- 按钮组 -->
          <div class="modal-actions">
            <button 
              class="btn btn-cancel" 
              @click="handleCancel"
              :disabled="loading"
            >
              {{ cancelText }}
            </button>
            <button 
              class="btn btn-confirm" 
              @click="handleConfirm"
              :disabled="loading"
              :class="{ loading }"
            >
              <span v-if="!loading">{{ confirmText }}</span>
              <span v-else class="loading-spinner"></span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, withDefaults,ref,onMounted } from 'vue'

// 定义属性
interface Props {
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  content: '确认进行此操作吗？',
  confirmText: '确认',
  cancelText: '取消',
  loading: false,
})
const isVisible = ref(false);

// 定义事件
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// 事件处理函数
const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}

const handleClose = () => {
  if (!props.loading) {
    emit('cancel')
  }
}

onMounted(() => {
    setTimeout(() => {
        isVisible.value = true;
    },20)
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 90vw;
  width: 400px;
  max-height: 90vh;
  overflow: hidden;
  padding: 24px;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  &:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
}

.modal-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  padding-right: 32px; // 为关闭按钮留出空间
}

.modal-content {
  margin-bottom: 24px;
  color: #6b7280;
  line-height: 1.6;

  p {
    margin: 0;
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
}

.btn-cancel {
  background-color: #f9fafb;
  color: #6b7280;
  border: 1px solid #d1d5db;

  &:hover:not(:disabled) {
    background-color: #f3f4f6;
    color: #374151;
  }
}

.btn-confirm {
  background-color: #3b82f6;
  color: white;

  &:hover:not(:disabled) {
    background-color: #2563eb;
  }

  &.loading {
    cursor: wait;
  }
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 过渡动画
.modal-enter-active,
.modal-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active .modal-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.modal-enter-from .modal-container {
  opacity: 0;
  transform: scale(0.7) translateY(-50px);
}

.modal-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

// 背景淡入效果
.modal-enter-from {
  background-color: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
}

.modal-enter-to {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-leave-from {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-leave-to {
  background-color: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
}
</style>