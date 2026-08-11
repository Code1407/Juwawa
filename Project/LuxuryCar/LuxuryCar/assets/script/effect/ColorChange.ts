const {ccclass} = cc._decorator;

@ccclass
export default class ColorChange extends cc.Component {

    private originalColor: cc.Color;
    private isDark: boolean = false;

    protected init() {
        this.originalColor = this.node.color;
        for (let i = 0; i < this.node.childrenCount; ++i) {
            let child = this.node.children[i];
            let colorChange = child.getComponent(ColorChange)
            if (colorChange == null) {
                colorChange = child.addComponent(ColorChange);
                colorChange.init();
            }
        }
    }

    dark() {
        if (this.isDark)
            return;
        this.isDark = true;

        let color = this.node.color;
        color.r = color.r / 2;
        color.g = color.g / 2;
        color.b = color.b / 2;
        this.node.color = color;
        for (let i = 0; i < this.node.childrenCount; ++i) {
            let child = this.node.children[i];
            child.getComponent(ColorChange).dark();
        }

        //cc.log("dark:" + this.node.name + ":" + this.node.color.toString());
    }

    recover() {
        if (!this.isDark)
            return;
        this.isDark = false;

        this.node.color = this.originalColor.clone();
        for (let i = 0; i < this.node.childrenCount; ++i) {
            let child = this.node.children[i];
            child.getComponent(ColorChange).recover();
        }

        //cc.log("recover:" + this.node.name + ":" + this.node.color.toString());
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.init();
    }

    // start () { }
}
