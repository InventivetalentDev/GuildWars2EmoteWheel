import {app, BrowserWindow, Menu, Tray, MenuItem, globalShortcut, ipcMain, screen} from "electron";
import * as path from "path";
import * as url from "url";
import * as robot from "robotjs";
import {Emote} from "./emote";
import * as childProcess from "child_process";
import {EventEmitter} from "events";

const openurl = require("openurl");
const ElectronPreferences = require("electron-preferences");

declare const global: NodeJS.Global;

const ALL_EMOTES: Emote[] = [
    new Emote("/beckon", "beckon", true),
    new Emote("/bow", "bow", true),
    new Emote("/cheer", "cheer", true),
    new Emote("/cower", "cower"),
    new Emote("/crossarms", "crossarms"),
    new Emote("/cry", "cry"),
    new Emote("/dance", "dance"),
    new Emote("/upset", "upset"),
    new Emote("/kneel", "kneel"),
    new Emote("/laugh", "laugh", true),
    new Emote("/no", "no", true),
    new Emote("/yes", "yes", true),
    new Emote("/point", "point", true),
    new Emote("/ponder", "think"),
    new Emote("/sad", "sad"),
    new Emote("/salute", "salute", true),
    new Emote("/shrug", "shrug", true),
    new Emote("/sit", "sit"),
    new Emote("/sleep", "sleep"),
    new Emote("/surprised", "surprise", true),
    new Emote("/talk", "talk", true),
    new Emote("/thx", "like", true),
    new Emote("/threaten", "threaten", true),
    new Emote("/wave", "wave", true)
];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow;
let tray: Electron.Tray;
let preferences: any;
let guildWarsRunning: boolean = false;

function init() {
    global.globalObj = {
        windowOpen: false,
        runEmote: null,
        emotes: ALL_EMOTES
    };

    app.commandLine.appendSwitch('high-dpi-support', 'true');
    app.commandLine.appendSwitch('force-device-scale-factor', '1');

    createPreferences();
    createTray();
    createWindow();
    createShortcuts();
    startProcessCheck()
        .on("gw-started", () => {
            console.log("Guild Wars started!");

            setTimeout(function () {
                tray.displayBalloon({
                    icon: path.join(__dirname, "../res/logo/GW2_Logo_emote_1024.png"),
                    title: "GW2 Emote Wheel",
                    content: "Press " + (preferences.value("keybinds.shortcut_open") || "Alt+C") + " to open!"
                });
            }, 10000);
        })
        .on("gw-closed", () => {
            console.log("Guild Wars closed!")

        });


    console.log("Running!!")
}

const runEmote = function (emote: Emote, target: boolean, sync: boolean) {
    if (!guildWarsRunning) {
        console.warn("Tried to rum emote (" + emote.cmd + "), but GuildWars is not running");
        return;
    }

    robot.mouseClick("right");
    console.log("click")

    setTimeout(function () {
        let cmdKey = preferences.value("keybinds.key_command") || "-";
        robot.keyTap(cmdKey.toLowerCase());// For WHATEVER reason we need to use the GW command keybind ("-" by default),
        // since using the default key to open the chat doesn't seem to want to send the command...
        console.log(cmdKey + " (command key)")

        setTimeout(function () {
            let str = emote.cmd.substring(1);
            if (target) {
                str += " @";
            } else if (sync) {
                str += " *";
            }
            robot.typeString(str);
            console.log(emote.cmd);

            setTimeout(function () {
                let sendKey = preferences.value("keybinds.key_send") || "enter";
                robot.keyTap(sendKey.toLowerCase());
                console.log(sendKey + " (send key)");
            }, 20)
        }, 50)
    }, 50)
};

