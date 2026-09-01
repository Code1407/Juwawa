// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


import { Effect } from "../effect/FlyChip";
import { gGameData } from "../GameData";
import ChangeChip from "../image/ChangeChip";
import { BET_POSITION_COUNT, getBetGradeAmounts, IBatListResp, IRankListItem } from "../interface/ILuckyFruits";
import Game from "../Game";
import ImageCache from "../image/ImageCache";
import Audio from "../Audio";
import AvatarCache from "../image/AvatarCache";
const { ccclass, property } = cc._decorator;

@ccclass
export default class RankUI extends cc.Component {

    @property(cc.Node)
    RankingsView: cc.Node = null;
    @property(cc.Node)
    player1: cc.Node = null;
    @property(cc.Node)
    player2: cc.Node = null;
    @property(cc.Node)
    player3: cc.Node = null;
    @property(cc.Node)
    player4: cc.Node = null;
    @property(cc.Node)
    player5: cc.Node = null;
    @property(cc.Node)
    playerOther: cc.Node = null;
    @property(cc.Node)
    target1: cc.Node = null;
    @property(cc.Node)
    target2: cc.Node = null;
    @property(cc.Node)
    target3: cc.Node = null;
    @property(cc.Node)
    target4: cc.Node = null;
    @property(cc.Node)
    target5: cc.Node = null;
    letobj = {
        0: 0,
        1: 3,
        2: 6,
        3: 9
    }
    letpos = {
        0: this.target1,
        1: this.target2,
        2: this.target3,
        3: this.target4,
        4: this.target5,
    }
    letplayer = {
        0: this.player1,
        1: this.player2,
        2: this.player3,
        3: this.player4,
        4: this.player5,
        5: this.playerOther,
    }
    start() {
        this.letpos = {
            0: this.target1,
            1: this.target2,
            2: this.target3,
            3: this.target4,
            4: this.target5,
        }
        this.letplayer = {
            0: this.player1,
            1: this.player2,
            2: this.player3,
            3: this.player4,
            4: this.player5,
            5: this.playerOther,
        }
    }

    soundSmall:boolean=false;

    public setRankData(resp: IRankListItem[]): void {
        ////冒泡
        let arr1: IRankListItem[] = [];
        if (resp) {
            for (let i = 0; i < resp.length; i++) {
                arr1[i] = resp[i];
            }
            let len = arr1.length;
            for (let i = 0; i < len - 1; i++) {
                let swapped = false;
                for (let j = 0; j < len - 1 - i; j++) {
                    // 如果前一个元素的 revenue 小于后一个元素的 revenue，就交换它们
                    if (arr1[j].revenue < arr1[j + 1].revenue) {
                        let temp = arr1[j];
                        arr1[j] = arr1[j + 1];
                        arr1[j + 1] = temp;
                        // 标记为发生了交换
                        swapped = true;
                    }
                }
                // 如果这一轮没有发生交换，说明数组已经有序，提前退出循环
                if (!swapped) {
                    break;
                }
            }
        }
        for (let i = 0; i < 5; i++) {
            if (resp) {
                // this.letplayer[i].active = true;
                this.setRankItem(this.letplayer[i], arr1[i]);
                try {
                    cc.find("Diamond/Label", this.letplayer[i]).getComponent(cc.Label).string = arr1[i].revenue.toString();
                } catch (error) {
                    cc.find("Diamond/Label", this.letplayer[i]).getComponent(cc.Label).string = "";
                    cc.find("name", this.letplayer[i]).getComponent(cc.Label).string = ""
                    cc.find("head/mask/sprite", this.letplayer[i]).getComponent(cc.Sprite).spriteFrame = null;
                }
            }
            else {
                cc.find("name", this.letplayer[i]).getComponent(cc.Label).string = ""
                cc.find("head/mask/sprite", this.letplayer[i]).getComponent(cc.Sprite).spriteFrame = null;
                cc.find("Diamond/Label", this.letplayer[i]).getComponent(cc.Label).string = "";
            }
        }
    }
    private setRankItem(node: cc.Node, item: IRankListItem): void {
        if (item == null) {
            return;
        }
        var name = decodeURI(item.name);
        if (name.length > 7) {
            name = name.slice(0, 7) + "...";
        }
        cc.find("name", node).getComponent(cc.Label).string = name;
        const sprite = cc.find("head/mask/sprite", node).getComponent(cc.Sprite);
        sprite.spriteFrame = null;
        const avatarUrl = AvatarCache.normalize(item.profile);
        if (!avatarUrl) return;
        (<any>sprite).__avatarUrl = avatarUrl;
        AvatarCache.load(avatarUrl, (error, frame) => {
            if (!error && frame && sprite.node.isValid && (<any>sprite).__avatarUrl === avatarUrl) {
                sprite.spriteFrame = frame;
            }
        });
    }

    FlyChip(data: IBatListResp) {
        let player;
        let targetPos;
        if (data.uid == Game.Instance.player.uid) {
            //Game.Instance.FlyChipMind(data,this.letpos);
            return;
        }
        player = Game.Instance.FlyFromNode;           /// this.letplayer[data.flyPlayerPos]
        let chip = (<any>window).betGrade;
        let gradeCount = getBetGradeAmounts().length;
        for (let i = 0; i < BET_POSITION_COUNT; i++) {
            if (data.batIndex[i] > 0) {
                targetPos = this.letpos[i];
                let row = data.num[i] || [];
                for (let j = 0; j < gradeCount; j++) {
                    if (row[j] > 0) {
                        //for(let n=0;n<data.num[i][j];n++){
                        // this.soundSmall=true;
                        let flyChips = chip.getChip(j) || ImageCache.Instance.betAmount[j];
                        Effect.FlyChip(player, targetPos, flyChips, row[j]);//投注，飞筹码
                        //}
                    }
                }
            }
        }
        // if(this.soundSmall==true){
            Audio.Instance.playSendBet();
        //     this.soundSmall=false;
        // }
    }

    ShowRewardCount(num: {}) {
        for (let i = 0; i <= 5; i++) {
            let player = this.letplayer[i];
            let addGoldLabel: cc.Node = cc.find("addgold", player);
            let goldNum: number = num[player.name];
            if (goldNum > 0) {
                addGoldLabel.getComponent(cc.Label).string = "+" + (goldNum < 1000 ? goldNum.toString() : goldNum / 1000 + "k");
                addGoldLabel.active = true;
                addGoldLabel.opacity = 0;
                //this.RewardingView.runAction(cc.fadeIn(0.3));

                addGoldLabel.runAction(
                    cc.sequence(
                        cc.fadeIn(0.3),
                        cc.delayTime(1),
                        cc.fadeOut(0.3),
                        cc.callFunc(() => {
                            addGoldLabel.active = false
                        })
                    )
                );
            }

        }

    }
    open() {
        this.RankingsView.active = true;
        Audio.Instance.playCardOut();
    }
    close() {
        this.RankingsView.active = false;
    }


}
