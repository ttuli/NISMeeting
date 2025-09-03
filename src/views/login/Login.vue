<template>
<div class="loginLayout">
    <TitleBar class="titlebar" :btnheight="30" :closeLogic="closeLogic"></TitleBar>
    <div class="loginContent">
        <div class="nav">
            <el-text 
                :class="['titleFont', { active: currentTab === 'login' }]"
                @click="switchTab('login')"
            >
                登录
            </el-text>
            <el-text 
                :class="['titleFont', { active: currentTab === 'register' }]"
                @click="switchTab('register')"
            >
                注册
            </el-text>
        </div>

        <!-- 表单容器 -->
        <div class="formContainer">
            <!-- 登录表单 -->
            <div v-if="currentTab === 'login'" class="form loginForm">
                <h2 class="formTitle">欢迎回来</h2>
                <p class="formSubtitle">请输入您的账号信息</p>
                
                <div class="inputGroup">
                    <div class="inputWrapper">
                        <input 
                            v-model="loginForm.phone"
                            type="tel"
                            placeholder="请输入手机号"
                            class="customInput"
                            maxlength="11"
                            ref="loginPhoneRef"
                            @keyup.enter="handleEnter('login-phone')"
                        />
                        <span class="inputIcon">📱</span>
                    </div>
                </div>

                <div class="inputGroup">
                    <div class="inputWrapper">
                        <input 
                            v-model="loginForm.password"
                            :type="showPassword ? 'text' : 'password'"
                            placeholder="请输入密码"
                            class="customInput"
                            maxlength="25"
                            ref="loginPwdRef"
                            @keyup.enter="handleEnter('login-pwd')"
                        />
                        <span class="inputIcon">🔒</span>
                        <span 
                            class="passwordToggle"
                            @click="togglePassword"
                        >
                            {{ showPassword ? '🙈' : '👁️' }}
                        </span>
                    </div>
                </div>

                <button class="submitBtn" @click="handleLogin">
                    <div v-if="!loading">登录</div>
                    <div v-else>登录中...</div>
                </button>

                <!-- <div class="linkSection">
                    <a href="#" class="forgotLink">忘记密码？</a>
                </div> -->
            </div>

            <!-- 注册表单 -->
            <div v-if="currentTab === 'register'" class="form registerForm">
                <h2 class="formTitle">创建账号</h2>
                <p class="formSubtitle">请填写以下信息完成注册</p>
                
                <div class="inputGroup">
                    <div class="inputWrapper">
                        <input 
                            v-model="registerForm.phone"
                            type="tel"
                            placeholder="请输入手机号"
                            class="customInput"
                            maxlength="11"
                            ref="registerPhoneRef"
                            @keyup.enter="handleEnter('register-phone')"
                        />
                        <span class="inputIcon">📱</span>
                    </div>
                </div>

                <div class="inputGroup">
                    <div class="inputWrapper">
                        <input 
                            v-model="registerForm.password"
                            :type="showPassword ? 'text' : 'password'"
                            placeholder="请输入密码"
                            class="customInput"
                            maxlength="25"
                            ref="registerPwdRef"
                            @keyup.enter="handleEnter('register-pwd')"
                        />
                        <span class="inputIcon">🔒</span>
                        <span 
                            class="passwordToggle"
                            @click="togglePassword"
                        >
                            {{ showPassword ? '🙈' : '👁️' }}
                        </span>
                    </div>
                </div>

                <div class="inputGroup">
                    <div class="inputWrapper">
                        <input 
                            v-model="registerForm.confirmPassword"
                            :type="showConfirmPassword ? 'text' : 'password'"
                            placeholder="请确认密码"
                            class="customInput"
                            ref="registerConfirmPwdRef"
                            @keyup.enter="handleEnter('register-confirm-pwd')"
                        />
                        <span class="inputIcon">🔐</span>
                        <span 
                            class="passwordToggle"
                            @click="toggleConfirmPassword"
                        >
                            {{ showConfirmPassword ? '🙈' : '👁️' }}
                        </span>
                    </div>
                </div>

                <button class="submitBtn" @click="handleRegister">
                    <div v-if="!loading">注册</div>
                    <div v-else>注册中...</div>
                </button>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import TitleBar from '@/views/component/title/TitleBar.vue'
