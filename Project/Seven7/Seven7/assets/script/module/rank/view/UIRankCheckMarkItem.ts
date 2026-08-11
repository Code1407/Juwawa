import { _decorator, Node } from 'cc';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
const { ccclass, property } = _decorator;

@ccclass('UIRankCheckMarkItem')
export class UIRankCheckMarkItem extends GameComponent {
    @property(Node)
    isOn: Node;
    @property(Node)
    isOff: Node;
    @property(Node)
    isSelect: Node;
    @property(Node)
    status: Node[] = [];

    private dayIndex:number = 0;
    private func:Function = null;

    onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this.on_click_item.bind(this))
    }

    init(index:number, func:Function): void {
        this.dayIndex = index;
        this.func = func;
    }

    set_state(state:number) {
        this.status.forEach(element => {
            element.active = false;
        });
        if (this.status.length > 0) {
            this.status[state % this.status.length].active = true;
        }
    }

    get_index(): number {
        return this.dayIndex;
    }

    private on_click_item(){
        if(!this.func){
            return;
        }
        this.func(this.dayIndex);
    }
}


