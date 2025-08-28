import { BrowserWindow } from "electron"
import path from 'node:path'
import { VITE_DEV_SERVER_URL,RENDERER_DIST,__dirname } from "../main"

export function createModal(parentWindow : BrowserWindow , routePath : string , data : any) {
  const modal = new BrowserWindow({
    parent: parentWindow,   // 指定父窗口
    modal: true,            // 设置为模态
    show: false,
    frame: false,           // 去掉系统边框，方便自定义
    resizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs')
    }
  })

  if (VITE_DEV_SERVER_URL) {
    modal.loadURL(VITE_DEV_SERVER_URL + '#/' + routePath)
  } else {
    // win.loadFile('dist/index.html')
    modal.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      hash: 'modal' // 确保加载的是 modal 页面
    })
  }
  if (data.type === 'join') {
    modal.setSize(400, 550)
  } else {
    modal.setSize(400, 630)
  }
  modal.webContents.once('did-finish-load', () => {

    modal.show()
    modal.center()
    setTimeout(() => {
      modal.webContents.send('modal-data', data)
    }, 50)
  })
}