import { ElMessage } from 'element-plus'
import { Login,Register } from '@/apis/user'
import { useUserInfoStore } from '@/stores/userInfoStore.ts'
import router from '../router'

const currentTab = ref('login')
const loading = ref(false)

const userInfoStore = useUserInfoStore()

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const loginPhoneRef = ref()
const loginPwdRef = ref()
const registerPhoneRef = ref()
const registerPwdRef = ref()
const registerConfirmPwdRef = ref()

// 表单数据
const loginForm = reactive({
    phone: '',
    password: ''
})

const registerForm = reactive({
    phone: '',
    password: '',
    confirmPassword: ''
})

// 切换标签
const switchTab = (tab: string) => {
    if (loading.value) return
    currentTab.value = tab
    // 清空表单
    loginForm.phone = ''
    loginForm.password = ''
    registerForm.phone = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
}

// 切换密码显示
const togglePassword = () => {
    showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
    showConfirmPassword.value = !showConfirmPassword.value
}

// 处理回车
const handleEnter = (type : string) => {
    if (type === 'login-phone') {
        loginPwdRef.value?.focus()
    } else if (type === 'login-pwd') {
        handleLogin()
    } else if (type === 'register-phone') {
        registerPwdRef.value?.focus()
    } else if (type === 'register-pwd') {
        registerConfirmPwdRef.value?.focus()
    } else if (type === 'register-confirm-pwd') {
        handleRegister()
    }
};

// 处理登录
const handleLogin = async () => {
    if (loading.value) return
    if (!loginForm.phone || !loginForm.password) {
        ElMessage.warning('请填写完整信息')
        return
    }
    if (!/^1[3-9]\d{9}$/.test(loginForm.phone)) {
        ElMessage.warning('请输入正确的手机号')
        return
    }
    loading.value = true
    try {
        let res=await Login(loginForm)
        ElMessage.success('登录成功')
        loading.value = false
        if (res.data.token === '' || res.data.token === undefined) {
            ElMessage.error("登录失败")
            return 
        }
        userInfoStore.setUserInfo(res.data.user,res.data.token)
        window.ipcRenderer.send('login-success',res.data.token)
        router.push('/main')
    } catch (error) {
        ElMessage.error("登录失败")
        loading.value = false
    }
}

// 处理注册
const handleRegister = async () => {
    if (loading.value) return
    if (!registerForm.phone || !registerForm.password || !registerForm.confirmPassword) {
        ElMessage.warning('请填写完整信息')
        return
    }
    if (!/^1[3-9]\d{9}$/.test(registerForm.phone)) {
        ElMessage.warning('请输入正确的手机号')
        return
    }
    if (registerForm.password !== registerForm.confirmPassword) {
        ElMessage.warning('两次输入的密码不一致')
        return
    }
    if (registerForm.password.length < 6) {
        ElMessage.warning('密码长度至少6位')
        return
    }
    loading.value = true
    try {
        await Register(registerForm)
        ElMessage.success('注册成功，请登录')
        loading.value = false
        switchTab('login')
    } finally {
        loading.value = false
    }
}
const closeLogic = () => {
    window.ipcRenderer.send('quit')
}
</script>

