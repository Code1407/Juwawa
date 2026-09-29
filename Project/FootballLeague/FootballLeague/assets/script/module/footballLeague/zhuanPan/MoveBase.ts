import * as cc from "cc";
import { BezierCurveAnimation } from "./BezierCurveAnimation";
const { ccclass, property, requireComponent } = cc._decorator;

/** 运动组件基类 */
@ccclass
@requireComponent(BezierCurveAnimation)
export abstract class MoveBase extends cc.Component {
	/* --------------- 属性 --------------- */
	/** 当前下标变更事件 */
	@property({
		displayName: "当前下标变更事件",
		tooltip: "(当前下标_indexN, 上个下标_indexN, 跳过状态_jumpB)",
		type: cc.EventHandler,
	})
	indexChangeEvent = new cc.EventHandler();

	/** 结束事件 */
	@property({ displayName: "结束事件", type: cc.EventHandler })
	endEvent = new cc.EventHandler();

	/** 循环结束事件 */
	@property({ displayName: "循环结束事件", type: cc.EventHandler })
	loopEndEvent = new cc.EventHandler();

	/** 过渡结束事件 */
	@property({ displayName: "过渡结束事件", type: cc.EventHandler })
	transitionEndEvent = new cc.EventHandler();

	/* --------------- public --------------- */
	/** 曲线组件 */
	curveComp!: BezierCurveAnimation;
	/** 当前中心下标 */
	get currIndexN(): number {
		return this._currIndexN;
	}

	set currIndexN(valueN_) {
		this._setCurrIndexN(valueN_);
	}

	/* --------------- protected --------------- */
	/** 移动状态 */
	protected _moveB = false;
	/** 移动缓动 */
	protected _moveTween: cc.Tween<any> | null = null;
	/** 循环移动状态 */
	protected _loopRunB = false;
	/** 过渡移动状态 */
	protected _transitionRunB = false;
	/** 循环移动速度/秒 */
	protected _loopMoveSpeedN = 0;
	/** 当前过渡配置 */
	protected _transitionConfig?: MoveBase_.TransitionConfig;
	/** 当前移动配置 */
	protected _moveConfig?: MoveBase_.MoveConfig;
	/** 当前循环配置 */
	protected _loopConfig?: MoveBase_.LoopConfig;
	/** 跳过状态 */
	protected _jumpB = false;
	/** 上次曲线 Y */
	protected _lastCurveYN = 0;
	/** 当前下标 */
	protected _currIndexN!: number;
	/** 当前距离 */
	protected _currDistN = 0;
	/** 总距离 */
	protected _targetDistN = 0;
	/** 起始距离 */
	protected _startDistN = 0;

	/* ------------------------------- get/set ------------------------------- */
	protected _setCurrIndexN(valueN_: number): void {
		if (valueN_ === this._currIndexN) {
			return;
		}

		this.indexChangeEvent.emit([valueN_, this._currIndexN, this._jumpB]);
		this._currIndexN = valueN_;
		// logger.log('当前选中', this._currIndexN);
	}

	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		this._initData();
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化数据 */
	protected _initData(): void {
		this.curveComp = this.getComponent(BezierCurveAnimation)!;

		// 设置更新事件
		const updateEvent = new cc.EventHandler();

		updateEvent.component = cc.js.getClassName(this);
		updateEvent.handler = "_eventUpdate";
		updateEvent.target = this.node;
		this.curveComp.updateEventAS.push(updateEvent);

		// 设置结束事件
		const endEvent = new cc.EventHandler();

		endEvent.component = cc.js.getClassName(this);
		endEvent.handler = "_eventEnd";
		endEvent.target = this.node;
		this.curveComp.endEventAS.push(endEvent);
	}

	/** 运动 */
	protected abstract _move(valueN_: number): void;

	/** 获取当前下标 */
	protected abstract _getCurrIndex(): number;

	/** 获取移动距离 */
	protected abstract _getMoveDist(indexN_: number, scrollConfig_?: MoveBase_.MoveConfig): number;

