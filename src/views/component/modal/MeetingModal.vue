<template>
<div class="modal-overlay">  
    <div class="modal-container">
    <TitleBar :btnheight="titleHeight" :needMin="false" class="titlebar"></TitleBar>
    <h2 class="modal-title">{{ isCreateMode ? '创建会议' : '加入会议' }}</h2>

    <form @submit.prevent="handleSubmit" class="form">
        <!-- 创建会议表单 -->
        <div v-if="isCreateMode" class="form-section">
        <!-- 会议名称 -->
        <div class="form-group">
            <label class="form-label required">会议名称</label>
            <input 
            v-model="formData.meetingName" 
            type="text" 
            class="form-input"
            placeholder="请输入会议名称"
            maxlength="30"
            required
            />
        </div>
        <div class="form-group">
            <label class="form-label">会议描述</label>
            <textarea class="form-textarea"
            placeholder="简短描述会议，不超过50字"
            v-model="formData.description"
            maxlength="50"></textarea>
        </div>

        <!-- 会议密码 -->
        <div class="form-group">
            <label class="form-label">会议密码</label>
            <input 
            v-model="formData.meetingPassword" 
            type="password" 
            class="form-input"
            placeholder="可选，设置会议密码(不超过20位)"
            maxlength="20"
            />
        </div>
        </div>

        <!-- 加入会议表单 -->
        <div v-else class="form-section">
        <!-- 会议ID -->
        <div class="form-group">
            <label class="form-label required">会议ID</label>
            <input 
            v-model="formData.meetingId" 
            type="text" 
            class="form-input"
            placeholder="请输入会议ID"
            required
            />
        </div>

        <!-- 会议密码 -->
        <div class="form-group">
            <label class="form-label">会议密码</label>
            <input 
            v-model="formData.meetingPassword" 
            type="password" 
            class="form-input"
            placeholder="如有密码请输入"
            />
        </div>
        </div>

        <!-- 通用设置 -->
        <div class="form-section">
        <!-- 入会时的名字 -->
        <div class="form-group">
            <label class="form-label required">入会时的名字</label>
            <input 
            v-model="formData.userName" 
            type="text" 
            class="form-input"
            placeholder="请输入您的名字（可选）"
            required
            />
        </div>

        <!-- 音视频设置 -->
        <div class="form-group" v-if="isCreateMode">
            <label class="form-label">音视频设置</label>
            <div class="checkbox-group">
            <label class="checkbox-option">
                <input 
                v-model="formData.enableMicrophone" 
                type="checkbox"
                />
                <span class="checkbox-custom"></span>
                开启麦克风
            </label>
            <label class="checkbox-option">
                <input 
                v-model="formData.enableVideo" 
                type="checkbox"
                />
                <span class="checkbox-custom"></span>
                开启视频画面
            </label>
            </div>
        </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group">
        <button type="button" class="btn btn-cancel" @click="handleCancel">
            取消
        </button>
        <button type="submit" class="btn btn-primary">
            {{ isCreateMode ? '创建会议' : '加入会议' }}
        </button>
        </div>
    </form>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import TitleBar from '@/views/component/title/TitleBar.vue'
import { ElLoading, ElMessage } from 'element-plus'
import { CreateMeeting,JoinMeeting } from '@/apis/meeting'
import { useUserInfoStore } from '@/stores/userInfoStore'

const titleHeight = ref(30)
const userInfoStore = useUserInfoStore()
const isCreateMode = ref(true)
const formData = reactive({
    meetingName: '',
    description: '',
    meetingId: '',
    meetingPassword: '',
    userName: '',
    enableMicrophone: false,
    enableVideo: false
})

onMounted(() => {
    if (isCreateMode.value) {
        formData.enableVideo = true;
        formData.enableMicrophone = false;
    }
    window.ipcRenderer.once('initData', (event, data) => {
        if (data.type === 'join') {
            isCreateMode.value = false
        } else if (data.type === 'create') {
            isCreateMode.value = true
        }
        formData.userName = data.userInfo.nickName
        userInfoStore.userInfo=data.userInfo
        userInfoStore.token=data.token
    })
    window.ipcRenderer.send('get-initData')
})

