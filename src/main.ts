import {app, BrowserWindow, Menu, Tray, MenuItem, globalShortcut} from "electron";
import * as path from "path";
import * as url from "url";
import * as robot from "robotjs";
import {Global} from "./types/CustomGlobal";
import {Emote} from "./emote";

const openurl = require("openurl");

declare const global: Global;

const OPEN_ACCELERATOR = "Alt+C";
const COMMAND_KEY = "-";
const SEND_KEY = "enter";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow;
let tray: Electron.Tray;

function init() {
    global.globalObj = {
        windowOpen: false,
        runEmote: null
    };

    createTray();
    createWindow();
    createShortcuts();

    global.globalObj.runEmote = function (emote: Emote, target: boolean, sync: boolean) {
        robot.mouseClick("left");
        console.log("click")

        setTimeout(function () {
            robot.keyTap(COMMAND_KEY);// For WHATEVER reason we need to use the GW command keybind ("-" by default),
            // since using the default key to open the chat doesn't seem to want to send the command...
            console.log(COMMAND_KEY + " (command key)")

            setTimeout(function () {
                let str = emote.cmd.substr(1);
                if (target) {
                    str += " @";
                } else if (sync) {
                    str += " *";
                }
                robot.typeString(str);
                console.log(emote.cmd);

                setTimeout(function () {
                    robot.keyTap(SEND_KEY);
                    console.log(SEND_KEY + " (send key)");
                }, 20)
            }, 50)
        }, 50)
    };

    console.log("Running!!")
}

function createTray() {
    tray = new Tray(path.join(__dirname, "../res/logo/favicon.ico"));
    tray.setToolTip("Emote Wheel for Guild Wars 2");
    let contextMenu = Menu.buildFromTemplate([
        {
            label: "About", click() {
                openurl.open("https://github.com/InventivetalentDev/GuildWars2EmoteWheel/blob/master/README.md")
            }
        },
        {label: "", type: "separator"},
        {
            label: "Exit", click() {
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
    });

    tray.displayBalloon({
        icon: path.join(__dirname, "../res/logo/GW2_Logo_emote_1024.png"),
        title: "GW2 Emote Wheel",
        content: "Press Alt+C to open!"
    });
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 480, height: 480, frame: false, transparent: true, alwaysOnTop: true, show: false});


    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    // mainWindow.webContents.openDevTools({mode: "detach"})

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });
}

function createShortcuts() {
    global.globalObj.windowOpen = false;
    globalShortcut.register(OPEN_ACCELERATOR, () => {
        console.log('OPEN_KEYCODE is pressed')
        if (!global.globalObj.windowOpen) {
            showWindow()
        } else {
            hideWindow();
        }
        global.globalObj.windowOpen = !global.globalObj.windowOpen;
    });
}

function showWindow() {

    let mouse = robot.getMousePos();
    mainWindow.setPosition(mouse.x - 240, mouse.y - 240);
    // mainWindow.setIgnoreMouseEvents(true, {forward: true});
    if (!mainWindow.isVisible())
        mainWindow.show();
}

function hideWindow() {
    mainWindow.hide();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.on('will-quit', () => {
    globalShortcut.unregister(OPEN_ACCELERATOR)
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})


app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.