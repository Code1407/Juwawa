import { IRankAwardMsg } from "../interface/IBranch_Rank";
import { ArgsText } from "../lang/LangManager_Rank";
import { textsMap } from "../lang/Path_Rank";
import { ELang } from "../lang/langEnum_Rank";
import NumSuffix from "../ui/NumSuffix_Rank";
import AvatarCache from "../../../script/image/AvatarCache";

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

                avatarUrl = this.appendTimestamp(avatarUrl, Date.now(), { force: true });
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

    
    /**
     * 为 URL 安全地追加 timestamp 参数
     * 规则：
     *   - 已存在 ? → 用 & 拼接
     *   - 不存在 ? → 用 ? 拼接
     *   - 已有同名 timestamp 参数 → 默认不覆盖（可通过 force 参数控制）
     */
    appendTimestamp( url: string, timestamp: number | string = Date.now(), options: { force?: boolean } = {} ): string {
        const { force = false } = options;
        // 1. 分离 hash（#xxx），避免破坏锚点
        const hashIndex = url.indexOf('#');
        const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
        const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
        // 2. 判断是否已存在 ?
        const hasQuery = base.includes('?');
        // 3. 如果已有 timestamp 参数，按 force 决定是否覆盖
        if (hasQuery) {
            const [path, query] = base.split('?');
            const params = new URLSearchParams(query);
            if (params.has('timestamp')) {
            if (!force) {
                // 不覆盖，原样返回
                return url;
            }
            params.set('timestamp', String(timestamp));
            } else {
            params.append('timestamp', String(timestamp));
            }
            return `${path}?${params.toString()}${hash}`;
        }
        // 4. 没有 ?，直接拼接
        return `${base}?timestamp=${encodeURIComponent(String(timestamp))}${hash}`;
    }
}