// 处理表单提交
const handleSubmit = async () => {
    formData.meetingId = formData.meetingId.trim()
    formData.meetingPassword = formData.meetingPassword.trim()
    if (!isCreateMode.value && formData.meetingId === "") {
        ElMessage.error("请输入正确的会议id")
        return
    }
    const loading = ElLoading.service({
        lock: true,
        text: '创建中...',
        background: 'rgba(0, 0, 0, 0.7)',
    })
    try {
        if (isCreateMode.value) {
            let data = {
                meetingName: '',
                description: '',
                meetingPassword: '',
                hostId: '',
                hostName: '',
            }
            Object.assign(data, formData)
            data.hostId = userInfoStore.userInfo.userId
            data.hostName = formData.userName
            let res = await CreateMeeting(data)

            let sendData = {...userInfoStore.userInfo}
            sendData.nickName = formData.userName

            window.ipcRenderer.send('meeting',{
                type:'create',
                info: res.data.info,
                userInfo:sendData,
                token:res.data.token,
                enableMicrophone:formData.enableMicrophone,
                enableVideo:formData.enableVideo
            })
        } else {
            let has = await window.ipcRenderer.invoke('meeting-check',formData.meetingId)
            if (!has) {
                let res = await JoinMeeting({
                    meetingId: formData.meetingId,
                    userId: userInfoStore.userInfo.userId,
                    userName: formData.userName,
                    meetingPassword: formData.meetingPassword
                })
                let sendData = {...userInfoStore.userInfo}
                sendData.nickName = formData.userName
                window.ipcRenderer.send('meeting',{
                    type:'join',
                    meetingPassword:formData.meetingPassword,
                    info:{
                        meetingId:formData.meetingId,
                    },
                    userInfo:sendData,
                    token:res.data.token,
                    enableMicrophone:false,
                    enableVideo:false
                })
            }
        }
        loading.close()
        handleCancel()
    } catch (err) {
        ElMessage.error(isCreateMode.value?"创建失败":"加入失败")
        loading.close()
        console.log(err)
    }
}
const handleCancel = () => {
    window.close()
}
</script>

<style scoped>
.modal-overlay {
    -webkit-app-region: drag;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.titlebar {
    position: fixed;
    /* top: 0; */
    width: 100%;
    height: v-bind(titleHeight);
}

.modal-container {
    position: fixed;
    top: 35px;
    width: 80%;
    height: 100%;
    margin: 5px;
    display: flex;
    flex-direction: column;
}

.modal-title {
    font-size: 28px;
    font-weight: 600;
    text-align: center;
    margin: 0 0 24px 0;
    color: #1a1a1a;
}

/* .titlebar {
    position: absolute;
    width: 100%;
    height: 30px;
} */

.form {
    -webkit-app-region: no-drag;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-label {
    font-size: 14px;
    font-weight: 500;
    color: #333;
}

.form-textarea {
    resize: none;
    padding: 12px 16px;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;
    background: white;
}
.form-textarea:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}
.form-textarea::placeholder {
    font-weight: 500;
    color: #999;
}

.form-label.required::after {
    content: " *";
    color: #ff4444;
}

.form-input {
    padding: 12px 16px;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;
    background: white;
}

.form-input:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.form-input::placeholder {
    color: #999;
}

.radio-group {
    display: flex;
    gap: 24px;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #333;
}

.radio-option input[type="radio"] {
    display: none;
}

.radio-custom {
    width: 18px;
    height: 18px;
    border: 2px solid #d0d0d0;
    border-radius: 50%;
    position: relative;
    transition: all 0.2s;
}

.radio-option input[type="radio"]:checked + .radio-custom {
    border-color: #1890ff;
}

.radio-option input[type="radio"]:checked + .radio-custom::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: #1890ff;
    border-radius: 50%;
}

.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.checkbox-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #333;
}

.checkbox-option input[type="checkbox"] {
    display: none;
}

.checkbox-custom {
    width: 18px;
    height: 18px;
    border: 2px solid #d0d0d0;
    border-radius: 4px;
    position: relative;
    transition: all 0.2s;
}

.checkbox-option input[type="checkbox"]:checked + .checkbox-custom {
    background: #1890ff;
    border-color: #1890ff;
}

.checkbox-option input[type="checkbox"]:checked + .checkbox-custom::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 12px;
    font-weight: 600;
}

.button-group {
    -webkit-app-region: no-drag;
    position: absolute;
    bottom: 60px;
    right: 0px;

    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.btn {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    min-width: 80px;
}

.btn-cancel {
    background: #f5f5f5;
    color: #666;
}

.btn-cancel:hover {
    background: #e8e8e8;
}

.btn-primary {
    background: #1890ff;
    color: white;
}

.btn-primary:hover {
    background: #40a9ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.btn-primary:active {
    transform: translateY(1px);
}
</style>