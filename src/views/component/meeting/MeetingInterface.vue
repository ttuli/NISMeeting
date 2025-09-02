<template>
    <div class="mainContain">
        <TitleBar class="title" :btnheight="30" theme="night" :needMax="true"
        :closeLogic="closeLogic"></TitleBar>
        <div class="mainContainA">
            <div class="meetingArea">
                <div class="head">
                    <label class="title-font">{{ meetingInfo.meetingName }}</label>
                    <label class="descrip-font">{{ meetingInfo.description }}</label>
                </div>
                <div class="meetingContent">
                    <video ref="videoRef"></video>
                    <ControlBar class="controlBar"
                    :isMicOn="isMicOn"
                    :isVideoOn="isVideoOn"
                    @micToggle="micToggle"
                    @videoToggle="videoToggle"
                    @exit="closeLogic"></ControlBar>
                </div>
            </div>
            <button class="asideBtn" @click="asideClick">☰</button>
            <el-aside class="asideBar">
                <label class="memberTitle">成员列表 ({{ memberList.length }}人)</label>

                <div v-for="v in memberList" class="members">
                    <CusImage :uid="v.uid" class="memberAvatar"></CusImage>
                    <div class="nameArea">
                        <label v-if="meetingInfo.hostId===v.uid"
                        class="hostIdentifier">主持人</label>
                        <label class="memberName" :title="v.name">{{ v.name }}</label>
                    </div>
                    <div style="width: 20px;"></div>
                    <label style="color: white; font-size: 14px;" v-if="v.uid===userInfoStore.userInfo.userId">我</label>
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
import { computed, ref, onMounted, reactive, onUnmounted } from 'vue';
import { useUserInfoStore } from '@/stores/userInfoStore';
import ControlBar from './ControlBar.vue';
import ConfirmDialog from '../modal/ConfirmDialog.vue';
import CusImage from '../CusImage.vue';
import 'splitpanes/dist/splitpanes.css'
import { LeftMeeting } from '@/apis/meeting';
import { ElMessage } from 'element-plus';
import { createOffer } from '@/utils/rtcClient'

const isVideoOn = ref(true)
const isMicOn = ref(true)
const micToggle = () => {
    isMicOn.value = !isMicOn.value
}
const videoToggle = () => {
    isVideoOn.value = !isVideoOn.value
}

const userInfoStore = useUserInfoStore()
const videoRef = ref<HTMLVideoElement | null>(null)
const collapsed = ref(false)
const asideBarWidth = computed(() => {
    return collapsed.value ? '0px' : '150px';
});

const showConfirmDialog = ref(false);
let confirmText = ref('确认退出会议？')

interface MemberInfo {
    uid : string;
    name : string;
}

let memberList = ref<MemberInfo[]>([])
let meetingInfo = reactive({
    meetingId: '',
    meetingName: '',
    description: '',
    hostId: '',
    status: 1,
    startTime: 0,
    endTime: 0
})

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
    try {
        await LeftMeeting({
            meetingId:meetingInfo.meetingId,
            userId: userInfoStore.userInfo.userId,
            userName: userInfoStore.userInfo.nickName
        })
    } finally {
        showConfirmDialog.value = false;
        window.close()
    }
}

onMounted(async () => {
    window.ipcRenderer.once('initData', (event, data : any) => {
        console.dir(data)
        Object.assign(meetingInfo,data.info)
        console.dir(meetingInfo)
        userInfoStore.setUserInfo(data.userInfo,data.token)
        memberList.value = data.info.members
        isMicOn.value = data.enableMicrophone
        isVideoOn.value = data.enableCamera

        createOffer(meetingInfo.meetingId,userInfoStore.userInfo.userId)
    })
    window.ipcRenderer.on("meeting-info-update", (event, data: any) => {
        console.dir(data)
        if (data.HostId === userInfoStore.userInfo.userId && meetingInfo.hostId !== userInfoStore.userInfo.userId) {
            ElMessage.info("你已成为主持人")
        }
        meetingInfo.hostId = data.HostId
        memberList.value = []
        memberList.value = data.members
    })
    window.ipcRenderer.send('get-initData')
})
onUnmounted(() => {
    window.ipcRenderer.removeAllListeners("meeting-info-update")
})
</script>

<style scoped lang="scss">
.mainContain {
    -webkit-app-region: drag;
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: #111827;
    display: flex;
    flex-direction: column;
    .confirmDialog {
        position: absolute;
        width: 100%;
        height: 100%;
    }
    .title {
        width: 100%;
        height: 30px;
    }
    .mainContainA {
        -webkit-app-region: no-drag;
        width: 100%;
        height: 100%;
        // background-color: #fff;
        display: flex;
        justify-content: space-between;
        .meetingArea {
            display: flex;
            flex-direction: column;
            flex: 1;
            .head {
                width: 100%;
                display: flex;
                flex-direction: column;
                padding-left: 10px;
            }
            .meetingContent {
                position: relative;
                width: 100%;
                height: 100%;
                .controlBar {
                    position: absolute;
                    // background-color: rgb(0, 0, 0);
                }
            }
        }
        .asideBtn {
            position: absolute;
            top: 50%;
            bottom: 50%;
            right: v-bind(asideBarWidth);
            width: 20px;
            height: 40px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border: none;
            border-radius: 20px 0px 0px 20px;
            cursor: pointer;
            transition: font-size 0.3s;
            display: flex;
            justify-content: center;
            align-items: center;
            padding-left: 8px;
            transition: right 0.3s ease;
        }
        .asideBtn:hover {
            font-size: 15px;
        }
        .asideBar {
            width: v-bind(asideBarWidth);
            height: 100%;
            background-color: rgba(78, 78, 78, 0.347);
            transition: width 0.3s ease;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 10px;
            .memberTitle {
                color: rgb(255, 255, 255);
                font-size: 16px;
                padding: 5px;
                border-bottom: rgb(139, 139, 139) 1px solid;
            }
            .members {
                width: 100%;
                height: 40px;
                display: flex;
                align-items: center;
                padding-left: 5px;
                overflow: hidden;
                .memberAvatar {
                    -webkit-app-region: no-drag;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                }
                .nameArea {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    .memberName {
                        width: 50px;
                        white-space: nowrap;        /* 不换行 */
                        overflow: hidden;           /* 超出隐藏 */
                        text-overflow: ellipsis;    /* 超出部分显示 ... */
                        margin-left: 45px;
                        color: rgb(255, 255, 255);
                        font-size: 16px;
                    }
                    .hostIdentifier {
                        text-align: center;
                        height: 15px;
                        width: 35px;
                        margin-left: 25px;
                        font-size: 10px;
                        color: white;
                        border-radius: 10%;
                        background-color: yellowgreen;
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
</style>