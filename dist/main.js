"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var robot = require("robotjs");
var emote_1 = require("./emote");
var openurl = require("openurl");
var ElectronPreferences = require("electron-preferences");
var ALL_EMOTES = [
    new emote_1.Emote("/beckon", "following", true),
    new emote_1.Emote("/bow", "arc", true),
    new emote_1.Emote("/cheer", "american-football-cheerleader-jump", true),
    new emote_1.Emote("/cower", "scare"),
    new emote_1.Emote("/crossarms", "noun_643310_cc"),
    new emote_1.Emote("/cry", "teardrop-falling-on-sad-emoticon-face"),
    new emote_1.Emote("/dance", "dancer"),
    new emote_1.Emote("/upset", "upset"),
    new emote_1.Emote("/kneel", "kneel-pray"),
    new emote_1.Emote("/laugh", "laughing", true),
    new emote_1.Emote("/no", "cancel", true),
    new emote_1.Emote("/point", "hand", true),
    new emote_1.Emote("/ponder", "thought"),
    new emote_1.Emote("/sad", "frown"),
    new emote_1.Emote("/salute", "saluting-soldier-silhouette", true),
    new emote_1.Emote("/shrug", "noun_1221198_cc", true),
    new emote_1.Emote("/sit", "meditation-yoga-posture"),
    new emote_1.Emote("/sleep", "sleeping-bed-silhouette"),
    new emote_1.Emote("/surprised", "shocked-face", true),
    new emote_1.Emote("/talk", "chat-speech-bubbles", true),
    new emote_1.Emote("/thx", "like", true),
    new emote_1.Emote("/threaten", "criminal-with-a-knife-attacking-a-person-asking-for-money", true),
    new emote_1.Emote("/wave", "person-calling-a-taxi", true),
    new emote_1.Emote("/yes", "checked", true)
];
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
var tray;
var preferences;
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
    global.globalObj.runEmote = function (emote, target, sync) {
        robot.mouseClick("right");
        console.log("click");
        setTimeout(function () {
            var cmdKey = preferences.value("keybinds.key_command") || "-";
            robot.keyTap(cmdKey.toLowerCase()); // For WHATEVER reason we need to use the GW command keybind ("-" by default),
            // since using the default key to open the chat doesn't seem to want to send the command...
            console.log(cmdKey + " (command key)");
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
                    var sendKey = preferences.value("keybinds.key_send") || "enter";
                    robot.keyTap(sendKey.toLowerCase());
                    console.log(sendKey + " (send key)");
                }, 20);
            }, 50);
        }, 50);
    };
    console.log("Running!!");
}
function createTray() {
    tray = new electron_1.Tray(path.join(__dirname, "../res/logo/favicon.ico"));
    tray.setToolTip("Emote Wheel for Guild Wars 2");
    var contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: "About", click: function () {
                openurl.open("https://github.com/InventivetalentDev/GuildWars2EmoteWheel/blob/master/README.md");
            }
        },
        {
            label: "Settings", click: function () {
                preferences.show();
            }
        },
        { label: "", type: "separator" },
        {
            label: "Exit", click: function () {
                electron_1.app.quit();
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
    mainWindow = new electron_1.BrowserWindow({ width: 480, height: 480, frame: false, transparent: true, alwaysOnTop: true, show: false });
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../index.html'),
        protocol: 'file:',
        slashes: true
    }));
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
    global.globalObj.windowOpen = false;
    electron_1.globalShortcut.register(preferences.value("keybinds.shortcut_open") || "Alt+C", function () {
        console.log('OPEN_KEYCODE is pressed');
        if (!global.globalObj.windowOpen) {
            showWindow();
        }
        else {
            hideWindow();
        }
        global.globalObj.windowOpen = !global.globalObj.windowOpen;
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
            advanced: {
                debug: []
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
                                                value: e.cmd.substr(1)
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
                                    type: "checkbox",
                                    options: [
                                        {
                                            label: "Developer Tools",
                                            value: "devtools"
                                        }
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