function createTray() {
    tray = new Tray(path.join(__dirname, "../res/logo/favicon.ico"));
    tray.setToolTip("Emote Wheel for Guild Wars 2");
    let contextMenu = Menu.buildFromTemplate([
        {
            label: "About", click() {
                openurl.open("https://github.com/InventivetalentDev/GuildWars2EmoteWheel/blob/master/README.md")
            }
        },
        {
            label: "Settings", click() {
                preferences.show();
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
}

function createWindow() {
    const scale = screen.getPrimaryDisplay().scaleFactor;
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 480, height: 480,
        frame: false, transparent: true,
        alwaysOnTop: true, show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });


    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../index.html'),
        protocol: 'file:',
        slashes: true
    }))
        .then(() => {
            mainWindow.webContents.send("setGlobal", global.globalObj);

            mainWindow.webContents.setZoomFactor(1);
        })

    ipcMain.on("runEmote", (event, emote: Emote, target: boolean, sync: boolean) => {
        console.log("got emote", emote, target, sync)
        runEmote(emote, target, sync);
    });

    ipcMain.on("hideWindow", () => {
        hideWindow()
    })


    // Open the DevTools.
    if ((preferences.value("advanced.debug") || []).indexOf("devtools") >= 0)
        mainWindow.webContents.openDevTools({mode: "detach"})

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });
}

function createShortcuts() {
    globalShortcut.register(preferences.value("keybinds.shortcut_open") || "Alt+C", () => {
        console.log('OPEN_KEYCODE is pressed')
        if (!global.globalObj.windowOpen) {
            showWindow()
        } else {
            hideWindow();
        }
    });
}

function createPreferences() {
    preferences = new ElectronPreferences({
        dataStore: path.resolve(app.getPath("userData"), "preferences.json"),
        defaults: {
            keybinds: {
                shortcut_open: "Alt+C",
                key_command: "-",
                key_send: "Enter"
            },
            emotes: {
                enabled: (function () {
                    let arr: string[] = [];
                    ALL_EMOTES.forEach((e: Emote) => {
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
        'onLoad': (preferences: any) => {
            console.log("onLoad")
            console.log(preferences)
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
                                        let arr: any[] = [];
                                        ALL_EMOTES.forEach((e) => {
                                            arr.push({
                                                label: e.cmd,
                                                value: e.id
                                            })
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
                                        {label: "Only when Guild Wars 2 is running", value: "running"},
                                        {label: "Always (when shortcut is pressed)", value: "always"}
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
    })
}

//TODO: remove promises
function getRunningProcesses(callback: Function) {
    childProcess.exec('tasklist', (err, stdout, stderr) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, stdout);
    });
}

function isGuildWarsRunning(callback: Function) {
    getRunningProcesses((err: any, value: string) => {
        if (err) return callback(err, null);
        if (value.indexOf("Gw2-64.exe") !== -1) {
            return callback(null, true);
        }
        return callback(null, false)
    });
}


function startProcessCheck() {
    let emitter = new EventEmitter();
    setInterval(() => {
        isGuildWarsRunning((err: any, running: boolean) => {
            if (err) {
                if (guildWarsRunning) {
                    emitter.emit("gw-closed");
                }
                guildWarsRunning = false;
            } else {
                if (guildWarsRunning != running) {
                    emitter.emit(running ? "gw-started" : "gw-closed");
                }
                guildWarsRunning = running;
            }
        })
    }, 5000);
    return emitter;
}

function showWindow() {
    if (!guildWarsRunning && preferences.value("advanced.show") === "running") {
        console.log("Tried to show window, but GuildWars is not running");
        return;
    }

    let mouse = robot.getMousePos();
    const primaryDisplay = screen.getPrimaryDisplay();
    const scale = primaryDisplay.scaleFactor;
    console.log("mouse pos", mouse);
    console.log(scale);

    // mainWindow.setPosition(Math.round((mouse.x - 240) * scale), Math.round((mouse.y - 240) * scale));
    mainWindow.setPosition(primaryDisplay.bounds.x, primaryDisplay.bounds.y)
    setTimeout(() => {
        mainWindow.setPosition(Math.round((mouse.x / scale - 240)), Math.round((mouse.y / scale - 240)));
        mainWindow.focus();
    }, 1);
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
app.on('ready', init);

app.on('will-quit', () => {
    globalShortcut.unregister(preferences.value("keybinds.shortcut_open"))
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
