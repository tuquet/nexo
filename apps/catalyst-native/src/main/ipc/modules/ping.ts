import { IpcMain } from 'electron';

export function ping(ipc: IpcMain): void {
  ipc.on('ping', (event) => {
    // Trả lời lại cho tiến trình renderer đã gửi 'ping'
    event.sender.send('pong', 'pong');
  });
}
