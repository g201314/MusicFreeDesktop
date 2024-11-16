// 同步某些状态到其他
import {
  BrowserWindow,
  MessageChannelMain,
  MessagePortMain,
  ipcMain,
} from "electron";
import {IWindowManager} from "@/types/main/window-manager";

const extensionIds = new Set<number>();

let mainWindow: BrowserWindow;

export function registerMainWindow(bWindow: BrowserWindow) {
  mainWindow = bWindow;
}

// 创建用来通信的端口
export function registerExtensionWindow(bWindow: BrowserWindow) {
  const { port1, port2 } = new MessageChannelMain();
  const extWindowId = bWindow.id;

  extensionIds.add(extWindowId);

  // 通知主窗口有更新
  mainWindow.webContents.postMessage(
    "port",
    {
      id: extWindowId,
      type: "mount",
    },
    [port1]
  );
  bWindow.webContents.postMessage("port", null, [port2]);

  // 卸载
  bWindow.on("close", () => {
    mainWindow.webContents.postMessage("port", {
      id: extWindowId,
      type: "unmount",
    });
    extensionIds.delete(extWindowId);
  });
}

export function broadcast(
  data: any,
  options?: {
    includeMainProcess?: boolean;
  }
) {
  mainWindow.webContents.postMessage("port", {
    type: "broadcast",
    data,
  });
}

export function sendToMainWindow(data: any) {
  mainWindow.webContents.postMessage("port", {
    type: "data",
    data,
  });
}

const callbacks: Set<(data: any) => void> = new Set();

ipcMain.on("@shared/message-hub/message", (_, data) => {
  callbacks.forEach((cb) => {
    cb?.(data);
  });
});

/** 监听通过messagehub发送的信息 */
export function onMessage(cb: (data: any) => void) {
  callbacks.add(cb);
}

export function offMessage(cb: (data: any) => void) {
  callbacks.delete(cb);
}


//
// class MessageHub {
//   private extensionIds = new Set<number>();
//   private windowManager: IWindowManager;
//
//   setup(windowManager: IWindowManager) {
//     this.windowManager = windowManager;
//     this.windowManager.on("WindowCreated", ({windowName, browserWindow}) => {
//       if (windowName === "main") {
//         return;
//       }
//
//       const {port1, port2} = new MessageChannelMain();
//       const extWindowId = browserWindow.id;
//       this.extensionIds.add(extWindowId);
//
//       // 通知主窗口更新
//       this.windowManager.mainWindow.webContents.postMessage("port", {
//         id: extWindowId,
//         type: "mount",
//       }, [port1]);
//
//       browserWindow.webContents.postMessage("port", null, [port2]);
//       browserWindow.on("close", () => {
//         this.windowManager.mainWindow.webContents.postMessage("port", {
//           id: extWindowId,
//           type: "unmount",
//         });
//         this.extensionIds.delete(extWindowId);
//       })
//
//     })
//   }
//
// }
//
