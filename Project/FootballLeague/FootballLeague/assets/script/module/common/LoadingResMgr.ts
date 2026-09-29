import { oops } from "db://oops-framework/core/Oops";
import { BundleName, LoadStep } from "../../framework/commom/FrameDefine";
import { EventMessage } from "db://oops-framework/core/common/event/EventMessage";
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

class LoadingResMgr {
    private loadParms: { step: LoadStep, progress: number } = { step: LoadStep.Config, progress: 0 };
    private initMgrFunc: any = null;

    async init(initMgrFunc): Promise<boolean> {
        this.initMgrFunc = initMgrFunc;
        this.loadParms = { step: LoadStep.Config, progress: 0 };
        try {
            this.loadParms.progress = this.getMaxProByStep(this.loadParms.step);
            oops.message.dispatchEvent(EventMessage.GAME_LOAD_STEP, this.loadParms);
            await this.loadConfig();
            this.loadParms.step += 1;
            await this.loadResources(BundleName.Common);
            await this.loadResources(BundleName.SkinDefault);

            oops.log.logView("All resources load success");
            return true;
        } catch (error) {
            oops.log.logView(`Resources load fail 【${error.message}】`);
            return false;
        }
    }

    private async loadConfig() {
        await JsonUtil.loadDirAsync();
        return await this.loadLanConfig();
    }

    private async loadLanConfig(): Promise<boolean> {
        oops.language.init();
        return new Promise((resolve, reject) => {
            let lan = oops.network.getLang();
            oops.language.setLanguage(lan, async (success) => {
                if (success) {
                    resolve(true);
                }
                else {
                    resolve(false);
                    console.error("Language load fail:%s", lan);
                }
            })
        });
    }

    async loadResources(bundleName: string) {
        const bundle = await oops.res.loadBundle(bundleName);
        if (bundle) {
            return new Promise((resolve) => {
                bundle.loadDir("resources", this.onProgress.bind(this), (err: Error | null) => {
                    if (err) {
                        oops.log.logView(`【${bundleName}】res load fail 【${err.message}】`);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        }
        else {
            oops.log.logView(`【${bundleName}】is nil`);
            return false;
        }
    }

    private onProgress(current: number, total: number): void {
        let progress = current / total;

        let preProgress = this.getMaxProByStep(this.loadParms.step - 1);
        let curProgress = this.getMaxProByStep(this.loadParms.step);
        let maxProgress = curProgress - preProgress;
        this.loadParms.progress = preProgress + maxProgress * progress;
        oops.message.dispatchEvent(EventMessage.GAME_LOAD_STEP, this.loadParms);
        if (progress >= 1) {
            this.loadParms.step += 1;
            if (this.loadParms.step == LoadStep.Network) {
                if (this.initMgrFunc) {
                    this.initMgrFunc();
                }
                this.loadParms.progress = this.getMaxProByStep(this.loadParms.step);
                oops.message.dispatchEvent(EventMessage.GAME_LOAD_STEP, this.loadParms);
            }
        }
    }

    getMaxProByStep(step: LoadStep) {
        switch (step) {
            case LoadStep.Config:
                return 0.19;
            case LoadStep.Common:
                return 0.53;
            case LoadStep.GameRes:
                return 0.85;
            case LoadStep.Network:
                return 0.94;
            case LoadStep.Finish:
                return 1;
        }
    }

}

export default new LoadingResMgr();
