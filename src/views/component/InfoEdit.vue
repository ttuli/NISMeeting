<template>
  <div class="user-profile-editor">
    <TitleBar />
    <div class="editor-header">
      <h2>编辑个人信息</h2>
    </div>
    
    <div class="editor-content">
      <!-- 姓名 -->
      <div class="form-group">
        <label class="form-label" for="name">姓名</label>
        <input
          id="name"
          v-model="userInfo.nickName"
          type="text"
          class="form-input"
          placeholder="请输入姓名"
          maxlength="20"
        />
      </div>

      <!-- 性别 -->
      <div class="form-group">
        <label class="form-label">性别</label>
        <div class="radio-group">
          <label class="radio-item">
            <input
              v-model="userInfo.sex"
              type="radio"
              value="1"
            />
            <span class="radio-text">男</span>
          </label>
          <label class="radio-item">
            <input
              v-model="userInfo.sex"
              type="radio"
              value="2"
            />
            <span class="radio-text">女</span>
          </label>
          <label class="radio-item">
            <input
              v-model="userInfo.sex"
              type="radio"
              value="3"
            />
            <span class="radio-text">其他</span>
          </label>
        </div>
      </div>

      <!-- 地区 -->
      <div class="form-group">
        <label class="form-label">地区</label>
        <div class="selectArea">
          <AreaSelect ref="selectRef"></AreaSelect>
        </div>
      </div>

      <!-- 个性签名 -->
      <div class="form-group">
        <label class="form-label" for="signature">个性签名</label>
        <textarea
          id="signature"
          v-model="userInfo.personalSignature"
          class="form-textarea"
          placeholder="写下你的个性签名..."
          maxlength="100"
          rows="4"
        ></textarea>
        <div class="char-count">{{ userInfo.personalSignature.length }}/100</div>
      </div>

      <!-- 手机号展示 -->
      <div class="form-group">
        <label class="form-label">手机号</label>
        <div class="phone-display">
          {{ userInfo.phone }}
        </div>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-cancel" @click="handleCancel">
        取消
      </button>
      <button type="button" class="btn btn-save" @click="handleSave">
        保存
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import TitleBar from './title/TitleBar.vue'
import { ElMessage,ElLoading } from 'element-plus'
import AreaSelect from '@/views/component/AreaSelect.vue'
import { UpdateProfile } from '@/apis/user'
import { useUserInfoStore } from '@/stores/userInfoStore'
import { da } from 'element-plus/es/locales.mjs'

const userInfoStore = useUserInfoStore()
const selectRef = ref()
const userInfo = reactive({
  userId: '',
  nickName: '',
  sex: 1,
  personalSignature: '',
  phone: '',
  areaName:'',
  areaCode:'',
})
let hasupdate=false;

const handleSave = async () => {
  if(hasupdate)return
  if (!userInfo.nickName.trim()) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (selectRef.value.areaData) {
    let code = ''
    let name = ''
    for (let i = 0; i < selectRef.value.areaData.areaCode.length; i++) {
      code += selectRef.value.areaData.areaCode[i]
      if (i !== selectRef.value.areaData.areaCode.length-1) {
        code += ','
      }
    }
    for (let i = 0; i < selectRef.value.areaData.areaName.length; i++) {
      name += selectRef.value.areaData.areaName[i]
      if (i !== selectRef.value.areaData.areaName.length-1) {
        name += ','
      }
    }
    userInfo.areaName=name
    userInfo.areaCode=code
  }

  const loading=ElLoading.service({
      lock: true,
      text: "更新中...",
      background: "rgba(0,0,0,0.7)",
  });

  try {
    let res=await UpdateProfile({
      user:userInfo
    })
    window.ipcRenderer.send('update-userinfo',res.data.user)
    hasupdate=true
    ElMessage.success("更新成功")
    setTimeout(window.close,1200)
  } catch (err) {
    ElMessage.error("更新失败")
  } finally {
    loading.close()
  }
}

const handleCancel = () => {
  window.close()
}

onMounted(() => {
  window.ipcRenderer.once('initData',(event,data) => {
    Object.assign(userInfo,data.userInfo)
    userInfoStore.setUserInfo(data.userInfo,data.token)
    console.dir(data)
    if (selectRef.value?.areaData) {
      console.dir(data.userInfo.areaName.split(","))
      selectRef.value.areaData.areaName = data.userInfo.areaName.split(",")
      selectRef.value.areaData.areaCode = data.userInfo.areaCode.split(",")
    }
  })
  window.ipcRenderer.send('get-initData')
})
</script>

<style lang="scss" scoped>
.user-profile-editor {
  -webkit-app-region: drag;
  position: fixed;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;

  .editor-header {
    width: 100%;
    padding-top: 30px;
    padding-bottom: 10px;
    color: rgb(0, 0, 0);
    text-align:center;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .editor-content {
    width: 85%;
    height: 100%;
  }

  .form-group {
    margin-bottom: 14px;
    -webkit-app-region: no-drag;
    .selectArea {
      display: flex;
      gap: 10px;
    }

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .form-label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .form-input,
  .form-select,
  .form-textarea {
    -webkit-app-region: no-drag;
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
    }
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .char-count {
    text-align: right;
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }

  // 单选按钮样式
  .radio-group {
    -webkit-app-region: no-drag;
    display: flex;
    gap: 20px;
    margin-top: 4px;
  }

  .radio-item {
    display: flex;
    align-items: center;
    cursor: pointer;

    input[type="radio"] {
      margin-right: 8px;
      accent-color: #667eea;
    }

    .radio-text {
      font-size: 14px;
      color: #374151;
    }
  }

  // 手机号展示
  .phone-display {
    -webkit-app-region: no-drag;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    color: #374151;
  }

  // 按钮样式
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-start;
    padding-bottom: 24px;
    // border-top: 1px solid #e5e7eb;
  }

  .btn {
    -webkit-app-region: no-drag;
    padding: 12px 54px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &.btn-cancel {
      background: #f3f4f6;
      color: #374151;

      &:hover {
        background: #e5e7eb;
      }
    }

    &.btn-save {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
    }
  }
}
</style>