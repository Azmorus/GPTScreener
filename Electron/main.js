const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const isDev = require("electron-is-dev");

let mainWindow;
let backendProcess;

function startBackend() {
    const backendPath = isDev
        ? "uvicorn GPTScreen:app --reload"
        : path.join(__dirname, "../PyBackend/GPTScreen.exe"); // For EXE build

    backendProcess = exec(backendPath, { cwd: path.join(__dirname, "../PyBackend") });

    backendProcess.stdout.on("data", (data) => console.log(`Backend: ${data}`));
    backendProcess.stderr.on("data", (data) => console.error(`Backend Error: ${data}`));

    backendProcess.on("exit", (code) => console.log(`Backend exited with code ${code}`));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    const startURL = isDev
        ? "http://localhost:3000"
        : `file://${path.join(__dirname, "../ReactFrontend/build/index.html")}`;

    mainWindow.loadURL(startURL);

    mainWindow.on("closed", () => {
        mainWindow = null;
        if (backendProcess) backendProcess.kill();
    });
}

app.on("ready", () => {
    startBackend();  // **Auto-start FastAPI**
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (mainWindow === null) createWindow();
});
