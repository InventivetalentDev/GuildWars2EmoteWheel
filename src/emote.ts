export class Emote {
    id: string;
    cmd: string;
    icon: string;
    targetable: boolean;

    constructor(cmd: string, icon: string, targetable?: boolean) {
        this.id = cmd.substring(1);
        this.cmd = cmd;
        this.icon = icon;
        this.targetable = targetable;
    }

}
