const { ccclass, property } = cc._decorator;

@ccclass
export default class PlaySoundOnClick extends cc.Component {
    @property(cc.AudioSource)
    ctrlElements: cc.AudioSource[] = [];

    protected onLoad(): void {
        this.ctrlElements.forEach(element => {
            this.node.on(cc.Node.EventType.TOUCH_END, () => {
                console.log("click play sound" + element.name);
                element.play();
            })
        });
    }

}
