<template>
    <div class="content">
        <img src="@/assets/logo.png" alt="NIS" class="logo" />
        <el-text class="logoText">NISMeeting</el-text>
        <div class="titleBtns">
            <button class="minBtn" @click="minFunc" v-if="needMin">—</button>
            <button class="maxBtn" @click="maxFunc" v-if="needMax">{{ maxIcon }}</button>
            <button class="closeBtn" @click="closeLogic">×</button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref,onMounted,computed,onUnmounted } from 'vue';
const props = withDefaults(defineProps<{
    btnheight?: number;
    needMin?: boolean;
    needMax?: boolean;
    closeLogic?: () => void;
    theme?: string;
}>(),{
    btnheight: 30,
    needMin: true,
    needMax: false,
    closeLogic: () => {
        window.close();
    },
    theme: 'day'
});
const btnSize = computed(() => {
    return props.btnheight+"px"
})
const fontColor = ref('')
const hoverColor = ref('')
const pressColor = ref('')
const maxIcon = ref('🗖')
onMounted(() => {
    if (props.theme=="night") {
        fontColor.value="white"
        hoverColor.value="#ffffff33"
        pressColor.value="#ffffff6e"
    } else {
        fontColor.value="black"
        hoverColor.value="#c2c1c188"
        pressColor.value="#9797976e"
    }
    window.ipcRenderer.on('maximize',(e) => {
        maxIcon.value="🗗"
    })
    window.ipcRenderer.on('unmaximize',(e) => {
        maxIcon.value="🗖"
    })
})
onUnmounted(() => {
    window.ipcRenderer.removeAllListeners('maximize')
    window.ipcRenderer.removeAllListeners('unmaximize')
})
const minFunc = () => {
    window.ipcRenderer.send('minimize-window');
};
const maxFunc = () => {
    window.ipcRenderer.send('maximize-window')
}
</script>

<style lang="scss" scoped>
$btnSize: v-bind(btnSize);

%btn {
    -webkit-app-region: no-drag;
    width: $btnSize;
    height: $btnSize;
    border: none;
    transition: background-color 0.3s, color 0.3s;
    background-color: transparent;
    color: v-bind(fontColor);
}
.content {
    top: 0;
    left: 0;
    position: relative;
    .logo {
        position: fixed;
        width: 55px;
        height: 45px;
        left: -10px;
        top: 0px;
    }
    .logoText {
        position: fixed;
        left: 30px;
        font-weight: bold;
        font-size: 17px;
        top: 4px;
        color: v-bind(fontColor);
    }
    .titleBtns {
        position: fixed;
        right: 0%;
        top: 0%;
        display: flex;
        .closeBtn {
            @extend %btn;
            font-size: 20px;
            right: 0;
            top: 0;
            &:hover {
                background-color: #f00;
                color: #fff;
            }
            &:active {
                background-color: #c00;
                color: #fff;
            }
        }
        
        .minBtn{
            @extend %btn;
            top: 0;
            right: $btnSize;
            &:hover {
                background-color: v-bind(hoverColor);
            }
            &:active {
                background-color: v-bind(pressColor);
            }
        }
        .maxBtn {
            @extend %btn;
            top: 0;
            right: $btnSize;
            font-size: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            padding-bottom: 6px;
            &:hover {
                background-color: v-bind(hoverColor);
            }
            &:active {
                background-color: v-bind(pressColor);
            }
        }
    }
}
</style>