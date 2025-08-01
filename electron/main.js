const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow camera access
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      webviewTag: true, // Enable webview
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    title: 'Mirage Game Client',
    icon: path.join(__dirname, '../public/icon.png'), // Add an icon if you want
    show: false // Don't show until ready
  })

  // Load the app
  const startURL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../dist/index.html')}`
  
  mainWindow.loadURL(startURL)
  
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
  
  // Debug loading
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('Failed to load:', errorCode, errorDescription, validatedURL)
  })

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Focus the window
    if (isDev) {
      mainWindow.focus()
    }
    
    // Disable background throttling and set permissions AFTER window is ready
    mainWindow.webContents.setBackgroundThrottling(false)
  })

  // Grant camera permissions automatically - set this BEFORE loading content
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('Permission requested:', permission)
    if (permission === 'camera' || permission === 'microphone' || permission === 'media') {
      console.log('Granting permission for:', permission)
      callback(true) // Grant permission
    } else {
      console.log('Denying permission for:', permission)
      callback(false)
    }
  })

  // Set permissions check handler
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    console.log('Permission check:', permission, requestingOrigin)
    if (permission === 'camera' || permission === 'microphone' || permission === 'media') {
      return true
    }
    return false
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Prevent window from being backgrounded (keep camera active)
  mainWindow.on('blur', () => {
    // Keep window processes active even when not focused
    mainWindow.webContents.setBackgroundThrottling(false)
  })

  // Always stay on top option (uncomment if needed)
  // mainWindow.setAlwaysOnTop(true, 'screen-saver')
}

// App event handlers
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for any future communication needs
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})