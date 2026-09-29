import * as cc from "cc";
import { MoveBase, MoveBase_ } from "./MoveBase";
const { ccclass, property, requireComponent } = cc._decorator;

namespace _RotatingLottery {
	/** 方向 */
	export enum Direction {
		顺时针,
		逆时针,
	}
}

/** 旋转抽奖 */
@ccclass
export class RotatingLottery extends MoveBase {
	/* --------------- 属性 --------------- */
	/** 方向 */
	@property({
		displayName: "方向",
		type: cc.Enum(_RotatingLottery.Direction),
	})
	dire = _RotatingLottery.Direction.顺时针;

	/** 旋转指针 */
	@property({ displayName: "旋转指针" })
	rotateArrowB = false;

	/** 旋转对象 */
	@property({ displayName: "旋转对象", type: cc.Node })
	rotateNode: cc.Node = null!;

	/** 内容容器 */
	@property({ displayName: "内容容器", type: cc.Node })
	contentNode: cc.Node = null!;

	/* --------------- private --------------- */
	/** 内容角度区间 */
	private _contentAngleNs: number[] = [];
	/** 特殊角度下标 */
	private _specialAngleIndexN!: number;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		super.onLoad();
		this._initEvent();
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化事件 */
	private _initEvent(): void {
		this.node.on(cc.Node.EventType.CHILD_ADDED, this._nodeChildAdded, this);
		this.node.on(cc.Node.EventType.CHILD_REMOVED, this._nodeChildRemoved, this);
	}

	/** 更新角度区间 */
	private _updateAngleRange(): void {
		let leftNode: cc.Node;
		let rightNode: cc.Node;

		this.contentNode.children.forEach((v, kN) => {
			// 获取左右节点
			leftNode = this.contentNode.children[kN + 1 === this.contentNode.children.length ? 0 : kN + 1];
			rightNode = this.contentNode.children[kN - 1 < 0 ? this.contentNode.children.length - 1 : kN - 1];

			// 获取当前节点最大角度
			if (leftNode.angle < v.angle) {
				this._contentAngleNs[kN] = v.angle + Math.min((360 + leftNode.angle - v.angle) * 0.5, (v.angle - rightNode.angle) * 0.5);
			} else if (v.angle > rightNode.angle) {
				this._contentAngleNs[kN] = v.angle + Math.min((leftNode.angle - v.angle) * 0.5, (v.angle - rightNode.angle) * 0.5);
			} else {
				this._specialAngleIndexN = kN;
				this._contentAngleNs[kN] = v.angle + Math.min((leftNode.angle - v.angle) * 0.5, (v.angle + (360 - rightNode.angle)) * 0.5);
			}
		});
	}

	/** 重置 */
	private _reset(): void {
		this._updateAngleRange();
	}

	/** 初始化数据 */
	protected _initData(): void {
		super._initData();
		this._updateAngleRange();
	}

	/** 运动 */
	protected _move(valueN_: number): void {
		this.rotateNode.angle += valueN_;
	}

	/** 获取当前下标 */
	protected _getCurrIndex(): number {
		let angleN = this.rotateNode.angle % 360;

		if (angleN < 0) {
			angleN += 360;
		}

		let resultN: number | undefined;

		for (let kN = 0, lenN = this._contentAngleNs.length; kN < lenN; ++kN) {
			if (angleN < this._contentAngleNs[kN]) {
				resultN = kN;
				break;
			}
		}

		if (resultN === undefined) {
			resultN = this._specialAngleIndexN;
		}

		if (!this.rotateArrowB) {
			resultN = this._contentAngleNs.length - 1 - resultN;
		}

		return resultN;
	}

	protected _getMoveDist(indexN_: number, scrollConfig_?: RotatingLottery_.ScrollConfig): number {
		/** 目标节点角度 */
		const targetNodeAngleN = this.contentNode.children[indexN_].angle;
		/** 旋转节点角度 */
		const rotateNodeAngleN = (this.rotateNode.angle %= 360);
		/** 目标角度 */
		let targetAngleN: number;

		// 计算最终角度
		if (this.dire === _RotatingLottery.Direction.顺时针) {
			// 旋转指针
			if (this.rotateArrowB) {
				targetAngleN = -(360 - targetNodeAngleN) - rotateNodeAngleN;
				if (targetAngleN > rotateNodeAngleN) {
					targetAngleN -= 360;
				}
			}
			// 旋转转盘
			else {
				targetAngleN = -targetNodeAngleN - rotateNodeAngleN;
				if (targetAngleN > rotateNodeAngleN) {
					targetAngleN -= 360;
				}
			}

			targetAngleN %= 360;

			// 添加圈数
			if (!this._jumpB && scrollConfig_) {
				targetAngleN -= scrollConfig_.turnN! * 360;
				targetAngleN += scrollConfig_.offsetAngleN!;
			}
		} else {
			// 旋转指针
			if (this.rotateArrowB) {
				targetAngleN = targetNodeAngleN - rotateNodeAngleN;
				if (targetAngleN < rotateNodeAngleN) {
					targetAngleN += 360;
				}
			}
			// 旋转转盘
			else {
				targetAngleN = 360 - targetNodeAngleN - rotateNodeAngleN;
				if (targetAngleN < rotateNodeAngleN) {
					targetAngleN += 360;
				}
			}

			targetAngleN %= 360;

			// 添加圈数
			if (!this._jumpB && scrollConfig_) {
				targetAngleN += scrollConfig_.turnN! * 360;
				targetAngleN += scrollConfig_.offsetAngleN!;
			}
		}

		return targetAngleN;
	}

	loop(speedN_: number, config_?: MoveBase_.LoopConfig): void {
		if (this.dire === _RotatingLottery.Direction.顺时针) {
			speedN_ = -speedN_;
		}

		super.loop(speedN_, config_);
	}

	move(indexN_: number, scrollConfig_?: RotatingLottery_.ScrollConfig): void {
		super.move(indexN_, new RotatingLottery_.ScrollConfig(scrollConfig_));
	}

	getSpeed(indexN_: number, config_?: RotatingLottery_.ScrollConfig): number {
		return super.getSpeed(indexN_, new RotatingLottery_.ScrollConfig(config_));
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	private _nodeChildAdded(): void {
		this._reset();
	}

	private _nodeChildRemoved(): void {
		this._reset();
	}
}

export namespace RotatingLottery_ {
	/** 方向 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const Direction = _RotatingLottery.Direction;
	/** 方向 */
	export type Direction = _RotatingLottery.Direction;

	/** 滚动配置 */
	export class ScrollConfig extends MoveBase_.MoveConfig {
		constructor(init_?: ScrollConfig) {
			super(init_);
			Object.assign(this, init_);
		}

		/** 圈数 */
		turnN? = 1;
		/** 偏移角度 */
		offsetAngleN? = 0;
	}
}
