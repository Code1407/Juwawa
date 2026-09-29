import { _decorator, Component, find, Label, Mask, Node, tween, Tween, UITransform } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameEvent } from '../../common/GameEvent';
import GameModelMgr from '../../mvc/GameModelMgr';
import { Utils } from '../../../framework/utils/Utils';

const { ccclass, property } = _decorator;

interface RollingDigitLabel {
    node: Node;
    label: Label;
    value: number;
}

interface RollingDigitColumn {
    labels: RollingDigitLabel[];
    baseDigit: number;
}

interface JackpotUpdatePayload {
    value: number | string;
    /** MSG_JACKPOT_UPDATE 发出时的服务器时间（毫秒）。 */
    serverTime: number;
    /** 重入场次 3 时强制按当前分段计划重新刷新。 */
    force?: boolean;
}

@ccclass('JackpotRoller')
export class JackpotRoller extends Component {
    @property
    public minIntegerDigits: number = 7;

    @property
    public rollDuration: number = 1;

    @property({ displayName: '涨幅分段数量' })
    public segmentCount: number = 4;

    @property
    public digitGap: number = 10;

    @property({type: Node,displayName: '金额节点'})
    public amountNode: Node = null;

    private amountLabel: Label = null;

    private digitRoot: Node = null;
    private columns: RollingDigitColumn[] = [];
    private digitHeight: number = 60;
    private digitWidth: number = 34;
    private currentNumber: number = 0;
    private targetNumber: number = 0;
    private displayNumber: number = 0;
    private rollState: { ratio: number } = null;
    private finalTargetNumber: number = 0;
    private segmentQueue: number[] = [];
    private segmentTimer: () => void = null;
    private syncedOnce: boolean = false;

    onLoad() {
        this.buildDigitsFromTemplate();
    }

    //--------10点56分
    start() {
        oops.message.on(GameEvent.MSG_JACKPOT_UPDATE, this.onJackpotUpdate, this);
    }

    onDestroy() {
        oops.message.off(GameEvent.MSG_JACKPOT_UPDATE, this.onJackpotUpdate, this);
        this.cancelSegmentPlan();
        this.stopRoll();
    }

    public async setValue(value: number | string, serverTime?: number, force: boolean = false) {
        const nextNumber = this.normalizeValue(value);

        // 普通重复推送不打断滚动；但重入 Master 的服务端快照必须重新排定分段时间。
        if (!force && this.syncedOnce && nextNumber === this.finalTargetNumber) {
            return;
        }


        //延迟5秒执行下面的操作
        const delay = (ms: number): Promise<void> =>
        new Promise((resolve) => setTimeout(resolve, ms));

        // 新目标到来：取消进行中的分段计划，重新排期
        this.cancelSegmentPlan();

        await delay(10000);



        // 首次对齐（登录 / 进房 / 断线重连）或新值不高于当前显示值（JP 派奖回退），
        // 直接跳转显示真实值，不做分段动画。
       // if (!this.syncedOnce || (!force && nextNumber <= this.displayNumber)) {
            this.stopRoll();
            this.syncedOnce = true;
            this.finalTargetNumber = nextNumber;
            this.buildDigitsFromTemplate(this.formatValue(nextNumber), nextNumber);
            return;
       // }

        this.finalTargetNumber = nextNumber;
        this.startSegmentRoll(serverTime);
    }

    /**
     * 将一次涨幅拆成 segmentCount 段，在投注期内逐段滚动，
     * 避免一次性跳变；最后一段固定等于真实目标值。
     */
    private startSegmentRoll(serverTime?: number) {
        const target = this.finalTargetNumber;
        const start = this.displayNumber;
        const delta = target - start;
        const count = this.segmentCount > 1 ? Math.floor(this.segmentCount) : 1;

        // 涨幅不足以分段时，直接单段滚到位
        if (delta <= 0 || delta < count) {
            this.rollTo(target);
            return;
        }

        this.segmentQueue = [];
        for (let k = 1; k <= count; k++) {
            const step = k >= count ? target : start + Math.floor(delta * k / count);
            this.segmentQueue.push(step);
        }

        // round 决定分段间隔；通知中携带的服务器时间决定所有端共同的起跑时刻。
        const roundId = GameModelMgr.footballLeagueModel.get_cur_round();
        const sharedSeed = Utils.getRound(roundId);
        const randomShares = this.splitSeededRandom(30, count, sharedSeed);
        const startTime = (serverTime || Date.now()) + 5000;
         // 服务时间+5秒  -  当前时间  =  延迟时间
        const delaySeconds = Math.max(0, (startTime - Date.now()) / 1000);

       

        this.segmentTimer = () => {
            this.segmentTimer = null;
            this.advanceSegment(0, randomShares);
        };
        this.scheduleOnce(this.segmentTimer, delaySeconds);
    }

