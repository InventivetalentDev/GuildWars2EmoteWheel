"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emote = void 0;
var Emote = /** @class */ (function () {
    function Emote(cmd, icon, targetable) {
        this.cmd = cmd;
        this.icon = icon;
        this.targetable = targetable;
    }
    Emote.prototype.getId = function () {
        return this.cmd.substr(1);
    };
    return Emote;
}());
exports.Emote = Emote;
//# sourceMappingURL=emote.js.map