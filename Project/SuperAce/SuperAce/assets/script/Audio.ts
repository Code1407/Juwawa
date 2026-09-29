// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { gGameData } from "./GameData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Audio extends cc.Component {

    @property(cc.AudioSource)
    bgm: cc.AudioSource = null;

    @property(cc.AudioSource)
    click: cc.AudioSource = null;

    @property(cc.AudioSource)
    draw: cc.AudioSource = null;

    @property(cc.AudioSource)
    add: cc.AudioSource = null;

    @property(cc.AudioSource)
    spinClick: cc.AudioSource = null;

    @property(cc.AudioSource)
    eliminate: cc.AudioSource = null;

    @property(cc.AudioSource)
    break: cc.AudioSource = null;

    @property(cc.AudioSource)
    fly: cc.AudioSource = null;

    @property(cc.AudioSource)
    freeStart: cc.AudioSource = null;

    @property(cc.AudioSource)
    changeGolden: cc.AudioSource = null;

    @property(cc.AudioSource)
    freeEnd: cc.AudioSource = null;

    @property(cc.AudioSource)
    free: cc.AudioSource = null;

    @property(cc.AudioSource)
    freeBgm: cc.AudioSource = null;

    @property(cc.AudioSource)
    copyWildStart: cc.AudioSource = null;

    @property(cc.AudioSource)
    copyWildEnd: cc.AudioSource = null;

    @property(cc.AudioSource)
    scatterWait: cc.AudioSource = null;

    @property(cc.AudioSource)
    results: cc.AudioSource[] = [];

    @property(cc.AudioSource)
    rates1: cc.AudioSource[] = [];

    @property(cc.AudioSource)
    rates2: cc.AudioSource[] = [];

    @property(cc.AudioSource)
    scatters: cc.AudioSource[] = [];

    @property(cc.AudioSource)
    multipleBars: cc.AudioSource[] = [];

    @property(cc.AudioSource)
    winViews: cc.AudioSource[] = [];

    audioOn: boolean = true;
    ids: number[][] = [];
    Volume: number = 1;
    scatterNum: number = 0;
    static instance: Audio = null;

    static get Instance() {
        if (!this.instance) this.instance = cc.find("Audio").getComponent(Audio);
        return this.instance;
    }

    set volume(value: number) {
        this.Volume = value;
        if(value > 0) {
            this.audioOn = true;
            if(this.ids[0].length == 0) this.playBgm();
        }
        else {
            this.audioOn = false;
        }
        gGameData.soundVol = value;
        for(let i = 0; i < this.ids.length; i++){
            for(let j = 0; j < this.ids[i].length; j++){
                cc.audioEngine.setVolume(this.ids[i][j], value);
            }
        }
    }

    playBgm() {
        this.stopBgm();
        if (this.audioOn){
            let bgmId = cc.audioEngine.playEffect(this.bgm.clip, true);
            cc.audioEngine.setVolume(bgmId, this.Volume);
            this.ids[0].push(bgmId);
        }
    }

    playClick() {
        this.ids[1] = [];
        if (this.audioOn){
            let clickId = cc.audioEngine.playEffect(this.click.clip, false);
            cc.audioEngine.setVolume(clickId, this.Volume);
            this.ids[1].push(clickId);
        }
    }

    playDraw() {
        let duration = 0
        if (this.audioOn && this.ids[2].length == 0){
            let drawId = cc.audioEngine.playEffect(this.draw.clip, false);
            duration = this.draw.clip.duration;
            cc.audioEngine.setVolume(drawId, this.Volume);
            this.ids[2].push(drawId);
        }
        setTimeout(() => {
            this.ids[2] = [];
        }, duration * 1000);
    }

    playAdd() {
        let duration = 0
        if (this.audioOn && this.ids[3].length == 0){
            let addId = cc.audioEngine.playEffect(this.add.clip, false);
            duration = this.add.clip.duration;
            cc.audioEngine.setVolume(addId, this.Volume);
            this.ids[3].push(addId);
        }
        setTimeout(() => {
            this.ids[3] = [];
        }, duration * 1000);
    }

    playSpinClick() {
        this.ids[4] = [];
        if (this.audioOn){
            let spinClickId = cc.audioEngine.playEffect(this.spinClick.clip, false);
            cc.audioEngine.setVolume(spinClickId, this.Volume);
            this.ids[4].push(spinClickId);
        }
    }

    playBreak() {
        let duration = 0
        if (this.audioOn && this.ids[5].length == 0){
            let breakId = cc.audioEngine.playEffect(this.break.clip, false);
            duration = this.break.clip.duration;
            cc.audioEngine.setVolume(breakId, this.Volume);
            this.ids[5].push(breakId);
        }
        setTimeout(() => {
            this.ids[5] = [];
        }, duration * 1000);
    }

    playFreeStart() {
        this.ids[7] = [];
        if (this.audioOn){
            let freeStartId = cc.audioEngine.playEffect(this.freeStart.clip, false);
            cc.audioEngine.setVolume(freeStartId, this.Volume);
            this.ids[7].push(freeStartId);
        }
    }

    playFly() {
        this.ids[8] = [];
        if (this.audioOn){
            let flyId = cc.audioEngine.playEffect(this.fly.clip, false);
            cc.audioEngine.setVolume(flyId, this.Volume);
            this.ids[8].push(flyId);
        }
    }

    playChangeGolden() {
        this.ids[9] = [];
        if (this.audioOn){
            let changeGoldenId = cc.audioEngine.playEffect(this.changeGolden.clip, false);
            cc.audioEngine.setVolume(changeGoldenId, this.Volume);
            this.ids[9].push(changeGoldenId);
        }
    }

    playFreeEnd() {
        let duration = 0
        this.ids[10] = [];
        if (this.audioOn){
            let freeEndId = cc.audioEngine.playEffect(this.freeEnd.clip, false);
            duration = this.freeEnd.clip.duration;
            cc.audioEngine.setVolume(freeEndId, this.Volume);
            this.ids[10].push(freeEndId);
        }
        for(let i = 0; i < this.ids[0].length; i++){
            this.stopFreeBgm();
        }
        setTimeout(() => {
            if(this.audioOn){
                for(let i = 0; i < this.ids[0].length; i++){
                    cc.audioEngine.resumeEffect(this.ids[0][i]);
                }
            }
        }, duration * 1000);
    }

    playFree() {
        let duration = 0
        this.ids[11] = [];
        if (this.audioOn){
            let freeId = cc.audioEngine.playEffect(this.free.clip, false);
            duration = this.free.clip.duration;
            cc.audioEngine.setVolume(freeId, this.Volume);
            this.ids[11].push(freeId);
        }
        for(let i = 0; i < this.ids[0].length; i++){
            cc.audioEngine.pauseEffect(this.ids[0][i]);
        }
        setTimeout(() => {
            if(this.audioOn){
                this.playFreeBgm();
            }
        }, duration * 1000);
    }

    playFreeBgm() {
        if (this.audioOn && this.ids[12].length == 0){
            let freeBgmId = cc.audioEngine.playEffect(this.freeBgm.clip, true);
            cc.audioEngine.setVolume(freeBgmId, this.Volume);
            this.ids[12].push(freeBgmId);
        }
    }

    playResults(index: number):number {
        this.ids[13] = [];
        let duration = 0
        if (this.audioOn){
            let resultId = cc.audioEngine.playEffect(this.results[index].clip, false);
            duration = this.results[index].clip.duration;
            cc.audioEngine.setVolume(resultId, this.Volume);
            this.ids[13].push(resultId);
        }
        return duration;
    }


    playRates1(index: number) {
        if(index == 0) return;
        this.ids[14] = [];
        if (this.audioOn){
            let rate1Id = cc.audioEngine.playEffect(this.rates1[index - 1].clip, false);
            cc.audioEngine.setVolume(rate1Id, this.Volume);
            this.ids[14].push(rate1Id);
        }
    }

    playRates2(index: number) {
        this.ids[15] = [];
        if (this.audioOn){
            let rate2Id = cc.audioEngine.playEffect(this.rates2[index].clip, false);
            cc.audioEngine.setVolume(rate2Id, this.Volume);
            this.ids[15].push(rate2Id);
        }
    }

    playScatters() {
        this.ids[16] = [];
        if (this.audioOn){
            if(!this.scatters[this.scatterNum]) this.scatterNum = this.scatters.length - 1;
            let scatterId = cc.audioEngine.playEffect(this.scatters[this.scatterNum].clip, false);
            cc.audioEngine.setVolume(scatterId, this.Volume);
            this.ids[16].push(scatterId);
        }
        if(this.scatterNum < this.scatters.length - 1) this.scatterNum++;
    }

    playMultipleBars(index: number) {
        this.ids[17] = [];
        if (this.audioOn){
            let multipleBarId = cc.audioEngine.playEffect(this.multipleBars[index].clip, false);
            cc.audioEngine.setVolume(multipleBarId, this.Volume);
            this.ids[17].push(multipleBarId);
        }
    }

    playWinViews(index: number) {
        if (this.audioOn){
            let winViewId = cc.audioEngine.playEffect(this.winViews[index].clip, false);
            let duration = this.winViews[index].clip.duration;
            cc.audioEngine.setVolume(winViewId, this.Volume);
            for(let i = 0; i < this.ids[0].length; i++){
                cc.audioEngine.setVolume(this.ids[0][i], this.Volume * 0.5);
            }
            for(let i = 0; i < this.ids[12].length; i++){
                cc.audioEngine.setVolume(this.ids[12][i], this.Volume * 0.5);
            }
            setTimeout(()=>{
                for(let i = 0; i < this.ids[0].length; i++){
                    cc.audioEngine.setVolume(this.ids[0][i], this.Volume);
                }
                for(let i = 0; i < this.ids[12].length; i++){
                    cc.audioEngine.setVolume(this.ids[12][i], this.Volume);
                }
            },duration * 1000)
            this.ids[18].push(winViewId);
        }
    }

    playScatterWait() {
        if (this.audioOn && this.ids[19].length == 0){
            let scatterWaitId = cc.audioEngine.playEffect(this.scatterWait.clip, false);
            let duration = this.scatterWait.clip.duration;
            cc.audioEngine.setVolume(scatterWaitId, this.Volume);
            this.ids[19].push(scatterWaitId);
            setTimeout(() => {
                this.ids[19] = [];
            }, duration * 1000);
        }
    }

    stopBgm() {
        for (let i = 0; i < this.ids[0].length; i++) {
            cc.audioEngine.stopEffect(this.ids[0][i]);
        }
        this.ids[0] = [];
    }

    stopFreeEnd() {
        for (let i = 0; i < this.ids[10].length; i++) {
            cc.audioEngine.stopEffect(this.ids[10][i]);
        }
        this.ids[10] = [];
        this.stopFreeBgm();
        if(this.audioOn){
            for(let i = 0; i < this.ids[0].length; i++){
                cc.audioEngine.resumeEffect(this.ids[0][i]);
            }
        }
    }

    stopFree() {
        for (let i = 0; i < this.ids[11].length; i++) {
            cc.audioEngine.stopEffect(this.ids[11][i]);
        }
        this.ids[11] = [];
        if(this.audioOn){
            this.playFreeBgm();
        }
    }

    stopFreeBgm() {
        for (let i = 0; i < this.ids[12].length; i++) {
            cc.audioEngine.stopEffect(this.ids[12][i]);
        }
        this.ids[12] = [];
    }

    stopMultipleBars() {
        for (let i = 0; i < this.ids[17].length; i++) {
            cc.audioEngine.stopEffect(this.ids[17][i]);
        }
        this.ids[16] = [];
    }

    stopWinViews() {
        for (let i = 0; i < this.ids[18].length; i++) {
            cc.audioEngine.stopEffect(this.ids[18][i]);
        }
        for(let i = 0; i < this.ids[0].length; i++){
            cc.audioEngine.setVolume(this.ids[0][i], this.Volume);
        }
        for(let i = 0; i < this.ids[12].length; i++){
            cc.audioEngine.setVolume(this.ids[12][i], this.Volume);
        }
        this.ids[18] = [];
    }

    stopScatterWait() {
        for (let i = 0; i < this.ids[19].length; i++) {
            cc.audioEngine.stopEffect(this.ids[19][i]);
        }
        this.ids[19] = [];
    }

    playEliminate(rateIndex: number, resultIndexs: number[], freeMode: boolean){
        let resultLength = resultIndexs.length;
        // console.log(`Play eliminate with rate ${rateIndex} and result ${JSON.stringify(resultIndexs)}`);
        rateIndex = rateIndex > 4 ? 4 : rateIndex;
        this.ids[6] = [];
        if (this.audioOn){
            let eliminateId = cc.audioEngine.playEffect(this.eliminate.clip, false);
            cc.audioEngine.setVolume(eliminateId, this.Volume);
            this.ids[6].push(eliminateId);
        }
        switch(resultLength){
            case 1:
                let duration = this.playResults(resultIndexs[0] - 1);
                setTimeout(()=>{
                    !freeMode? this.playRates1(rateIndex) : this.playRates2(rateIndex);
                }, duration * 1000)
                break;
            case 2:
                let duration1 = this.playResults(resultIndexs[0] - 1);
                setTimeout(() => {
                    let duration2 = this.playResults(resultIndexs[1] - 1);
                    setTimeout(() => {
                        !freeMode? this.playRates1(rateIndex) : this.playRates2(rateIndex);
                    }, duration2 * 1000)
                }, duration1 * 1000);
                break;
            default:
                let duration3 = this.playResults(8);
                setTimeout(() => {
                    !freeMode? this.playRates1(rateIndex) : this.playRates2(rateIndex);
                }, duration3 * 1000);
                break;
        }
    }

    playCopyWild(){
        let duration = 0;
        if (this.audioOn && this.ids[19].length == 0){
            let copyWildStartId = cc.audioEngine.playEffect(this.copyWildStart.clip, false);
            duration = this.copyWildStart.clip.duration;
            cc.audioEngine.setVolume(copyWildStartId, this.Volume);
            this.ids[19].push(copyWildStartId);
            setTimeout(()=>{
                let copyWildEndId = cc.audioEngine.playEffect(this.copyWildEnd.clip, false);
                let duration2 = this.copyWildEnd.clip.duration;
                cc.audioEngine.setVolume(copyWildEndId, this.Volume);
                this.ids[19].push(copyWildEndId);
                setTimeout(()=>{
                    this.ids[19] = [];
                },duration2 * 1000)
            },duration * 500)
        }
    }

    calculatePropertyCount() {
        const properties = Object.getOwnPropertyNames(this);
        let propertyCount = 0;
        // 遍历所有属性，检查是否带有 @property 装饰器
        for (let prop of properties) {
            if (this.hasOwnProperty(prop)) {
                const descriptor = Object.getOwnPropertyDescriptor(this, prop);
                if (descriptor && descriptor.value !== undefined) {
                    propertyCount++;
                }
            }
        }
        for(let i = 0; i < propertyCount; i++){
            this.ids.push([]);
        }
        // console.log(`Number of @property variables: ${propertyCount}`);
        return propertyCount;
    }

    start() {
        this.calculatePropertyCount();
    }

    stopAllSounds() {
        for(let i = 0; i < this.ids.length; i++){
            for(let j = 0; j < this.ids[i].length; j++){
                cc.audioEngine.stopEffect(this.ids[i][j]);
            }
        }
        this.calculatePropertyCount();
    }

    // update (dt) {}
}
