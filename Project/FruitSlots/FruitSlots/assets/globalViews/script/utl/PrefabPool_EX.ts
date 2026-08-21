import { GameDelay } from "./CCAsync_EX";

export class NodePool {
    static prefabToPool: Map<cc.Node, cc.Node[]> = new Map();
    static InstanceToPrefab: Map<cc.Node, cc.Node> = new Map();
    static Spawn(prefab: cc.Node, onCreate?: (ins: cc.Node) => void): cc.Node {
        if (!this.prefabToPool.has(prefab)) {
            this.prefabToPool.set(prefab, []);
        }
        if (this.prefabToPool.get(prefab).length > 0) {
            let result = this.prefabToPool.get(prefab).shift();
            this.InstanceToPrefab.set(result, prefab);
            result.active = true;
            result.setParent(prefab.parent);
            result.setSiblingIndex(prefab.parent.children.length - 1);
            return result;
        }
        else {
            let result = cc.instantiate(prefab);
            this.InstanceToPrefab.set(result, prefab);
            result.active = true;
            result.setParent(prefab.parent);
            result.setSiblingIndex(prefab.parent.children.length - 1);
            onCreate?.(result);
            return result;
        }
    }
    static Recycle(instance: cc.Node) {
        if (this.InstanceToPrefab.has(instance)) {
            let ary = this.prefabToPool.get(this.InstanceToPrefab.get(instance));
            if (!ary.includes(instance)) {
                ary.push(instance);
                this.InstanceToPrefab.delete(instance);
                instance.active = false;
            }
            else {
                console.error("Duplice!");
            }
        }
    }
}

export async function DelayRecycle(ins: cc.Node, sec: number) {
    await GameDelay(ins, sec);
    NodePool.Recycle(ins);
}
export async function DelayDestroy(ins: cc.Node, sec: number) {
    await GameDelay(ins, sec);
    ins.destroy();
}