import { Component, _decorator } from "cc";
import { LanguageLabel } from "../../../libs/gui/language/LanguageLabel";
import { oops } from "../../Oops";
import { Sprite } from "cc";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { BundleName } from "db://assets/script/framework/commom/FrameDefine";
import { Label } from "cc";

const { ccclass, property } = _decorator;

/** 公共提示窗口 */
@ccclass("CommonPrompt")
export class CommonPrompt extends GameComponent {
    /** 窗口标题多语言组件 */
    @property(LanguageLabel)
    private lab_title: LanguageLabel | null = null;

    /** 提示内容多语言组件 */
    @property(Label)
    private lab_content: Label | null = null;

    /** 确认按钮文本多语言组件 */
    @property(LanguageLabel)
    private lab_ok: LanguageLabel | null = null

    /** 取消按钮文本多语言组件 */
    @property(LanguageLabel)
    private lab_cancel: LanguageLabel | null = null;

    @property(Sprite)
    private img_tip: Sprite | null = null;

    private config: any = {};

    /**
     * 
     * 
     * @param params 参数 
     * {
     *     title:      标题
     *     content:    内容
     *     okWord:     ok按钮上的文字
     *     okFunc:     确认时执行的方法
     *     cancelWord: 取消按钮的文字
     *     cancelFunc: 取消时执行的方法
     *     needCancel: 是否需要取消按钮
     * }
     */
    onAdded(params: any): boolean {
        this.config = params || {};
        this.setTitle();
        this.setIcon();
        this.setContent();
        this.setBtnOkLabel();
        this.setBtnCancelLabel();
        this.node.active = true;
        return true;
    }

    private setTitle() {
        this.lab_title!.dataID = this.config.title;
    }

    private setIcon() {
        if (this.config.iconPath) {
            super.setSprite(this.img_tip, this.config.iconPath, BundleName.Common);
        }
    }


    private setContent() {
        this.lab_content.string = this.config.content;
    }

    private setBtnOkLabel() {
        this.lab_ok!.dataID = this.config.okWord;
    }

    private setBtnCancelLabel() {
        if (this.lab_cancel) {
            this.lab_cancel.dataID = this.config.cancelWord;
            this.lab_cancel.node.parent!.active = this.config.needCancel || false;
        }
    }

    private onOk() {
        if (typeof this.config.okFunc == "function") {
            this.config.okFunc();
        }
        if (this.config.okAndClose == false) {
            return
        }
        this.close();
    }

    private onClose() {
        if (typeof this.config.closeFunc == "function") {
            this.config.closeFunc();
        }
        this.close();
    }

    private onCancel() {
        if (typeof this.config.cancelFunc == "function") {
            this.config.cancelFunc();
        }
        this.close();
    }

    private close() {
        oops.gui.removeByNode(this.node);
    }

    onDestroy() {
        this.config = null;
    }
}