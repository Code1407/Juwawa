import { _decorator, Component, Color, Label, Sprite } from 'cc';

const { ccclass } = _decorator;

@ccclass('ColorChange')
export default class ColorChange extends Component {
    private originalSpriteColor: Color | null = null;
    private originalLabelColor: Color | null = null;
    private isDark = false;
    private initialized = false;

    protected onLoad() {
        this.initCache();
    }

    private initCache() {
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        const sprite = this.node.getComponent(Sprite);
        const label = this.node.getComponent(Label);

        if (sprite) {
            this.originalSpriteColor = sprite.color.clone();
        }

        if (label) {
            this.originalLabelColor = label.color.clone();
        }

        for (const child of this.node.children) {
            let colorChange = child.getComponent(ColorChange);
            if (!colorChange) {
                colorChange = child.addComponent(ColorChange);
            }
            colorChange.initCache();
        }
    }

    public dark() {
        if (this.isDark) {
            return;
        }
        this.isDark = true;

        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            const c = (this.originalSpriteColor ?? sprite.color).clone();
            c.r = Math.floor(c.r * 0.5);
            c.g = Math.floor(c.g * 0.5);
            c.b = Math.floor(c.b * 0.5);
            sprite.color = c;
        }

        const label = this.node.getComponent(Label);
        if (label) {
            const c = (this.originalLabelColor ?? label.color).clone();
            c.r = Math.floor(c.r * 0.5);
            c.g = Math.floor(c.g * 0.5);
            c.b = Math.floor(c.b * 0.5);
            label.color = c;
        }

        for (const child of this.node.children) {
            child.getComponent(ColorChange)?.dark();
        }
    }

    public recover() {
        if (!this.isDark) {
            return;
        }
        this.isDark = false;

        const sprite = this.node.getComponent(Sprite);
        if (sprite && this.originalSpriteColor) {
            sprite.color = this.originalSpriteColor.clone();
        }

        const label = this.node.getComponent(Label);
        if (label && this.originalLabelColor) {
            label.color = this.originalLabelColor.clone();
        }

        for (const child of this.node.children) {
            child.getComponent(ColorChange)?.recover();
        }
    }
}
