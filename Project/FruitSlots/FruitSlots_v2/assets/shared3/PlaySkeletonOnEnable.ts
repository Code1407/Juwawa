// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlaySkelotonOnEnable extends cc.Component {
    @property(sp.Skeleton)
    sk: sp.Skeleton = null;
    protected onEnable(): void {
        this.sk.clearTrack(0);
        PlayDefaultSk(this.sk);
    }
}
export function PlayDefaultSk(sk: sp.Skeleton, indexs: number[] = null) {
    let ans = sk.skeletonData.skeletonJson.animations
    if (indexs) {
        // console.log(ans);
        for (let index of indexs)
            sk.addAnimation(0, Object.keys(ans)[index], false);

    }
    else if (sk.defaultAnimation) {
        sk.setAnimation(0, `${sk.defaultAnimation}`, sk.loop);
    }
}