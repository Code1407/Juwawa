import { delay } from "../GlobalModules";

const { ccclass, property } = cc._decorator;

@ccclass
export default class hideHGLogo extends cc.Component {
    async start() {
        if ((<any>window).hideHGLogo) {
            this.node.active = false;
            return;
        }
        while ((<any>window).config == null) {
            await delay(200);
        }
        if (cc.sys.platform == cc.sys.WECHAT_GAME) {
            this.node.active = false;
            return;
        }
        console.log("sdkName", (<any>window).config.sdkName);
        if ((<any>window).config?.appExtra?.hideHGLogo) {
            this.node.active = false;
            return;
        }
    }
}
