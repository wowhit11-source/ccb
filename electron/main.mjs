import { app, BrowserWindow } from "electron";
import { startServer } from "../server.mjs";

let mainWindow;
let appServer;

async function createWindow() {
  const { server, url } = await startServer({ host: "127.0.0.1", port: 0 });
  appServer = server;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: "Agent Desk Skeleton",
    backgroundColor: "#1e1e2e",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await mainWindow.loadURL(url);
}

app.whenReady().then(() => {
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  appServer?.close();
});