    private advanceSegment(index: number, interval: number[]) {
        if (this.segmentQueue.length <= 0) {
            return;
        }
        const nextTarget = this.segmentQueue.shift();
        this.rollTo(nextTarget);

        if (this.segmentQueue.length > 0) {
            this.segmentTimer = () => this.advanceSegment(index + 1, interval);
            this.scheduleOnce(this.segmentTimer, interval[index] || 2);
        }

      
       
        
    }


    /**
 * Mulberry32: 跨平台一致的确定性PRNG
 * ⚠️ 切勿替换为 Math.random()
 */
    mulberry32(seed: number): () => number {
        let state = seed | 0;
        return () => {
            state = (state + 0x6D2B79F5) | 0;
            let t = Math.imul(state ^ (state >>> 15), 1 | state);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * 基于种子的随机拆分（多端安全）
     * @param total 总数
     * @param parts 份数
     * @param seed  各端同步的共享种子
     */
    splitSeededRandom(total: number, parts: number, seed: number): number[] {
        const rng = this.mulberry32(seed);
        const result: number[] = new Array(parts).fill(0);
        
        // 将 total 个单位逐个随机分配到 parts 个桶中
        // 由于 rng 是确定性的，分配路径在所有端完全一致
        for (let i = 0; i < total; i++) {
            const bucket = Math.floor(rng() * parts);
            result[bucket]++;
        }
        
        return result;
    }



    private cancelSegmentPlan() {
        this.segmentQueue = [];
        if (this.segmentTimer) {
            this.unschedule(this.segmentTimer);
            this.segmentTimer = null;
        }
    }

    private buildDigitsFromTemplate(value?: string, numberValue?: number) {
        this.amountNode = this.amountNode || find('mask/Amount', this.node) || find('Amount', this.node);
        this.amountLabel = this.amountNode && this.amountNode.getComponent(Label);
        if (!this.amountNode || !this.amountLabel) {
            console.error('JackpotRoller need Amount node with Label');
            return;
        }

        const amountTrans = this.amountNode.getComponent(UITransform);
        const amountWidth = amountTrans ? amountTrans.contentSize.width : 310;
        this.digitHeight = this.amountLabel.lineHeight || this.amountLabel.fontSize || 50;

        const displayValue = value || this.formatValue(this.amountLabel.string);
        const displayNumber = numberValue != null ? numberValue : this.normalizeValue(displayValue);
        this.currentNumber = displayNumber;
        this.targetNumber = displayNumber;
        this.displayNumber = displayNumber;
        this.digitWidth = (amountWidth - this.digitGap * Math.max(0, displayValue.length - 1)) / displayValue.length;

        this.amountLabel.enabled = false;
        this.ensureMask();
        this.clearOldDigits();

        this.digitRoot = new Node('_JackpotRollerDigits');
        this.digitRoot.layer = this.amountNode.layer;
        this.digitRoot.parent = this.amountNode;
        this.digitRoot.setPosition(0, 0, 0);

        this.columns = [];
        const totalWidth = displayValue.length * this.digitWidth + Math.max(0, displayValue.length - 1) * this.digitGap;
        const beginX = -totalWidth / 2 + this.digitWidth / 2;

        for (let i = 0; i < displayValue.length; i++) {
            const digit = Number(displayValue[i]) || 0;
            const columnNode = new Node(`Digit_${i}`);
            columnNode.layer = this.amountNode.layer;
            columnNode.parent = this.digitRoot;
            columnNode.setPosition(beginX + i * (this.digitWidth + this.digitGap), 0, 0);

            const columnTrans = columnNode.addComponent(UITransform);
            columnTrans.setContentSize(this.digitWidth, this.digitHeight);

            const first = this.createDigitLabel(columnNode, digit, 0);
            const second = this.createDigitLabel(columnNode, (digit + 1) % 10, -this.digitHeight);
            this.columns.push({ labels: [first, second], baseDigit: digit });
        }
    }

    private rollTo(nextNumber: number) {
        const startNumber = this.displayNumber;
        const targetNumber = nextNumber;
        const digitCount = Math.max(
            this.minIntegerDigits,
            startNumber.toString().length,
            targetNumber.toString().length
        );
        const startValue = startNumber.toString().padStart(digitCount, '0');
        const targetValue = targetNumber.toString().padStart(digitCount, '0');
        const steps = this.getColumnSteps(startNumber, targetNumber, digitCount);

        this.stopRoll();
        this.targetNumber = targetNumber;
        this.buildDigitsFromTemplate(startValue);
        this.targetNumber = targetNumber;
        this.rollState = { ratio: 0 };

        tween(this.rollState)
            .to(this.rollDuration, { ratio: 1 }, {
                onUpdate: (target: { ratio: number }) => {
                    this.renderRoll(startNumber, steps, target.ratio);
                }
            })
            .call(() => {
                this.stopRoll();
                this.buildDigitsFromTemplate(targetValue, targetNumber);
            })
            .start();
    }

    private getColumnSteps(startNumber: number, targetNumber: number, digitCount: number): number[] {
        const steps: number[] = [];
        for (let i = 0; i < digitCount; i++) {
            const place = Math.pow(10, digitCount - i - 1);
            steps.push(Math.floor(targetNumber / place) - Math.floor(startNumber / place));
        }
        return steps;
    }

    private renderRoll(startNumber: number, steps: number[], ratio: number) {
        const totalNumber = this.targetNumber - startNumber;
        this.displayNumber = Math.floor(startNumber + totalNumber * ratio);
        for (let i = 0; i < this.columns.length; i++) {
            const column = this.columns[i];
            const labels = column.labels;
            const rollProgress = steps[i] * ratio;
            const completeSteps = Math.floor(rollProgress);
            const offset = (rollProgress - completeSteps) * this.digitHeight;
            const digit = (column.baseDigit + completeSteps) % 10;

            labels[0].value = digit;
            labels[0].label.string = digit.toString();
            labels[0].node.setPosition(labels[0].node.position.x, offset, labels[0].node.position.z);

            const nextDigit = (digit + 1) % 10;
            labels[1].value = nextDigit;
            labels[1].label.string = nextDigit.toString();
            labels[1].node.setPosition(labels[1].node.position.x, offset - this.digitHeight, labels[1].node.position.z);
        }
    }

    private stopRoll() {
        if (this.rollState) {
            Tween.stopAllByTarget(this.rollState);
            this.rollState = null;
        }
    }

    private onJackpotUpdate(event: string, value: number | string | JackpotUpdatePayload | { todayRevenue?: number }) {
        if (typeof value === 'object' && 'value' in value) {
            this.setValue(value.value, value.serverTime, !!value.force);
        } else if (typeof value === 'object') {
            this.setValue(value.todayRevenue || 0);
        } else {
            this.setValue(value);
        }
    }

    private normalizeValue(value: number | string): number {
        if (typeof value === 'string') {
            const parsed = Number(value.replace(/,/g, ''));
            if (isNaN(parsed) || !isFinite(parsed)) {
                return 0;
            }
            return Math.max(0, Math.floor(parsed));
        }

        if (isNaN(value) || !isFinite(value)) {
            return 0;
        }
        return Math.max(0, Math.floor(value));
    }

    private createDigitLabel(parent: Node, value: number, y: number): RollingDigitLabel {
        const labelNode = new Node(`Label_${value}`);
        labelNode.layer = this.amountNode.layer;
        labelNode.parent = parent;
        labelNode.setPosition(0, y, 0);

        const transform = labelNode.addComponent(UITransform);
        transform.setContentSize(this.digitWidth, this.digitHeight);

        const label = labelNode.addComponent(Label);
        label.string = '';
        this.copyLabelStyle(label);
        label.string = value.toString();

        return {
            node: labelNode,
            label: label,
            value: value
        };
    }

    private copyLabelStyle(label: Label) {
        label.font = this.amountLabel.font;
        label.useSystemFont = this.amountLabel.useSystemFont;
        label.fontFamily = this.amountLabel.fontFamily;
        label.fontSize = this.amountLabel.fontSize;
        label.lineHeight = this.amountLabel.lineHeight;
        label.color = this.amountLabel.color.clone();
        label.horizontalAlign = this.amountLabel.horizontalAlign;
        label.verticalAlign = this.amountLabel.verticalAlign;
        label.overflow = this.amountLabel.overflow;
        label.enableWrapText = false;
        label.spacingX = 0;
        label.cacheMode = this.amountLabel.cacheMode;
    }

    private ensureMask() {
        const maskNode = this.amountNode.parent || this.amountNode;
        let mask = maskNode.getComponent(Mask);
        if (!mask) {
            mask = maskNode.addComponent(Mask);
        }
        mask.enabled = true;
    }

    private clearOldDigits() {
        const oldRoot = this.amountNode.getChildByName('_JackpotRollerDigits');
        if (oldRoot) {
            oldRoot.removeFromParent();
            oldRoot.destroy();
        }
        this.columns = [];
    }

    private formatValue(value: number | string): string {
        const num = this.normalizeValue(value);
        return num.toString().padStart(this.minIntegerDigits, '0');
    }
}
