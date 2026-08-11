import { IRankAwardMsg } from "../interface/IBranch_Rank";
import { ArgsText } from "../lang/LangManager_Rank";
import { textsMap } from "../lang/Path_Rank";
import { ELang } from "../lang/langEnum_Rank";
import NumSuffix from "../ui/NumSuffix_Rank";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GlobalRankAwardView extends cc.Component {
    @property(cc.RichText)
    txRank: cc.RichText = null;
    @property(cc.Label)
    txMyAward: cc.Label = null;
    @property(sp.Skeleton)
    skFirework: sp.Skeleton = null;
    @property(cc.AudioSource)
    auFirework: cc.AudioSource = null;
    @property(cc.Label)
    userNames: cc.Label[] = [];
    @property(cc.Sprite)
    userIcon: cc.Sprite[] = [];
    Display(msg: IRankAwardMsg) {
        let lang = ((<any>window).user && (<any>window).user.lang) || ELang[ELang.en];
        if (lang && lang.length > 2) lang = lang.substring(0, 2);
        lang = Number(ELang[lang]);
        if (textsMap[lang] == null) lang = Number(ELang.en);
        this.txRank.string = ArgsText(textsMap[lang.toString()].path12, msg.rank + NumSuffix.GetSuffix(msg.rank.toString()), Math.floor(msg.bonus).toString());
        for (let i = 0; i < Math.min(msg.rankUsers.length, this.userNames.length, this.userIcon.length); i++) {
            let user = msg.rankUsers[i];
            user.name = decodeURI(user.name);
            let avatarUrl = user.avatar ?? user.avator;
            if (avatarUrl) {
                avatarUrl = decodeURI(avatarUrl);
                avatarUrl += `?timestamp=${Date.now()}`;
            }
            console.log(user.name);
            console.log(avatarUrl);
            let sp = this.userIcon[i];
            if (user.name.length > 10) {
                user.name = user.name.substring(0, 8) + "...";
            }
            this.userNames[i].string = user.name;
            if (avatarUrl) {
                cc.loader.load({ url: avatarUrl, type: 'image' }, (error, texture) => {
                    var frame = new cc.SpriteFrame(texture);
                    sp.spriteFrame?.destroy();
                    sp.spriteFrame = frame;
                });
            }
        }
    }
    protected onEnable(): void {
        this.auFirework.play();
        this.skFirework.setAnimation(0, "animation2", true);
    }
}
