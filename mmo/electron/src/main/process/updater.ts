import { BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'
import pkg from 'electron-updater'

import icon from '../../../resources/icon.png?asset'
import { getLatestRelease } from './api'
import { getMainWindow } from './window'
const { autoUpdater } = pkg

class AppUpdater {
  private updateDialog: Electron.BrowserWindow | null = null

  constructor() {
    this.init()
  }

  checkForUpdates(): void {
    void autoUpdater.checkForUpdates()
  }

  init(): void {
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info)
      void this.showUpdateDialog()
    })

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater.', err)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      const percentRounded = Math.round(progressObj.percent)

      // Gửi tiến trình đến cửa sổ dialog
      if (this.updateDialog) {
        this.updateDialog.webContents.send('download-progress', percentRounded)
      }

      // Gửi tiến trình đến cửa sổ chính
      const mainWindow = getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.send('update-download-progress', percentRounded)
      }
    })

    autoUpdater.on('update-downloaded', () => {
      log.info('Update downloaded')
      this.notifyUpdateDownloaded()
    })

    ipcMain.on('start-download', () => {
      log.info('Starting download')
      void autoUpdater.downloadUpdate()
    })

    ipcMain.on('cancel-update', () => {
      if (this.updateDialog) {
        this.updateDialog.close()
        this.updateDialog = null
      }
    })

    ipcMain.on('restart-and-install', () => {
      log.info('Restarting and installing update')
      autoUpdater.quitAndInstall()
    })
  }

  notifyUpdateDownloaded(): void {
    if (this.updateDialog) {
      this.updateDialog.webContents.send('update-downloaded')
    }
  }

  async showUpdateDialog(): Promise<void> {
    const { version, releaseNotes } = await getLatestRelease()

    this.updateDialog = new BrowserWindow({
      width: 600,
      height: 400,
      icon,
      title: 'Application Update',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    this.updateDialog.setMenuBarVisibility(false)

    void this.updateDialog.loadURL(`data:text/html;charset=utf-8,
      <html>
      <body style="font-family: Arial, sans-serif;">
        <div id="content" style="margin: 20px;">
          <h3>Cập nhật phiên bản ${version}</h3>
          <div id="release-notes" style="margin-bottom: 20px; white-space: pre-wrap;">${releaseNotes}</div>
          <div id="actions">
            <button id="update-btn" style="padding: 10px 20px; margin-right: 10px;">Cập nhật</button>
            <button id="later-btn" style="padding: 10px 20px;">Lúc khác</button>
          </div>
          <div id="progress-container" style="display: none; margin-top: 20px;">
            <div>Tải xuống: <span id="progress">0%</span></div>
          </div>
        </div>
        <script>
          const { ipcRenderer } = require('electron');

          document.getElementById('update-btn').addEventListener('click', () => {
            ipcRenderer.send('start-download');
            document.getElementById('actions').style.display = 'none';
            document.getElementById('progress-container').style.display = 'block';
          });

          document.getElementById('later-btn').addEventListener('click', () => {
            ipcRenderer.send('cancel-update');
          });

          ipcRenderer.on('download-progress', (event, percent) => {
            document.getElementById('progress').innerText = percent + '%';
          });

          ipcRenderer.on('update-downloaded', () => {
            document.getElementById('content').innerHTML = '<h3>Update Ready</h3><p>Bản cập nhật đã được tải xuống.Khởi động lại ứng dụng để áp dụng các bản cập nhật.</p><button id="restart-btn" style="padding: 10px 20px;">Restart</button>';
            document.getElementById('restart-btn').addEventListener('click', () => {
              ipcRenderer.send('restart-and-install');
            });
          });
        </script>
      </body>
      </html>
    `)
  }
}

export default AppUpdater
