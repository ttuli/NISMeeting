import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain,WebContentsView } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { CloseAllWindow,RegisterMainWindow } from './windowManager.ts'
import './ipc/ipc.ts'

const require = createRequire(import.meta.url)
export const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null = null;
let unregister : () => void | null

function createWindow() {
  win = new BrowserWindow({
    frame: false,
    width: 388,
    height: 550,
    resizable: false,
    show:false,
    maximizable: false,
    backgroundColor:"#c3cfe2",
    icon: path.join(__dirname, 'logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
    }
  });
  // 新的 API，不再是 setBrowserView
  win.contentView.addChildView(view); 
  view.setBounds({ x: 0, y: 0, width: win.getBounds().width, height: win.getBounds().height });

  view.webContents.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <html><body style="margin:0; height:100%; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);"></body></html>
  `));

  win.on('ready-to-show',() => {
    win?.contentView.removeChildView(view)
    win?.show()
  })
  win.on('close',(e) => {
    if(tray){
      e.preventDefault()
      win?.hide()
    }
  })
  RegisterMainWindow(win)
}

function createTray() {
  const iconPath = path.join(__dirname, 'logo.ico');
  tray = new Tray(nativeImage.createFromPath(iconPath));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => {
        win?.show();
        win?.focus()
      },
    },
    {
      label: "退出",
      click: appExit,
    },
  ]);

  tray.on('click',() => {
    win?.show();
    win?.focus()
  })
  tray.setToolTip("NIS");
  tray.setContextMenu(contextMenu);
}

function appExit() {
  win?.webContents.send('offline')
  setInterval(() => {
    console.log('exit')
    CloseAllWindow()
    if(unregister)
      unregister()
    if(!win?.isDestroyed()) {
      win?.destroy()
    }
      
    win=null
    app.quit()
  },20)
}

function registerIpcMain() {
  ipcMain.once('create-tray',(e) => {
    createTray()
  })
  ipcMain.on('quit',(event) => {
    appExit()
  })
  ipcMain.on('window-hide',(e) => {
    win?.hide()
  })

  return () => {
    ipcMain.removeAllListeners("window-hide");
    ipcMain.removeAllListeners("quit");
  };
}



// const gotTheLock = app.requestSingleInstanceLock()

// if (!gotTheLock) {
//   app.quit() // 如果已经有实例，直接退出
// } else {
//   app.on('second-instance', (event, commandLine, workingDirectory) => {
//     if (win) {
//       if (win.isMinimized()) {
//         win.restore()
//       }
//       win.focus()
//     }
//   })
// }

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!tray)
    app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})


app.whenReady().then(() => {
  createWindow()
  unregister=registerIpcMain()
})