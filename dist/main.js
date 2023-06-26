"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var robot = require("robotjs");
var emote_1 = require("./emote");
var childProcess = require("child_process");
var events_1 = require("events");
var openurl = require("openurl");
var ElectronPreferences = require("electron-preferences");
var ALL_EMOTES = [
    new emote_1.Emote("/beckon", "beckon", true),
    new emote_1.Emote("/bow", "bow", true),
    new emote_1.Emote("/cheer", "cheer", true),
    new emote_1.Emote("/cower", "cower"),
    new emote_1.Emote("/crossarms", "crossarms"),
    new emote_1.Emote("/cry", "cry"),
    new emote_1.Emote("/dance", "dance"),
    new emote_1.Emote("/upset", "upset"),
    new emote_1.Emote("/kneel", "kneel"),
    new emote_1.Emote("/laugh", "laugh", true),
    new emote_1.Emote("/no", "no", true),
    new emote_1.Emote("/yes", "yes", true),
    new emote_1.Emote("/point", "point", true),
    new emote_1.Emote("/ponder", "think"),
    new emote_1.Emote("/sad", "sad"),
    new emote_1.Emote("/salute", "salute", true),
    new emote_1.Emote("/shrug", "shrug", true),
    new emote_1.Emote("/sit", "sit"),
    new emote_1.Emote("/sleep", "sleep"),
    new emote_1.Emote("/surprised", "surprise", true),
    new emote_1.Emote("/talk", "talk", true),
    new emote_1.Emote("/thx", "like", true),
    new emote_1.Emote("/threaten", "threaten", true),
    new emote_1.Emote("/wave", "wave", true)
];
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
var tray;
var preferences;
var guildWarsRunning = false;
function init() {
    global.globalObj = {
        windowOpen: false,
        runEmote: null,
        emotes: ALL_EMOTES
    };
    createPreferences();
    createTray();
    createWindow();
    createShortcuts();
    startProcessCheck()
        .on("gw-started", function () {
        console.log("Guild Wars started!");
        setTimeout(function () {
            tray.displayBalloon({
                icon: path.join(__dirname, "../res/logo/GW2_Logo_emote_1024.png"),
                title: "GW2 Emote Wheel",
                content: "Press " + (preferences.value("keybinds.shortcut_open") || "Alt+C") + " to open!"
            });
        }, 10000);
    })
        .on("gw-closed", function () {
        console.log("Guild Wars closed!");
    });
    console.log("Running!!");
}
var runEmote = function (emote, target, sync) {
    if (!guildWarsRunning) {
        console.warn("Tried to rum emote (" + emote.cmd + "), but GuildWars is not running");
        return;
    }
    robot.mouseClick("right");
    console.log("click");
    setTimeout(function () {
        var cmdKey = preferences.value("keybinds.key_command") || "-";
        robot.keyTap(cmdKey.toLowerCase()); // For WHATEVER reason we need to use the GW command keybind ("-" by default),
        // since using the default key to open the chat doesn't seem to want to send the command...
        console.log(cmdKey + " (command key)");
        setTimeout(function () {
            var str = emote.cmd.substring(1);
            if (target) {
                str += " @";
            }
            else if (sync) {
                str += " *";
            }
            robot.typeString(str);
            console.log(emote.cmd);
            setTimeout(function () {
                var sendKey = preferences.value("keybinds.key_send") || "enter";
                robot.keyTap(sendKey.toLowerCase());
                console.log(sendKey + " (send key)");
            }, 20);
        }, 50);
    }, 50);
};
function createTray() {
    tray = new electron_1.Tray(path.join(__dirname, "../res/logo/favicon.ico"));
    tray.setToolTip("Emote Wheel for Guild Wars 2");
    var contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: "About",
            click: function () {
                openurl.open("https://github.com/InventivetalentDev/GuildWars2EmoteWheel/blob/master/README.md");
            }
        },
        {
            label: "Settings",
            click: function () {
                preferences.show();
            }
        },
        { label: "", type: "separator" },
        {
            label: "Exit",
            click: function () {
                electron_1.app.quit();
            }
        }
    ]);
    tray.setContextMenu(contextMenu);
}
function createWindow() {
    // Create the browser window.
    mainWindow = new electron_1.BrowserWindow({
        width: 480, height: 480,
        frame: false, transparent: false,
        alwaysOnTop: true, show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../index.html'),
        protocol: 'file:',
        slashes: true
    }))
        .then(function () {
        mainWindow.webContents.send("setGlobal", global.globalObj);
    });
    electron_1.ipcMain.on("runEmote", function (event, emote, target, sync) {
        console.log("got emote", emote, target, sync);
        runEmote(emote, target, sync);
    });
    electron_1.ipcMain.on("hideWindow", function () {
        hideWindow();
    });
    // Open the DevTools.
    if ((preferences.value("advanced.debug") || []).indexOf("devtools") >= 0)
        mainWindow.webContents.openDevTools({ mode: "detach" });
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}
function createShortcuts() {
    electron_1.globalShortcut.register(preferences.value("keybinds.shortcut_open") || "Alt+C", function () {
        console.log('OPEN_KEYCODE is pressed');
        if (!global.globalObj.windowOpen) {
            showWindow();
        }
        else {
            hideWindow();
        }
    });
}
function createPreferences() {
    preferences = new ElectronPreferences({
        dataStore: path.resolve(electron_1.app.getPath("userData"), "preferences.json"),
        defaults: {
            keybinds: {
                shortcut_open: "Alt+C",
                key_command: "-",
                key_send: "Enter"
            },
            emotes: {
                enabled: (function () {
                    var arr = [];
                    ALL_EMOTES.forEach(function (e) {
                        arr.push(e.cmd.substr(1));
                    });
                    return arr;
                })()
            },
            general: {
                close_delay: 2,
                color_bg_odd: {
                    a: 0.5,
                    r: 87,
                    g: 87,
                    b: 87
                },
                color_bg_even: {
                    a: 0.5,
                    r: 57,
                    g: 57,
                    b: 57
                },
                color_hover: {
                    a: 0.5,
                    r: 82,
                    g: 134,
                    b: 255
                }
            },
            advanced: {
                debug: [],
                show: "running"
            }
        },
        'onLoad': function (preferences) {
            console.log("onLoad");
            console.log(preferences);
            return preferences;
        },
        sections: [
            {
                id: "keybinds",
                label: "Keybinds",
                icon: "bookmark-2",
                form: {
                    groups: [
                        {
                            label: "Shortcuts",
                            fields: [
                                {
                                    label: "Open Shortcut",
                                    key: "shortcut_open",
                                    type: "accelerator",
                                    help: "The key combination used to open the Emote Wheel"
                                }
                            ]
                        },
                        {
                            label: "Game Keys",
                            fields: [
                                {
                                    label: "Command Key",
                                    key: "key_command",
                                    type: "accelerator",
                                    help: "The key used to open the command window in GW2"
                                },
                                {
                                    label: "Send Key",
                                    key: "key_send",
                                    type: "accelerator",
                                    help: "The key used to send chat messages in GW2"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                id: "emotes",
                label: "Emotes",
                icon: "chat-46",
                form: {
                    groups: [
                        {
                            fields: [
                                {
                                    label: "Enabled Emotes",
                                    key: "enabled",
                                    type: "checkbox",
                                    options: (function () {
                                        var arr = [];
                                        ALL_EMOTES.forEach(function (e) {
                                            arr.push({
                                                label: e.cmd,
                                                value: e.id
                                            });
                                        });
                                        return arr;
                                    })()
                                },
                                {
                                    heading: "Note",
                                    content: "<p>You should keep at least <strong>4</strong> emotes enabled - it gets weird with less.</p>",
                                    type: "message"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                id: "general",
                label: "General",
                icon: "settings-gear-63",
                form: {
                    groups: [
                        {
                            fields: [
                                {
                                    label: "Close Delay",
                                    key: "close_delay",
                                    type: "text",
                                    help: "The delay (in seconds) until the emote wheel closes automatically. Use -1 to disable."
                                }
                            ]
                        },
                        {
                            label: "Colors",
                            fields: [
                                {
                                    label: "Background Color (odd)",
                                    key: "color_bg_odd",
                                    type: "color",
                                    format: "rgb"
                                },
                                {
                                    label: "Background Color (even)",
                                    key: "color_bg_even",
                                    type: "color",
                                    format: "rgb"
                                },
                                {
                                    label: "Hover Color",
                                    key: "color_hover",
                                    type: "color",
                                    format: "rgb"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                id: "advanced",
                label: "Advanced",
                icon: "preferences",
                form: {
                    groups: [
                        {
                            label: "Debug",
                            fields: [
                                {
                                    label: "Debug",
                                    key: "debug",
                                    type: "checkbox",
                                    options: [
                                        {
                                            label: "Developer Tools",
                                            value: "devtools"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            fields: [
                                {
                                    label: "When to show",
                                    key: "show",
                                    type: "radio",
                                    options: [
                                        { label: "Only when Guild Wars 2 is running", value: "running" },
                                        { label: "Always (when shortcut is pressed)", value: "always" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        ],
        webPreferences: {
            devTools: true
        }
    });
}
//TODO: remove promises
function getRunningProcesses(callback) {
    childProcess.exec('tasklist', function (err, stdout, stderr) {
        if (err) {
            return callback(err, null);
        }
        callback(null, stdout);
    });
}
function isGuildWarsRunning(callback) {
    getRunningProcesses(function (err, value) {
        if (err)
            return callback(err, null);
        if (value.indexOf("Gw2-64.exe") !== -1) {
            return callback(null, true);
        }
        return callback(null, false);
    });
}
function startProcessCheck() {
    var emitter = new events_1.EventEmitter();
    setInterval(function () {
        isGuildWarsRunning(function (err, running) {
            if (err) {
                if (guildWarsRunning) {
                    emitter.emit("gw-closed");
                }
                guildWarsRunning = false;
            }
            else {
                if (guildWarsRunning != running) {
                    emitter.emit(running ? "gw-started" : "gw-closed");
                }
                guildWarsRunning = running;
            }
        });
    }, 5000);
    return emitter;
}
function showWindow() {
    if (!guildWarsRunning && preferences.value("advanced.show") === "running") {
        console.log("Tried to show window, but GuildWars is not running");
        return;
    }
    var mouse = robot.getMousePos();
    console.log("mouse pos", mouse);
    mainWindow.setPosition(mouse.x - 240, mouse.y - 240);
    // mainWindow.setIgnoreMouseEvents(true, {forward: true});
    if (!mainWindow.isVisible()) {
        mainWindow.show();
        global.globalObj.windowOpen = true;
    }
}
function hideWindow() {
    mainWindow.hide();
    global.globalObj.windowOpen = false;
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', init);
electron_1.app.on('will-quit', function () {
    electron_1.globalShortcut.unregister(preferences.value("keybinds.shortcut_open"));
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