import {app, BrowserWindow, Menu, MenuItem, globalShortcut} from "electron";
import * as path from "path";
import * as url from "url";
import * as robot from "robotjs";
import {Global} from "./types/CustomGlobal";
import {Emote} from "./emote";

declare const global: Global;

const OPEN_ACCELERATOR = "Alt+C";
const COMMAND_KEY = "-";
const SEND_KEY = "enter";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow;

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
    mainWindow.webContents.openDevTools({mode: "detach"})

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });

    // Create shortcuts
    global.globalObj = {
        windowOpen: false,
        runEmote: null
    };
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

    global.globalObj.runEmote = function (emote: Emote) {
        robot.mouseClick("left");
        console.log("click")

        robot.keyTap(COMMAND_KEY);// For WHATEVER reason we need to use the GW command keybind ("-" by default),
        // since using the default key to open the chat doesn't seem to want to send the command...
        console.log(COMMAND_KEY + " (command key)")

        robot.typeString(emote.cmd.substr(1))
        console.log(emote.cmd);

        robot.keyTap(SEND_KEY);
        console.log(SEND_KEY + " (send key)");
    };
    // ioHook.on("keydown",event=>{
    //     console.log(event);
    // })
    // ioHook.on("keyup",event=>{
    //     console.log(event);
    // });
    // ioHook.registerShortcut([67], (keys:any) => {
    //     console.log('Shortcut called with keys:', keys)
    // });
    // ioHook.start(true);

    console.log("Running!!")


    /*Watch the active window
      @callback
      @number of requests; infinity = -1
      @interval between requests
    */
//monitor.getActiveWindow(callback,-1,1);


}

function showWindow() {

    let mouse = robot.getMousePos();
    mainWindow.setPosition(mouse.x - 240, mouse.y - 240);
    // mainWindow.setIgnoreMouseEvents(true, {forward: true});
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