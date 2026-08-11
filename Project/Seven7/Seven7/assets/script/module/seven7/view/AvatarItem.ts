import { _decorator, Label, Sprite, SpriteFrame } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { oops } from 'db://oops-framework/core/Oops';
import GameModelMgr from '../../mvc/GameModelMgr';
import { Utils } from '../../../framework/utils/Utils';


const { ccclass, property } = _decorator;

@ccclass('AvatarItem')
export class AvatarItem extends GameComponent {
    @property(Sprite)
    avatarFrame: Sprite;
    @property(Sprite)
    private avatarIcon: Sprite;
    @property(Label)
    private nameLabel: Label;

    initSelf() {
        let avatarUrl = GameModelMgr.playerModel.get_player_avatar_url();
        if (avatarUrl) {
            oops.res.loadRemote(avatarUrl, { ext: '.png' }, (error, texture) => {
                this.avatarIcon.spriteFrame = SpriteFrame.createWithImage(texture);
            });
        }
        let name = GameModelMgr.playerModel.get_player_name();
        name = Utils.getName(name, 11);
        this.nameLabel.string = name;
    }

    init(avatarUrl: string, playerName: string) {
        if (avatarUrl) {
            oops.res.loadRemote(avatarUrl, { ext: '.png' }, (error, texture) => {
                this.avatarIcon.spriteFrame = SpriteFrame.createWithImage(texture);
            });
        }

        let name = Utils.getName(playerName, 8);
        this.nameLabel.string = name;
    }

}
