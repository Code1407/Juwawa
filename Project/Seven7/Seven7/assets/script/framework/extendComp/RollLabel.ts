import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RollLabel')
export class RollLabel extends Component {
    private _endValue = 0;  //最终值
    private _startValue = 0; //开始值
    private _duration = 1000;  //时长1000ms
    private _curTime = 0;   //当前时间 ms
    private _tempValue = 0; //开始值
    private _isRolling = false;  //是否在滚动
    private toFixed = 2;

    private textLb: Label = null;

    onLoad() {
        this.textLb = this.getComponent(Label);
    }

    public setValue(value: number) {
        this.textLb.string = value.toLocaleString('en-US');
    }

    /**
    * 数值滚动
    * @param num 值
    * @param isRoll 是否滚动，默认是，否则直接增加
    * @param duration 时间长度 ms
    */
    public startRoll(startValue: number = 0, endValue: number, duration?: number, toFixed: number = 2) {
        this._curTime = 0;
        this._duration = duration;

        this._startValue = startValue;
        this._endValue = endValue;
        this.toFixed = toFixed;
        this._isRolling = true;
    }

    update(deltaTime: number) {
        if (!this._isRolling) {
            return;
        }
        this._curTime += deltaTime * 1000;
        let rate = this._curTime / this._duration;
        if (rate >= 1) {
            this.textLb.string = this.formatNumber(this._endValue, this.toFixed); //停止滚动
            this._isRolling = false;
            return;
        }
        this._tempValue = this._startValue + rate * (this._endValue - this._startValue);
        this.textLb.string = this.formatNumber(this._tempValue, this.toFixed);
    }

    /**
     * 格式化数字：固定小数位 + 英文千分位
     * @param num 要格式化的数字
     * @param decimalDigits 小数位数（默认0，自动修正为非负数）
     * @returns 格式化后的千分位字符串
     */
    formatNumber(num: number, decimalDigits: number = 0) {
        if (isNaN(num) || !isFinite(num)) {
            return '0';
        }

        const safeDigits = Math.max(0, Math.floor(decimalDigits));
        return num.toLocaleString('en-US', {
            minimumFractionDigits: safeDigits, // 最少小数位
            maximumFractionDigits: safeDigits  // 最多小数位（和最少一致，即固定位数）
        });
    }
}


