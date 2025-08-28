<template>
  <div class="avatar-edit-button" @click="handleEdit">
    <el-upload
    ref="uploadRef"
    :multiple="false"
    :http-request="customUpload"
    :on-success="handleSuccess"
    :on-error="handleError">
    </el-upload>
    <div class="button-content">
      <el-image :src="EditSvg"></el-image>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import { fileServer } from '@/apis/user';
import { useUserInfoStore } from '@/stores/userInfoStore';
import EditSvg from '@/assets/edit.svg'

const uploadRef = ref<any>(null);
const userInfoStore = useUserInfoStore()
let loading = false

const handleEdit = (): void => {
    if (loading) {
        ElMessage.warning("正在上传,请稍后再试!")
        return
    }
    loading=true
    uploadRef.value?.$el.querySelector('input[type="file"]').click();
}
const customUpload = async (option: any) => {
    const { file, onProgress, onSuccess, onError } = option;
    try {
        const response = await fetch(fileServer+"/getSignature", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + userInfoStore.token,
            },
        });
        let data=await response.json()
        data=data.data
        let formData = new FormData();
        formData.append("success_action_status", "200");
        formData.append("policy", data.policy);
        formData.append("x-oss-signature", data.signature);
        formData.append("x-oss-signature-version", "OSS4-HMAC-SHA256");
        formData.append("x-oss-credential", data.x_oss_credential);
        formData.append("x-oss-date", data.x_oss_date);
        formData.append("key", data.dir + "avatar/"+userInfoStore.userInfo.userId+".png");
        formData.append("x-oss-security-token", data.security_token);
        formData.append("file", file);

        let res=await fetch(data.host,{
            method:"POST",
            body:formData
        })
        if(res.ok) {
            onSuccess()
        } else {
            console.dir(res)
            onError('')
        }
    } catch (err) {
        onError(err)
    }
};
const handleSuccess = (response: any, file: any, fileList: any) => {
    ElMessage.success("上传成功")
    userInfoStore.addUpdateFrequency(userInfoStore.userInfo.userId)
    loading=false
};

const handleError = (error: any, file: any, fileList: any) => {
    ElMessage.error("上传失败")
    loading=false
};
</script>

<style lang="scss" scoped>
.avatar-edit-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 25%, #6bcf7f 50%, #4d9de0 75%, #9b59b6 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    border-radius: 50%;
    animation: gradientShift 3s ease-in-out infinite;
  }

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);

    &::before {
      opacity: 1;
    }

  //   .tooltip {
  //     opacity: 1;
  //     visibility: visible;
  //     transform: translateX(-50%) translateY(-10px);
  //   }

    .edit-icon {
      transform: rotate(15deg) scale(1.1);
      color: white;
    }
  }

  &:active {
    transform: translateY(0) scale(1.02);
  }

  .button-content {
    width: 90%;
    height: 90%;
  }

  .edit-icon {
    width: 20px;
    height: 20px;
    color: white;
    transition: all 0.3s ease;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }

  .tooltip {
    position: absolute;
    top: -45px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none;
    z-index: 10;

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: rgba(0, 0, 0, 0.8);
    }
  }
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
</style>