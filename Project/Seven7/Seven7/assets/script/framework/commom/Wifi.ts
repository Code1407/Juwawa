import { _decorator, Sprite, Color, Label } from 'cc';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { GameComponent } from "db://oops-framework/module/common/GameComponent"
import { BundleName } from './FrameDefine';
const { ccclass, property } = _decorator;

@ccclass('Wifi')
export class Wifi extends GameComponent {

    @property(Sprite)
    private img_wifi: Sprite;

    @property(Label)
    private lb_ping: Label;

    start(): void {
        this.on(EventMessage.GAME_PING, this.onPing, this);
        this.on(EventMessage.GAME_NET_DISCONNECT, this.onDisconnect, this);
        this.img_wifi.node.active = false;
    }

    private onPing(event: string, args: any) {
        if (event == EventMessage.GAME_PING && args && args.ping) {
            let ping = Math.round(args.ping);
            let path;
            if (ping < 99) {
                this.lb_ping.color = Color.GREEN;
                path = `atlas/common/ping_3`;
            } else if (ping >= 100 && ping <= 299) {
                this.lb_ping.color = Color.YELLOW;
                path = `atlas/common/ping_2`;
            } else if (ping >= 300) {
                this.lb_ping.color = Color.RED;
                path = `atlas/common/ping_1`;
            }
            this.lb_ping.string = ping + "ms";
            if (path) {
                super.setSprite(this.img_wifi, path, BundleName.Common);
                if (!this.img_wifi.node.active) {
                    this.img_wifi.node.active = true;
                }
                if (!this.lb_ping.node.active) {
                    this.lb_ping.node.active = true;
                }
            }
        }
    }

    private onDisconnect(event: string, args: any) {
        super.setSprite(this.img_wifi, "atlas/common/ping_4", BundleName.Common);
        if (!this.img_wifi.node.active) {
            this.img_wifi.node.active = true;
        }
        this.lb_ping.node.active = false;
    }
}