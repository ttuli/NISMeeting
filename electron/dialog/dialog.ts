import { BrowserWindow,ipcMain,session,desktopCapturer } from "electron"
import path from 'node:path'
import { VITE_DEV_SERVER_URL,RENDERER_DIST,__dirname } from "../main"


export function createDialog(routePath : string, data : any) :BrowserWindow {
  const dialog = new BrowserWindow({
    frame: false,           // 去掉系统边框，方便自定义
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs')
    },
    show:false,
  })
  dialog.webContents.openDevTools({ mode: 'detach' })
  if (VITE_DEV_SERVER_URL) {
    dialog.loadURL(VITE_DEV_SERVER_URL + '#/' + routePath)
  } else {
    // win.loadFile('dist/index.html')
    dialog.loadFile(path.join(RENDERER_DIST, 'index.html'), { 
      hash: routePath // 确保加载的是 modal 页面
    })
  }
  if (routePath === 'profileEdit') {
    dialog?.setMinimumSize(400,610);
    dialog?.setSize(400,610);
    dialog?.setMaximizable(false);
  } else if (routePath === 'imageDetali') {
    dialog?.setMinimumSize(640,480);
    dialog?.setSize(640,480);
  } else if (routePath === 'meeting') {
    dialog?.setMinimumSize(640,480);
    dialog?.setSize(640,480);
  }
  dialog.on('maximize', () => {
    dialog?.webContents.send('maximize')
  })
  dialog.on('unmaximize', () => {
    dialog?.webContents.send('unmaximize')
  })
  dialog.webContents.on("did-finish-load", () => {
    dialog.show();
    ipcMain.once('get-initData',(e) => {
      if(!dialog||dialog.isDestroyed())
        return
      dialog.webContents.send('initData',data)
    })
  });

  session.defaultSession.on('will-download', (event, item, webContents) => {
    item.once('done', (event, state) => {
      if (state === 'completed') {
        webContents.send('download-done', {
          status: 'success',
        });
      } else {
        webContents.send('download-done', {
          status: 'fail',
          reason: state,
        });
      }
    })
  })

  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
          callback({ video: sources[0], audio: 'loopback' })
      })
  })

  return dialog
}
