// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass } = cc._decorator;

@ccclass
export default class ScreenAdapter extends cc.Component {
  onLoad() {
    //找到 Canvas 组件
    var cavas = cc.find('Canvas');
    //获取当前视图的设计分辨率
    var DesignSize = cc.view.getDesignResolutionSize();
    //获取屏幕的宽度高度，也就是实际设备的分辨率
    var FrameSize = cc.view.getFrameSize();
    cc.log("getFrameSize:" + FrameSize.toString())

    //      cavas.scaleX = Math.min(FrameSize.width / DesignSize.width, 1);
    //      cavas.scaleY = cavas.scaleX;

    cc.view.setResizeCallback(this.onResize.bind(this));
  }

  onResize() {
    var FrameSize = cc.view.getFrameSize();
    cc.log("getFrameSize:" + FrameSize.toString())
  }

  update(dt) {
  }
}