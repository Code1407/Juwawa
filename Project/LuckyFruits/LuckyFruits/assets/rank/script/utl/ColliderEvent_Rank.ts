const { ccclass, property } = cc._decorator;
export let CollidorEventType = {
    /**只在两个碰撞体开始接触时被调用一次*/
    onBeginContact: `onBeginContact`,
    /**只在两个碰撞体结束接触时被调用一次*/
    onEndContact: `onEndContact`,
    /**每次将要处理碰撞体接触逻辑时被调用*/
    onPreSolve: `onPreSolve`,
    /**每次处理完碰撞体接触逻辑时被调用*/
    onPostSolve: `onPostSolve`,
}
@ccclass
export default class CollidorEvent extends cc.Component {
    objs_onBeginContact: cc.Node[] = [];
    objs_onEndContact: cc.Node[] = [];
    objs_onPreSolve: cc.Node[] = [];
    objs_onPostSolve: cc.Node[] = [];
    onBeginContact(contact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        this.objs_onBeginContact.push(otherCollider.node);
    }

    onEndContact(contact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        this.objs_onEndContact.push(otherCollider.node);
    }

    onPreSolve(contact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        this.objs_onPreSolve.push(otherCollider.node);
    }

    onPostSolve(contact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        this.objs_onPostSolve.push(otherCollider.node);
    }
    protected update(dt: number): void {
        if (this.objs_onBeginContact.length > 0) {
            if (this.node.hasEventListener(CollidorEventType.onBeginContact))
                this.node.emit(CollidorEventType.onBeginContact, this.objs_onBeginContact);
            this.objs_onBeginContact = [];
        }
        if (this.objs_onEndContact.length > 0) {
            if (this.node.hasEventListener(CollidorEventType.onEndContact))
                this.node.emit(CollidorEventType.onEndContact, this.objs_onEndContact);
            this.objs_onEndContact = [];
        }
        if (this.objs_onPreSolve.length > 0) {
            if (this.node.hasEventListener(CollidorEventType.onPreSolve))
                this.node.emit(CollidorEventType.onPreSolve, this.objs_onPreSolve);
            this.objs_onPreSolve = [];
        }
        if (this.objs_onPostSolve.length > 0) {
            if (this.node.hasEventListener(CollidorEventType.onPostSolve))
                this.node.emit(CollidorEventType.onPostSolve, this.objs_onPostSolve);
            this.objs_onPostSolve = [];
        }
    }
}
