import { _decorator, instantiate, Node, Sprite, UITransform, tween, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

export function flyIcon(
    fromNode: Node,
    toNode: Node,
    iconSprite: SpriteFrame,
    template: Node,
    container: Node,
    frequency: number = 1,
    interval: number = 150,
    speed: number = 1500,
) {
    if (
        frequency <= 0 ||
        !fromNode?.isValid ||
        !toNode?.isValid ||
        !template?.isValid ||
        !container?.isValid
    ) {
        return;
    }

    const fromParent = fromNode.parent;
    const toParent = toNode.parent;

    if (!fromParent || !toParent) return;

    const fromParentTrans = fromParent.getComponent(UITransform);
    const toParentTrans = toParent.getComponent(UITransform);
    const containerTrans = container.getComponent(UITransform);

    if (!fromParentTrans || !toParentTrans || !containerTrans) return;

    const playOnce = () => {
        if (
            !fromNode?.isValid ||
            !toNode?.isValid ||
            !template?.isValid ||
            !container?.isValid
        ) {
            return;
        }

        const flyNode = instantiate(template);
        const sprite = flyNode.getComponent(Sprite);
        if (!sprite) {
            flyNode.destroy();
            return;
        }

        sprite.spriteFrame = iconSprite;
        container.addChild(flyNode);
        flyNode.active = true;

        // 起点：fromNode 坐标 -> 世界坐标 -> container 本地坐标
        const fromWorldPos = fromParentTrans.convertToWorldSpaceAR(fromNode.position);
        const fromLocalPos = containerTrans.convertToNodeSpaceAR(fromWorldPos);

        // 终点：toNode 坐标 -> 世界坐标 -> container 本地坐标
        const toWorldPos = toParentTrans.convertToWorldSpaceAR(toNode.position);
        const toLocalPos = containerTrans.convertToNodeSpaceAR(toWorldPos);

        flyNode.setPosition(fromLocalPos);

        const dx = toLocalPos.x - fromLocalPos.x;
        const dy = toLocalPos.y - fromLocalPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const flyTime = distance / speed;

        tween(flyNode)
            .to(flyTime, { position: toLocalPos }, { easing: "quadOut" })
            .call(() => {
                if (flyNode.isValid) {
                    flyNode.destroy();
                }
            })
            .start();
    };

    for (let i = 0; i < frequency; i++) {
        if (i === 0) {
            playOnce();
        } else {
            setTimeout(() => {
                playOnce();
            }, i * interval);
        }
    }
}



