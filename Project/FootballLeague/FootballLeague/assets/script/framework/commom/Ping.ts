import { _decorator, Label } from 'cc';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { GameComponent } from "db://oops-framework/module/common/GameComponent"
const { ccclass, property } = _decorator;

@ccclass('Ping')
export class Ping extends GameComponent {

    @property(Label)
    pingLabel: Label;

    start(): void {
        this.on(EventMessage.GAME_PING, this.onHandler, this);
    }

    private onHandler(event: string, args: any) {
        if (event == EventMessage.GAME_PING && args && args.ping) {
            let ping = args.ping;
            this.pingLabel.string = `Ping:${ping}ms`;
        }
    }
}