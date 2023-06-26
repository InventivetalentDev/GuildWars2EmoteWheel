"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emote = void 0;
var Emote = /** @class */ (function () {
    function Emote(cmd, icon, targetable) {
        this.id = cmd.substring(1);
        this.cmd = cmd;
        this.icon = icon;
        this.targetable = targetable;
    }
    return Emote;
}());
exports.Emote = Emote;
//# sourceMappingURL=emote.js.map