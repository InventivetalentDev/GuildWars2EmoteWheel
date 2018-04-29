"use strict";
exports.__esModule = true;
var Emote = /** @class */ (function () {
    function Emote(cmd, icon, targetable) {
        this.cmd = cmd;
        this.icon = icon;
        this.targetable = targetable;
    }
    Emote.prototype.getId = function () {
        return "emote_" + this.cmd.substr(1);
    };
    return Emote;
}());
exports.Emote = Emote;
//# sourceMappingURL=emote.js.map