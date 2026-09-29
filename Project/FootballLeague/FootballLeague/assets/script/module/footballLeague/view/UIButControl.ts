import { _decorator, Component, Node } from 'cc';
import { GameGlobal } from '../../common/GameGlobal';
import { AudioPath } from '../WheelGlobal';
const { ccclass, property } = _decorator;

@ccclass('UIButControl')
export class UIButControl extends Component {

    //控制节点
    @property({type: Node, displayName: '控制节点'})
    public controlNode: Node = null;
    //关闭按钮
    @property({type: Node, displayName: '关闭按钮'})
    public closeBtnNode: Node = null;

    start() {
        //关闭按钮点击事件
        this.closeBtnNode.on(Node.EventType.TOUCH_START, this.onClickCloseBtn.bind(this))
        //自身点击事件 显示控制节点
        this.node.on(Node.EventType.TOUCH_START, this.onClickSelf.bind(this))
    }

    //自身点击事件 显示控制节点
    onClickSelf() {
        this.controlNode.active = true;
        //按钮音效
        GameGlobal.playAudio(AudioPath.Click);
    }

    //关闭按钮点击事件
    onClickCloseBtn() {
        this.controlNode.active = false;
        //按钮音效
        GameGlobal.playAudio(AudioPath.Click);
    }
}