<style lang="scss" scoped>
.loginLayout {
    -webkit-app-region: drag;
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

    .titlebar {
        top: 0;
        left: 0;
        width: 100%;
        height: 65px;
    }
    
    .loginContent {
        background: transparent;
        backdrop-filter: blur(10px);
        width: 100%;
        height: 100%;
        
        .nav {
            display: flex;
            justify-content: center;
            gap: 40px;
            // position: relative;
            
            .titleFont {
                font-size: 28px;
                font-weight: 700;
                color: #666;
                cursor: pointer;    
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                padding: 12px 24px;
                border-radius: 12px;
                user-select: none;
                -webkit-app-region: no-drag;
                
                &:hover {
                    color: #667eea;
                    transform: translateY(-2px);
                    background: rgba(102, 126, 234, 0.1);
                }
                
                &.active {
                    color: #667eea;
                    background: rgba(102, 126, 234, 0.15);
                    transform: scale(1.05);
                    
                    &::after {
                        content: '';
                        position: absolute;
                        bottom: -8px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 30px;
                        height: 3px;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        border-radius: 2px;
                        animation: slideIn 0.3s ease-out;
                    }
                }
                
                &:active {
                    transform: scale(0.98);
                }
            }
        }
        
        .formContainer {
            .form {
                animation: fadeIn 0.5s ease-out;
                
                .formTitle {
                    font-size: 32px;
                    font-weight: 700;
                    color: #333;
                    text-align: center;
                    margin-bottom: 8px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .formSubtitle {
                    text-align: center;
                    color: #888;
                    margin-bottom: 35px;
                    font-size: 16px;
                }
                
                .inputGroup {
                    margin-bottom: 25px;
                    
                    .inputWrapper {
                        position: relative;
                        
                        .customInput {
                            width: 100%;
                            height: 56px;
                            padding: 0 20px 0 55px;
                            border: 2px solid #e1e5e9;
                            border-radius: 16px;
                            font-size: 16px;
                            color: #333;
                            background: #fff;
                            box-sizing: border-box;
                            transition: all 0.3s ease;
                            -webkit-app-region: no-drag;
                            
                            &:focus {
                                outline: none;
                                border-color: #667eea;
                                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                                transform: translateY(-1px);
                            }
                            
                            &::placeholder {
                                color: #aaa;
                                transition: all 0.3s ease;
                            }
                            
                            &:focus::placeholder {
                                color: #ccc;
                                transform: translateX(5px);
                            }
                        }
                        
                        .inputIcon {
                            position: absolute;
                            left: 18px;
                            top: 50%;
                            transform: translateY(-50%);
                            font-size: 18px;
                            pointer-events: none;
                        }
                        
                        .passwordToggle {
                            position: absolute;
                            right: 18px;
                            top: 50%;
                            transform: translateY(-50%);
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            
                            &:hover {
                                transform: translateY(-50%) scale(1.1);
                            }
                        }
                    }
                }
                
                .submitBtn {
                    width: 100%;
                    height: 56px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 16px;
                    color: white;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 15px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    -webkit-app-region: no-drag;
                    
                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
                    }
                    
                    &:active {
                        transform: translateY(0);
                        box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
                    }
                }
                
                .linkSection {
                    text-align: center;
                    margin-top: 25px;
                    
                    .forgotLink {
                        color: #667eea;
                        text-decoration: none;
                        font-size: 14px;
                        transition: all 0.2s ease;
                        -webkit-app-region: no-drag;
                        
                        &:hover {
                            color: #764ba2;
                            text-decoration: underline;
                        }
                    }
                }
            }
        }
    }
}

@keyframes slideIn {
    from {
        width: 0;
        opacity: 0;
    }
    to {
        width: 30px;
        opacity: 1;
    }
}

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

// 响应式设计
@media (max-width: 768px) {
    .loginLayout {
        .loginContent {
            width: 85%;
            // padding: 0 10px 0 10px;
            
            .nav {
                gap: 25px;
                
                .titleFont {
                    font-size: 24px;
                    padding: 10px 18px;
                }
            }
            
            .formContainer .form {
                .formTitle {
                    font-size: 28px;
                }
                
                .inputGroup .inputWrapper .customInput {
                    height: 52px;
                    padding: 0 18px 0 50px;
                }
                
                .submitBtn {
                    height: 52px;
                    font-size: 16px;
                }
            }
        }
    }
}
</style>