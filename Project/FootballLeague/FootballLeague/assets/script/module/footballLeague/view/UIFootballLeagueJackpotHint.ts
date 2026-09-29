import { _decorator, Color, Component, Graphics, Label, Node, tween, Tween, UIOpacity, UITransform, v3 } from 'cc';

const { ccclass } = _decorator;

interface JackpotHint {
    userName: string;
    amount: number;
}

/** FruitSlots 同款全服 JP 中奖跑马灯。消息依次播放，避免多人同时中奖时互相覆盖。 */
@ccclass('UIFootballLeagueJackpotHint')
export class UIFootballLeagueJackpotHint extends Component {
    private readonly queue: JackpotHint[] = [];
    private textRoot: Node = null;
    private titleLabel: Label = null;
    private userLabel: Label = null;
    private wonLabel: Label = null;
    private amountLabel: Label = null;
    private suffixLabel: Label = null;
    private opacity: UIOpacity = null;
    private isPlaying = false;
    private marqueeWidth = 720;

    onLoad(): void {
        this.build();
    }

    onDestroy(): void {
        Tween.stopAllByTarget(this.textRoot);
    }

    public show(userName: string, amount: number): void {
        const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
        if (safeAmount <= 0) {
            return;
        }
        this.queue.push({ userName: this.normalizeName(userName), amount: safeAmount });
        this.playNext();
    }

    private playNext(): void {
        if (this.isPlaying || this.queue.length <= 0) {
            return;
        }

        const hint = this.queue.shift();
        this.isPlaying = true;
        this.userLabel.string = hint.userName;
        this.amountLabel.string = hint.amount.toLocaleString('en-US');
        const textWidth = this.layoutText();
        this.node.active = true;
        this.opacity.opacity = 255;
        this.textRoot.setPosition(this.marqueeWidth / 2 + textWidth / 2 + 24, 0, 0);
        this.textRoot.setScale(1, 1, 1);
       
        tween(this.textRoot)
            .to(0.18, { scale: v3(1.06, 1.06, 1) })
            .to(0.14, { scale: v3(1, 1, 1) })
            .to(6.2, { position: v3(-this.marqueeWidth / 2 - textWidth / 2 - 24, 0, 0) })
            .call(() => {
                this.node.active = false;
                this.isPlaying = false;
                this.playNext();
            })
            .start();
    }

    private build(): void {
        const parentTransform = this.node.parent && this.node.parent.getComponent(UITransform);
        this.marqueeWidth = parentTransform ? parentTransform.contentSize.width : 720;
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        transform.setContentSize(this.marqueeWidth, 92);
        // 父节点 Hint 已决定 UI 位置；跑马灯在 Hint 的本地坐标原点展示。
        this.node.setPosition(0, 0, 0);
        this.opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);

        this.textRoot = new Node('MarqueeText');
        this.textRoot.layer = this.node.layer;
        this.textRoot.parent = this.node;
        this.textRoot.addComponent(UITransform).setContentSize(0, 88);
        this.titleLabel = this.createLabel(this.textRoot, '🎉  JP!', 42, new Color(255, 224, 70, 255));
     
        this.userLabel = this.createLabel(this.textRoot, '', 28, new Color(255, 255, 255, 255));
        this.wonLabel = this.createLabel(this.textRoot, 'WON', 26, new Color(255, 226, 139, 255));
        this.amountLabel = this.createLabel(this.textRoot, '', 34, new Color(255, 232, 68, 255));
        this.suffixLabel = this.createLabel(this.textRoot, 'JACKPOT!  🎉', 26, new Color(255, 255, 255, 255));

      
        this.node.active = false;
    }

    

    /** 根据各段真实渲染宽度横向串联，不能用固定 X 和固定 150 宽的文本框。 */
    private layoutText(): number {
        const labels = [this.titleLabel, this.userLabel, this.wonLabel, this.amountLabel, this.suffixLabel];
        const gap = 12;
        let totalWidth = 0;
        const widths = labels.map((label) => {
            label.updateRenderData(true);
            const width = label.node.getComponent(UITransform).contentSize.width;
            totalWidth += width;
            return width;
        });
        totalWidth += gap * (labels.length - 1);

        let x = -totalWidth / 2;
        labels.forEach((label, index) => {
            const width = widths[index];
            label.node.setPosition(x + width / 2, 0, 0);
            x += width + gap;
        });
        this.textRoot.getComponent(UITransform).setContentSize(totalWidth, 88);
        return totalWidth;
    }

    private createLabel(parent: Node, text: string, fontSize: number, color: Color): Label {
        const labelNode = new Node(text || 'Label');
        labelNode.layer = this.node.layer;
        labelNode.parent = parent;
        labelNode.addComponent(UITransform);
        const label = labelNode.addComponent(Label);
        label.useSystemFont = true;
        label.fontFamily = 'Arial';
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.overflow = Label.Overflow.NONE;
        label.string = text;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }

    private normalizeName(userName: string): string {
        const name = String(userName || '').trim();
        if (!name) {
            return 'PLAYER';
        }
        return name.length > 16 ? `${name.slice(0, 15)}…` : name;
    }
}
