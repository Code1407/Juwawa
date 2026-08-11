

const { ccclass, property } = cc._decorator;

@ccclass
export default class LogChildrenNames extends cc.Component {
    @property()
    isArray = true;
    protected start(): void {
        let toLog: string[] = [];
        for (let i in this.node.children) {
            if (this.isArray)
                toLog.push(this.node.children[i].name);
            else
                toLog.push(`${this.node.children[i].name}:"${this.node.children[i].name}"`);
        }
        console.log(toLog.join(`,\n`));
    }

}
