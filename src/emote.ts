export class Emote {
    cmd: string;
    icon: string;
    targetable: boolean;

    constructor(cmd: string, icon: string, targetable?: boolean) {
        this.cmd = cmd;
        this.icon = icon;
        this.targetable = targetable;
    }

     getId(){
         return this.cmd.substr(1);
    }
}