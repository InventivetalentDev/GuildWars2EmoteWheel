"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var robot = require("robotjs");
var OPEN_ACCELERATOR = "Alt+C";
var COMMAND_KEY = "-";
var SEND_KEY = "enter";
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
var tray;
function createWindow() {
    tray = new electron_1.Tray(path.join(__dirname, "../res/logo/favicon.ico"));
    tray.setToolTip("Emote Wheel for Guild Wars 2");
    var contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: "Exit", click: function () {
                electron_1.app.quit();
            }
        }
    ]);
    tray.setContextMenu(contextMenu);
    tray.on("click", function () {
    });
    tray.displayBalloon({
        icon: path.join(__dirname, "../res/logo/GW2_Logo_emote_1024.png"),
        title: "GW2 Emote Wheel",
        content: "Press Alt+C to open!"
    });
    // Create the browser window.
    mainWindow = new electron_1.BrowserWindow({ width: 480, height: 480, frame: false, transparent: true, alwaysOnTop: true, show: false });
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../index.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Open the DevTools.
    // mainWindow.webContents.openDevTools({mode: "detach"})
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
    // Create shortcuts
    global.globalObj = {
        windowOpen: false,
        runEmote: null
    };
    global.globalObj.windowOpen = false;
    electron_1.globalShortcut.register(OPEN_ACCELERATOR, function () {
        console.log('OPEN_KEYCODE is pressed');
        if (!global.globalObj.windowOpen) {
            showWindow();
        }
        else {
            hideWindow();
        }
        global.globalObj.windowOpen = !global.globalObj.windowOpen;
    });
    global.globalObj.runEmote = function (emote, target, sync) {
        robot.mouseClick("left");
        console.log("click");
        setTimeout(function () {
            robot.keyTap(COMMAND_KEY); // For WHATEVER reason we need to use the GW command keybind ("-" by default),
            // since using the default key to open the chat doesn't seem to want to send the command...
            console.log(COMMAND_KEY + " (command key)");
            setTimeout(function () {
                var str = emote.cmd.substr(1);
                if (target) {
                    str += " @";
                }
                else if (sync) {
                    str += " *";
                }
                robot.typeString(str);
                console.log(emote.cmd);
                setTimeout(function () {
                    robot.keyTap(SEND_KEY);
                    console.log(SEND_KEY + " (send key)");
                }, 20);
            }, 50);
        }, 50);
    };
    console.log("Running!!");
}
function showWindow() {
    var mouse = robot.getMousePos();
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
electron_1.app.on('ready', createWindow);
electron_1.app.on('will-quit', function () {
    electron_1.globalShortcut.unregister(OPEN_ACCELERATOR);
});
// Quit when all windows are closed.
electron_1.app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
//# sourceMappingURL=main.js.map