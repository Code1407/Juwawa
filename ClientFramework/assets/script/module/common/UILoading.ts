import { _decorator, find, ProgressBar, Label, resources } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent"
import { oops } from "db://oops-framework/core/Oops";
import { Utils } from '../../framework/utils/Utils';
import { JsonAsset } from 'cc';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { LoadStep } from '../../framework/commom/FrameDefine';
import { UIID } from '../common/GameUIConfig';
import GameModelMgr from '../mvc/GameModelMgr';
const { ccclass, property } = _decorator;

@ccclass('UILoading')
export class UILoading extends GameComponent {
    private progressBar: ProgressBar = null;
    private lab_progress: Label = null;
    private lab_desc: Label = null;
    private showStep: LoadStep = LoadStep.None;
    private loadStep: LoadStep = LoadStep.None;
    private showProgress: number = 0;
    private loadProgress: number = 0;
    private loadingComplete = false;

    private config_name = "LanguageInit";
    private cfgLang: any = null;
    private lang: string;

    private loadTipsMap: Map<LoadStep, string> = new Map([
        [LoadStep.Config, "common_load_config"],
        [LoadStep.Common, "common_load_resources"],
        [LoadStep.GameRes, "common_load_resources"],
        [LoadStep.Network, "common_load_network"],
    ])

    onLoad(): void {
        this.progressBar = find("progress", this.node).getComponent(ProgressBar);
        this.lab_progress = find("progress/lab_progress", this.node).getComponent(Label);
        this.lab_desc = find("progress/lab_desc", this.node).getComponent(Label);
        this.lab_progress.string = "";
        this.lab_desc.string = "";

        this.initConfig();

        this.on(EventMessage.GAME_LOAD_STEP, this.updateLoadingStep, this);
    }

    private async initConfig() {
        this.lang = Utils.getQuery("lang") || "en";
        resources.load(this.config_name, JsonAsset, (err, config) => {
            if (err) {
                this.initConfig().then();
                return;
            }
            this.cfgLang = config;
        });
    }

    private getLang(langKey: string): any {
        if (!langKey && langKey == undefined && langKey == "") {
            return "";
        }
        if (!this.cfgLang || !this.cfgLang.json || !this.cfgLang.json[langKey]) {
            return "";
        }
        let lanJson = this.cfgLang.json[langKey];
        for (const [key, value] of Object.entries(lanJson)) {
            let lan = key.toLocaleLowerCase();
            if (lan == this.lang) {
                return value;
            }
        }
        return "";
    }

    update(): void {
        if (this.loadingComplete) {
            return;
        }

        let isNetReady = GameModelMgr.playerModel != null && GameModelMgr.playerModel.check_login_game_suc() || false;
        let targetProgress = isNetReady ? this.loadProgress : Math.min(this.loadProgress, 0.99);

        if (this.showProgress < targetProgress) {
            this.showProgress += 0.05;
            if (this.showProgress >= targetProgress) {
                this.showProgress = targetProgress;
            }
        }

        this.progressBar.progress = this.showProgress;
        this.lab_progress.string = (this.showProgress * 100).toFixed(2) + "%";

        if (this.showStep == LoadStep.Network && !this.loadingComplete) {
            if (isNetReady) {
                this.showStep = LoadStep.Finish;
                this.loadProgress = 1;
            }
        }

        if (this.showProgress >= 1 && isNetReady && !this.loadingComplete) {
            this.loadingComplete = true;
            this.onLoadingComplete();
        }
    }

    private updateLoadingStep(event: string, args: any) {
        this.loadStep = args.step;
        this.loadProgress = args.progress;

        if (this.showStep != this.loadStep) {
            this.showStep = this.loadStep;
            let lankey = this.loadTipsMap.get(this.loadStep);
            let desc = this.getLang(lankey);
            this.lab_desc.string = desc;
            if (desc == "") {
                console.log("load lang is nil:%s-%s", lankey, this.lang);
            }
        }
    }

    private async onLoadingComplete() {
        this.loadingComplete = true;
        //打开自己要打开的UI
        //await oops.gui.openAsync(UIID.Seven7UI_Main);
        oops.gui.remove(UIID.Loading);
    }

    protected onDestroy() {
        super.onDestroy();
        resources.release(this.config_name);
    }
}


