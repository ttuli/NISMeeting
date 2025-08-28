<template>
  <div class="image-viewer">
    <TitleBar class="titlebar" theme="night" :needMax="true"/>
    <div class="viewer-container" ref="containerRef">
      <el-image
        ref="imageRef"
        :src="imageSrc"
        class="viewer-image"
        :style="imageStyle"
        @mousedown="handleMouseDown"
        @wheel="handleWheel"
        @load="handleImageLoad"
        fit="contain"
        :draggable="false"
      />
    </div>
    
    <!-- 控制按钮 -->
    <div class="controls">
      <div class="control-group">
        <button 
          class="control-btn" 
          @click="zoomOut"
          :disabled="scale <= minScale"
          title="缩小"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M19 13H5v-2h14v2z"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        </button>
        
        <span class="scale-text">{{ Math.round(scale * 100) }}%</span>
        
        <button 
          class="control-btn" 
          @click="zoomIn"
          :disabled="scale >= maxScale"
          title="放大"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        </button>
        
        <button class="control-btn" @click="rotateLeft" title="左旋转">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13h-2.02c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"/>
          </svg>
        </button>
        
        <button class="control-btn" @click="rotateRight" title="右旋转">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"/>
          </svg>
        </button>
        
        <button class="control-btn" @click="reset" title="重置">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
        </button>
        
        <button class="control-btn save-btn" @click="saveImage" title="保存">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import TitleBar from './title/TitleBar.vue'
import { ElMessage, type ElImage } from 'element-plus'
import { saveImageToLocal } from '@/utils/saveImage'

const titleHeight = ref('30px')
const scale = ref(1)
const rotation = ref(0)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const lastTranslate = ref({ x: 0, y: 0 })

const containerRef = ref<HTMLElement>()
const imageRef = ref<InstanceType<typeof ElImage>>()

const imageInfo = ref({
  width: 0,
  height: 0,
  naturalWidth: 0,
  naturalHeight: 0
})

// 缩放限制
const minScale = ref(0.1)
const maxScale = ref(5)

// 计算属性
const imageSrc = ref('')

const imageStyle = computed(() => ({
  transform: `scale(${scale.value}) rotate(${rotation.value}deg) translate(${translateX.value}px, ${translateY.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.2s ease',
  cursor: isDragging.value ? 'grabbing' : 'grab',
  transformOrigin: 'center center'
}))

// 更新图片信息的函数
const updateImageInfo = () => {
  if (!imageRef.value) return

  const imgElement = imageRef.value.$el?.querySelector('img')
  if (!imgElement) return

  const imgRect = imgElement.getBoundingClientRect()
  
  // 更新图片信息
  imageInfo.value.naturalWidth = imgRect.width
  imageInfo.value.naturalHeight = imgRect.height
  imageInfo.value.width = imgRect.width * scale.value
  imageInfo.value.height = imgRect.height * scale.value
  console.log(imageInfo.value,containerRef.value?.getBoundingClientRect())
}

// 图片加载完成
const handleImageLoad = (e: Event) => {
  nextTick(() => {
    updateImageInfo()
  })
}

// 监听缩放变化，更新图片尺寸
watch(scale, (newV, oldV) => {
  setTimeout(() => {
    updateImageInfo()
    constrainPosition()
  },250)
})

const constrainPosition = () => {
  const limits = getDragLimits()
  
  const newTranslateX = Math.max(limits.minX, Math.min(limits.maxX, translateX.value))
  const newTranslateY = Math.max(limits.minY, Math.min(limits.maxY, translateY.value))
  
  translateX.value = newTranslateX
  translateY.value = newTranslateY
}

const zoomIn = () => {
  scale.value = Math.min(maxScale.value, scale.value * 1.2)
}

const zoomOut = () => {
  scale.value = Math.max(minScale.value, scale.value / 1.2)
}

const rotateLeft = () => {
  rotation.value -= 90
}

const rotateRight = () => {
  rotation.value += 90
}

const reset = () => {
  scale.value = 1
  rotation.value = 0
  translateX.value = 0
  translateY.value = 0
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = scale.value * delta
  
  if (newScale >= minScale.value && newScale <= maxScale.value) {
    scale.value = newScale
  }
}

const handleMouseDown = (e: MouseEvent) => {
  if (!canDrag()) return
  
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  lastTranslate.value = { x: translateX.value, y: translateY.value }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  
  const deltaX = e.clientX - dragStart.value.x
  const deltaY = e.clientY - dragStart.value.y
  
  const newTranslateX = lastTranslate.value.x + deltaX
  const newTranslateY = lastTranslate.value.y + deltaY
  
  const limits = getDragLimits()
  
  translateX.value = Math.max(limits.minX, Math.min(limits.maxX, newTranslateX))
  translateY.value = Math.max(limits.minY, Math.min(limits.maxY, newTranslateY))
}

const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const canDrag = (): boolean => {
  if (!containerRef.value || !imageInfo.value.naturalWidth) return false
  
  const containerRect = containerRef.value.getBoundingClientRect()
  
  let res = (imageInfo.value.naturalWidth > containerRect.width || imageInfo.value.naturalHeight > containerRect.height)
  return res
}

// 获取拖拽限制
const getDragLimits = () => {
  if (!containerRef.value) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  
  const containerRect = containerRef.value.getBoundingClientRect()
  const scaledWidth = imageInfo.value.naturalWidth
  const scaledHeight = imageInfo.value.naturalHeight
  
  const maxOffsetX = Math.max(0, (scaledWidth - containerRect.width) / 2) / scale.value
  const maxOffsetY = Math.max(0, (scaledHeight - containerRect.height) / 2) / scale.value
  
  return {
    minX: -maxOffsetX,
    maxX: maxOffsetX,
    minY: -maxOffsetY,
    maxY: maxOffsetY
  }
}

let saving = false;
const saveImage = async () => {
  if (saving) {
    ElMessage.warning("正在保存中，请稍候...")
    return
  }
  saving = true
  try {
    await saveImageToLocal(imageSrc.value)
  } catch (error) {
    ElMessage.error("保存失败")
  }
}


onMounted(() => {
  window.ipcRenderer.once('initData', (event, src) => {
    imageSrc.value = src
  })
  window.ipcRenderer.send('get-initData')
  window.ipcRenderer.on('download-done',(e,data) => {
    if (!saving) return
    if (data.status === 'success') {
      ElMessage.success("保存成功")
    } else {
      if(data.reason !== 'cancelled')
        ElMessage.error("保存失败")
    }
    saving = false
  })
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  window.ipcRenderer.removeAllListeners('download-done')
})
</script>

<style lang="scss" scoped>
.image-viewer {
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  position: fixed;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.titlebar {
  -webkit-app-region: drag;
  width: 100%;
  height: v-bind(titleHeight);
}

.viewer-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.viewer-image {
  max-width: none;
  max-height: none;
  user-select: none;
  transform-origin: center center;
  
  :deep(img) {
    display: block;
    pointer-events: none;
  }
}

.controls {
  position: fixed;
  width: 100%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  // align-items: center;
  justify-content: center;
  
  .control-group {
    display: flex;
    align-items: center;  
    gap: 12px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 25px;
    padding: 10px 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  
  svg {
    fill: currentColor;
    transition: transform 0.2s ease;
  }
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    
    svg {
      transform: scale(1.1);
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }
}

.scale-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  min-width: 45px;
  text-align: center;
  user-select: none;
}

// 添加加载动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.controls {
  animation: fadeIn 0.5s ease forwards;
}
</style>