export class CoolDown {
    cd: boolean = false;
    ms = 100;
    callCount: number = 0;
    IsCoolDown(): boolean {
        this.callCount++;
        if (this.cd) {
            return this.cd;
        }
        this.cd = true;
        setTimeout(() => {
            this.cd = false;
        }, this.ms);
        return false;
    }
}