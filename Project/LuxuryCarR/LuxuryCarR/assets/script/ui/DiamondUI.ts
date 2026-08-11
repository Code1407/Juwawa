// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass} = cc._decorator;

@ccclass
export default class DiamondUI extends cc.Component {

   
    protected onEnable(): void {
        let config = (<any>window).config;
        if (config && config.setGameCoin) {
            config.setGameCoin(this.getComponent(cc.Sprite));
        }
    }
    protected start(): void {
    }
}