	/**
	 * 过渡
	 * @param speedSN_ 目标速度/秒
	 * @param timeSN_ 过渡时间（秒）
	 * @param config_ 过渡配置
	 */
	transition(speedSN_: number, timeSN_: number, config_?: Partial<MoveBase_.TransitionConfig>): void {
		this._transitionConfig = new MoveBase_.TransitionConfig(config_);
		/** 缓动目标 */
		const target = { valueN: 0, lastValueN: 0 };
		/** 起始速度 */
		const startSpeedN = this._loopMoveSpeedN;

		// 停止移动
		this.stop();
		this._startDistN += this._currDistN;
		this._currDistN = 0;
		this._transitionRunB = true;

		// 过渡移动
		this._moveTween = cc
			.tween(target)
			.to(
				timeSN_,
				{ valueN: timeSN_ },
				{
					easing: this._transitionConfig.transitionF,
					onUpdate: (target: any, ratio) => {
						const speedN = startSpeedN + (speedSN_ - startSpeedN) * ratio!;
						const distN = (target.valueN - target.lastValueN) * speedN;

						this._move(distN);
						this._currDistN += distN;
						target.lastValueN = target.valueN;
						this.currIndexN = this._getCurrIndex();
					},
				}
			)
			.call(() => {
				this.currIndexN = this._getCurrIndex();
				this.stop();
			})
			.start();
	}

	/** 停止循环 */
	stop(): void {
		if (!this._moveTween) {
			return;
		}

		if (this._loopRunB) {
			this._loopConfig?.endCBF?.();
			this.loopEndEvent?.emit([this.loopEndEvent.customEventData]);
		}

		if (this._transitionRunB) {
			this._transitionConfig?.endCBF?.();
			this.transitionEndEvent?.emit([this.transitionEndEvent.customEventData]);
		}

		this._moveTween.stop();
		this._moveTween = null;
		this._transitionRunB = false;
		this._loopRunB = false;
		this._moveB = false;
	}

	/**
	 * 循环运动
	 * @param speedSN_ 速度/秒
	 * @param config_ 循环配置
	 */
	loop(speedSN_: number, config_?: MoveBase_.LoopConfig): void {
		if (this._moveB) {
			return;
		}

		this._moveB = true;
		this._startDistN += this._currDistN;
		this._currDistN = 0;
		this._loopRunB = true;
		this._loopMoveSpeedN = speedSN_;
		this._loopConfig = new MoveBase_.LoopConfig(config_);
		const target = { valueN: 0, lastValueN: 0 };

		if (!this._loopConfig.timeSN) {
			this._moveTween = cc
				.tween(target)
				.repeatForever(
					cc.tween().by(
						1,
						{
							valueN: 1,
						},
						{
							onUpdate: () => {
								if (!this.isValid) {
									return;
								}

								const distN = (target.valueN - target.lastValueN) * speedSN_;

								this._move(distN);
								this._currDistN += distN;
								target.lastValueN = target.valueN;
								this.currIndexN = this._getCurrIndex();
							},
						}
					)
				)
				.start();
		} else {
			this._moveTween = cc
				.tween(target)
				.by(
					this._loopConfig.timeSN,
					{
						valueN: this._loopConfig.timeSN,
					},
					{
						onUpdate: () => {
							if (!this.isValid) {
								return;
							}

							const distN = (target.valueN - target.lastValueN) * speedSN_;

							this._move(distN);
							this._currDistN += distN;
							target.lastValueN = target.valueN;
							this.currIndexN = this._getCurrIndex();
						},
					}
				)
				.call(() => {
					/** 误差距离 */
					const distN = this._loopConfig!.timeSN! * speedSN_ - this._currDistN;

					// 补齐误差距离
					if (distN !== 0) {
						this._move(distN);
						this._currDistN += distN;
						this.currIndexN = this._getCurrIndex();
					}

					this.stop();
				})
				.start();
		}
	}

