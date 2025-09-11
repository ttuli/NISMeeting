import { ipcMain, BrowserWindow } from 'electron'
import { createModal } from '../modal/modal'
import { initWs,sendMessage } from '../ws/wsClient.ts'
import { RegisterDialog,Send2Window,CheckWindow } from '../windowManager.ts'

ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
        win.minimize()
    }
})

ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
        if(win.isMaximized()) {
            win.unmaximize()
        } else {
            win.maximize()
        }
    }
})

ipcMain.on('router-changed',(event, path) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && !win.isVisible()) {
        win.resizable = true
        win.setSize(740, 480)
        win.setMinimumSize(740, 480)
        setTimeout(() => {
            if (win.isDestroyed())
                return
            win?.show()
            win?.center()
        },1000)
    }
})

ipcMain.on('login-success', (event,token) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
        // initWs({token:token})
        win.setResizable(true)
        win.hide()
    }
})

ipcMain.on('handle-meeting', (event, data : any) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    createModal(win,"meetingModal",data)
})

ipcMain.on('edit-profile', (event,data) => {
    RegisterDialog({
        route: "profileEdit",
        key: "profileEdit",
        data: data
    })
})

ipcMain.on('update-userinfo',(event,data) => {
    Send2Window('main','update-info',data)
})

ipcMain.on('image-detali',(event,src) => {
    RegisterDialog({
        route: "imageDetali",
        key: src,
        data: src
    })
})

ipcMain.on('meeting',(event,data) => {
    RegisterDialog({
        route: "meeting",
        key: "meeting:" + data.info.meetingId,
        data: data
    })
})

ipcMain.handle('meeting-check',(event,data) => {
    return CheckWindow("meeting:"+data)
})

ipcMain.on('ws-send',(event,data) => {
    sendMessage(JSON.stringify(data))
})
