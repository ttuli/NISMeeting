import { BrowserWindow } from 'electron'
import { createDialog } from './dialog/dialog'
import { closeWs } from './ws/wsClient'

let windows : Map<string,BrowserWindow> = new Map()
let InfoUpdateNotifier : string[] = []

interface WindowOptions {
    route: string,
    key: string,
    data: any,
}

export function CloseAllWindow() {
    windows.forEach(win => win?.close())
    windows.clear()
    InfoUpdateNotifier = []
    closeWs()
}

export function RegisterMainWindow(win : BrowserWindow) {
    windows.set("main",win)
    win.on("closed", () => {
        windows.delete("main")
    });
}

export function Send2Window (key : string,channel : string,data : any) {
    if (windows.has(key)) {
        windows.get(key)?.webContents.send(channel,data)
    }
}

export function RegisterDialog (config : WindowOptions) {
    if (windows.has(config.key)) {
        if(windows.get(config.key)?.isMinimized()) {
            windows.get(config.key)?.restore()
        }
        windows.get(config.key)?.focus()
        return
    }
    let dia = createDialog(config.route,config.data)
    if (dia) {
        windows.set(config.key,dia)
        dia.on("closed", () => {
            windows.delete(config.key)
        });
    }
}