	/**
	 * 跳转到指定下标
	 * @param indexN_ 目标下标
	 * @returns
	 */
	jump(indexN_: number): void {
		if (this._moveB && !this._loopRunB && !this._transitionRunB) {
			return;
		}

		this._moveB = true;
		this._jumpB = true;

		// 停止其他运动
		if (this._loopRunB || this._transitionRunB) {
			this.stop();
		}

		// 更新距离
		this._startDistN = 0;
		this._targetDistN = this._currDistN = this._getMoveDist(indexN_);

		// 直接跳转
		this._move(this._targetDistN);
		this.currIndexN = this._getCurrIndex();
		this._moveB = false;
		this._jumpB = false;
	}

	/**
	 * 移动
	 * @param indexN_ 目标下标
	 * @param config_ 运动配置
	 * @returns
	 */
	move(indexN_: number, config_?: MoveBase_.MoveConfig): void {
		if (this._moveB && !this._loopRunB && !this._transitionRunB) {
			return;
		}

		this._moveB = true;
		this._moveConfig = new MoveBase_.MoveConfig(config_);

		// 停止其他运动
		if (this._loopRunB || this._transitionRunB) {
			this.stop();
		}

		// 更新距离
		this._lastCurveYN = 0;
		this._startDistN += this._currDistN;
		this._currDistN = 0;
		this._targetDistN = this._getMoveDist(indexN_, this._moveConfig);

		// 开始缓动
		this._moveTween = this.curveComp.startTween(this._moveConfig.tweenIndexNS);
	}

	/** 获取运动速度 */
	getSpeed(indexN_: number, config_?: MoveBase_.MoveConfig): number {
		config_ = new MoveBase_.MoveConfig(config_);

		/** 目标距离 */
		const targetDistN = this._getMoveDist(indexN_, config_);
		/** 总时间 */
		let totalTimeSN = 0;

		if (config_.tweenIndexNS) {
			config_.tweenIndexNS.forEach((vN) => {
				totalTimeSN += this.curveComp.tweenUnitAS[vN].timeSN;
			});
		} else {
			this.curveComp.tweenUnitAS.forEach((v) => {
				totalTimeSN += v.timeSN;
			});
		}

		return targetDistN * this.curveComp.getCurveY(cc.game.deltaTime / totalTimeSN, config_.tweenIndexNS) * (1 / cc.game.deltaTime);
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	protected _eventUpdate(yN_: number, indexN_: number): void {
		const moveDistN = this._targetDistN * (yN_ - this._lastCurveYN);

		this._currDistN += moveDistN;
		this._move(moveDistN);
		this._lastCurveYN = yN_;
		this.currIndexN = this._getCurrIndex();
		// cc.log('缓动更新', yN_, indexN_, y2N_, yN_ - this._lastCurveYN);
	}

	protected _eventEnd(): void {
		// 更新至终点
		const moveDistN = this._targetDistN - this._currDistN;

		this._currDistN += moveDistN;
		this._move(this._targetDistN - this._currDistN);
		this.currIndexN = this._getCurrIndex();

		// 更新状态
		this._moveB = false;
		this.endEvent.emit([]);
		this._moveConfig?.endCBF?.();
		// cc.log('缓动结束');
	}
}

export namespace MoveBase_ {
	/** 过渡配置 */
	export class TransitionConfig {
		constructor(init_?: Partial<TransitionConfig>) {
			Object.assign(this, init_);
		}

		/** 过渡函数 */
		transitionF = cc.easing.linear;
		/** 结束回调 */
		endCBF?: () => void;
	}

	/** 循环配置 */
	export class LoopConfig {
		constructor(init_?: MoveConfig) {
			Object.assign(this, init_);
		}

		/** 时间（秒） */
		timeSN?: number;
		/** 结束回调 */
		endCBF?: () => void;
	}

	/** 运动配置 */
	export class MoveConfig {
		constructor(init_?: MoveConfig) {
			Object.assign(this, init_);
		}

		/** 缓动队列 */
		tweenIndexNS?: number[];
		/** 结束回调 */
		endCBF?: () => void;
	}
}
