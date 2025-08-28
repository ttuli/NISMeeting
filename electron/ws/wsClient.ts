import { Send2Window } from '../windowManager.ts'
import WebSocket from 'ws'

let ws : null | WebSocket = null
let wsUrl = ''
let maxReConnectTimes : number = 0;
//避免onclose onerror都重连相当于加个锁
let lockReconnect = false;
let heartCheckTimerId : null | NodeJS.Timeout = null;
let sendHeartCheckTimerId : null | NodeJS.Timeout = null;
let lockResetCheckTime = false;
let maxCheckTime = 3500;

let needReconnect = true;

export function initWs (config : any) {
    maxReConnectTimes = 5
    wsUrl = import.meta.env.VITE_WS_URL + '?token=' + config.token
    createWs()
}

export function closeWs () {
    needReconnect = false;
    ws?.close()
}

function createWs() {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
        heartCheck()
    }

    ws.onmessage = async (event) => {
        resetCheckTime()
        console.dir(event)
    }

    ws.onclose = (event : WebSocket.CloseEvent) => {
        console.log('ws close',event)
        reconnect()
    }
    ws.onerror = (err : WebSocket.ErrorEvent) => {
        console.log('ws close',err)
        reconnect()
    }

} 

function resetCheckTime() {
    if (lockResetCheckTime) return
    lockResetCheckTime = true
    if (heartCheckTimerId !== null) {
        if (sendHeartCheckTimerId !== null)
            clearTimeout(sendHeartCheckTimerId)
        if (heartCheckTimerId !== null)
            clearTimeout(heartCheckTimerId)
        sendHeartCheckTimerId = setTimeout(heartCheck,maxCheckTime)
    }
    lockResetCheckTime = false
}

function heartCheck() {
    if (ws?.readyState !== WebSocket.OPEN)
        return
    ws?.send('ping')
    heartCheckTimerId = setTimeout(() => {
        reconnect()
    },maxCheckTime)
}

function reconnect() {
    if (!needReconnect) {
        return;
    }
    if (lockReconnect) return
    lockReconnect = true
    setTimeout(() => {
        if(!maxReConnectTimes) {
            console.log("达到重连次数上限")
            lockReconnect = false
            return
        }
        createWs()
        maxReConnectTimes--;
        lockReconnect = false
    },2000)
}