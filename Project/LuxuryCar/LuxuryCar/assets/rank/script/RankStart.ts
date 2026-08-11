const { ccclass, property } = cc._decorator;

@ccclass
export default class RankStart extends cc.Component {
    @property(cc.Node)
    activityPos: cc.Node = null;
    @property(cc.Node)
    rankViewPos: cc.Node = null;
    @property(cc.Node)
    rankButtonPos: cc.Node = null;
    @property(cc.Node)
    coinFxEndPos: cc.Node = null;
    @property(cc.Prefab)
    globalRankPrefab: cc.Prefab = null;

    static Instance: RankStart = null;

    start() {
        RankStart.Instance = this;
        (<any>window).activityPos = this.activityPos;
        (<any>window).rankViewPos = this.rankViewPos;
        (<any>window).rankButtonPos = this.rankButtonPos;
        (<any>window).coinFxEndPos = this.coinFxEndPos;
        (<any>window).GlobalRankUI = cc.instantiate(this.globalRankPrefab).getComponent(`GlobalRankUI`);
    }

    LoadRank() {
        let GlobalRankUI = (<any>window).GlobalRankUI;
        if (!GlobalRankUI) return;
        if (!(<any>window).enableRank) return;
        let rankButton = GlobalRankUI.rankButton;
        let awardButton = GlobalRankUI.awardButton;
        let cvs = cc.director.getScene().getComponentInChildren(cc.Canvas);
        let ins: cc.Node = GlobalRankUI.node;
        ins.setParent((<any>window).rankViewPos);
        let fitSize = Math.min(cvs.designResolution.width, cvs.designResolution.height);
        ins.setScale(cc.Vec3.ONE.multiplyScalar(fitSize / 720));
        ins.position = cc.Vec3.ZERO;
        (<any>window).destoryRank = () => {
            ins.destroy();
            rankButton.destroy();
            awardButton.destroy();
        }
    }

}

