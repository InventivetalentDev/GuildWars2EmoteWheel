import { app, BrowserWindow, Menu, Tray, MenuItem, globalShortcut } from "electron";
import * as path from "path";
import * as url from "url";
import * as robot from "robotjs";
import { Global } from "./types/CustomGlobal";
import { Emote } from "./emote";

const openurl = require("openurl");
const ElectronPreferences = require("electron-preferences");

declare const global: Global;

const ALL_EMOTES = [
    new Emote("/beckon", "following", true),
    new Emote("/bow", "arc", true),
    new Emote("/cheer", "american-football-cheerleader-jump", true),
    new Emote("/cower", "scare"),
    new Emote("/crossarms", "noun_643310_cc"),
    new Emote("/cry", "teardrop-falling-on-sad-emoticon-face"),
    new Emote("/dance", "dancer"),
    new Emote("/upset", "upset"),
    new Emote("/kneel", "kneel-pray"),
    new Emote("/laugh", "laughing", true),
    new Emote("/no", "cancel", true),
    new Emote("/point", "hand", true),
    new Emote("/ponder", "thought"),
    new Emote("/sad", "frown"),
    new Emote("/salute", "saluting-soldier-silhouette", true),
    new Emote("/shrug", "noun_1221198_cc", true),
    new Emote("/sit", "meditation-yoga-posture"),
    new Emote("/sleep", "sleeping-bed-silhouette"),
    new Emote("/surprised", "shocked-face", true),
    new Emote("/talk", "chat-speech-bubbles", true),
    new Emote("/thx", "like", true),
    new Emote("/threaten", "criminal-with-a-knife-attacking-a-person-asking-for-money", true),
    new Emote("/wave", "person-calling-a-taxi", true),
    new Emote("/yes", "checked", true)
];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow;
let tray: Electron.Tray;
let preferences: any;

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

    global.globalObj.runEmote = function (emote: Emote, target: boolean, sync: boolean) {
        robot.mouseClick("right");
        console.log("click")

        setTimeout(function () {
            let cmdKey = preferences.value("keybinds.key_command") || "-";
            robot.keyTap(cmdKey.toLowerCase());// For WHATEVER reason we need to use the GW command keybind ("-" by default),
            // since using the default key to open the chat doesn't seem to want to send the command...
            console.log(cmdKey + " (command key)")

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
                    let sendKey = preferences.value("keybinds.key_send") || "enter";
                    robot.keyTap(sendKey.toLowerCase());
                    console.log(sendKey + " (send key)");
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
        {
            label: "Settings", click() {
                preferences.show();
            }
        },
        { label: "", type: "separator" },
        {
            label: "Exit", click() {
                app.quit();
            }
        }
    ]);
    tray.setContextMenu(contextMenu);

    tray.displayBalloon({
        icon: path.join(__dirname, "../res/logo/GW2_Logo_emote_1024.png"),
        title: "GW2 Emote Wheel",
        content: "Press " + (preferences.value("keybinds.shortcut_open") || "Alt+C") + " to open!"
    });
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 480, height: 480, frame: false, transparent: true, alwaysOnTop: true, show: false });


    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    if (preferences.value("advanced.debug"))
        mainWindow.webContents.openDevTools({ mode: "detach" })

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
    globalShortcut.register(preferences.value("keybinds.shortcut_open") || "Alt+C", () => {
        console.log('OPEN_KEYCODE is pressed')
        if (!global.globalObj.windowOpen) {
            showWindow()
        } else {
            hideWindow();
        }
        global.globalObj.windowOpen = !global.globalObj.windowOpen;
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
                    ALL_EMOTES.forEach((e) => {
                        arr.push(e.cmd.substr(1));
                    });
                    return arr;
                })()
            },
            advanced: {
                debug: false
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
                                                value: e.cmd.substr(1)
                                            })
                                        });
                                        return arr;
                                    })()
                                }
                            ]
                        }
                    ]
                }
            },
            {
                id: "advanced",
                label: "Advanced",
                icon: "settings-gear-63",
                form: {
                    groups: [
                        {
                            label: "Debug",
                            fields: [
                                {
                                    label: "Debug",
                                    key: "debug",
                                    type: "checkbox"
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