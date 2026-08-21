import { Singleton } from './Singleton';
export type ResCallback<T = any> = (data?: T) => void;
export type EventObject = { listener: any; handler: ResCallback };
type EventerDispatchers = Map<string, Array<EventObject>>;

/**
 * 事件分发
 */
export class Eventer extends Singleton<Eventer>() {
    /**事件分发数组 */
    private eventListeners: EventerDispatchers = null;

    /**
     * 构造函数
     */
    constructor() {
        super();
        this.eventListeners = new Map<string, Array<EventObject>>();
    }

    /**
     * 注册事件
     * @param msgId 事件号
     * @param cb 回调函数
     */
    public on(msgId: string,  cb: ResCallback, target?: any): void {
        if (!this.eventListeners.has(msgId)) {
            this.eventListeners.set(msgId, []);
        }
        this.eventListeners.get(msgId).push({ listener: target, handler: cb });
    }

    /**
     * 触发事件
     * @param data 事件体
     */
    public emit(eventName: string, data: any = null): void {
        if (!this.eventListeners.has(eventName)) {
            return;
        }

        let dispatchItems = this.eventListeners.get(eventName).concat();
        for (let i = 0; i < dispatchItems.length; ++i) {
            let dispatcherItem = dispatchItems[i];
            dispatcherItem.handler.call(dispatcherItem.listener, data);
        }
    }

    /**
     * 取消注册
     * @param msgId
     */
    public off(target: any): void {
        if (target) {
			this.eventListeners.forEach((v, k) => {
				for (var i = 0; i < v.length; i++) {
					if(v[i].listener == target) {
                        v.splice(i, 1);
						i--;
                    }
                }
            });
        }
    }

    /**
     * 取消注册
     * @param eventName
     * @param target
     */
    public offName(eventName: string, target?: any): void {
        if (this.eventListeners.has(eventName)) {
            if (target) {
                let handlers = this.eventListeners.get(eventName);
                for (let i = handlers.length - 1; i >= 0; i--) {
                    let handler = handlers[i];
                    if (handler.listener == target) {
                        handlers.splice(i, 1);
                    }
                }
            } else {
                this.eventListeners.delete(eventName);
            }
        }
    }
    /**
     * 取消注册
     * @param eventName
     * @param target
     */
    public offHandler(eventName: string, handler: ResCallback): void {
        if (this.eventListeners.has(eventName)) {
            for (let i = 0; i < this.eventListeners.get(eventName).length; ++i) {
                let dispatcherItem = this.eventListeners.get(eventName)[i];
                if (handler && dispatcherItem.handler == handler) {
                    this.eventListeners.get(eventName).splice(i, 1);
                }
            }
        }
    }

    /**
     * 取消注册所有
     */
    public offAll(): void {
        this.eventListeners.clear();
    }
}
