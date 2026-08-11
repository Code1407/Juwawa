import TimerEffect from "./TimerEffect";
import ColorChange from "./ColorChange";
import { gGameData } from "../GameData";
import Audio from "../Audio";

export default class WheelsEffect {

    private itemIndex: number = 0;
    private endIndex: number = 0;
    private effTimer: TimerEffect;
    

    constructor(private items: Array<cc.Node>, betTimer: cc.Node) {
        items.forEach(item => {
            for (let i = 0; i < item.childrenCount; ++i) {
                item.children[i].addComponent(ColorChange);
                // console.log(i);
                
            }
        });
        this.effTimer = betTimer.addComponent(TimerEffect);
        // salad.addComponent(ColorChange);
        // pizza.addComponent(ColorChange);
    }

    init() {
        this.enterBet();
    }
    highlightItem(index: number,isEnd:Boolean) {
        let item = this.items[index];
        let light = cc.find("WheelItem/Light", item);
        cc.tween(light).parallel(
                cc.fadeIn(0.1),
                cc.tween().to(0.1, { scale: 1.2 })
                
            )
            .call(() => {
            //  console.log("light");
            if(!isEnd){

                setTimeout(() => {
                   light.opacity = 0;
                },300)
                
            }
            else{
                this.endIndex = index;
                Audio.Instance.StopstartRun();
                Audio.Instance.playstopRun();


                light.opacity = 0;
                let eff:sp.Skeleton = cc.find("WheelItem/xuanzhong", item).getComponent(sp.Skeleton);
                eff.node.active = true;
                eff.setAnimation(0,"animation",false);
                setTimeout(() => {
                    eff.node.active = false;
                 },1000)
                cc.tween(light)
                .to(0.2, {opacity: 255})
                .to(0.2,{opacity:0})
                .union()
                .repeat(5)
                .to(0.2, {opacity: 255})
                .call(()=> {
                    //light.opacity = 255;
                }).start();
            }
             
            }).start();
        
    }
    highlightItemend(index: number){
        let light = cc.find("WheelItem/Light");
        cc.tween(light).parallel(
                cc.fadeIn(0.1),
                cc.tween().to(0.1, { scale: 1.2 })
            )
            .call(() => {
             console.log("end");
            
            }).start();
    }
  
    finalEffectGP() {
        this.effTimer.finalEffect();
    }

    betEffect(second: number) {
        this.effTimer.betEffect(second);
        // this.bg1Item(this.itemIndex);
        // this.indexIncrease();
        // this.fingerAndbg2Item(this.itemIndex);
    }

    // [MARKER:WHEEL_EFFECT] 滚动效果实现 - 切换高亮位置并播放动画
    // second==0 时为最终阶段，会触发中奖特效
    runEffect(second: number): number {
        this.effTimer.runEffect(second);
        // this.bg1Item(this.itemIndex);
        this.darkItem(this.itemIndex);
        this.indexIncrease();  // 移动到下一个格子
        // this.bg2Item(this.itemIndex);
        // 在这里调用亮灯效果
        if(second == 0) {
            // console.log("run ends");
            
        }
        this.recoverItem(this.itemIndex);
        this.highlightItem(this.itemIndex,second==0&&this.itemIndex==gGameData.roundStep.result);
       
        return this.itemIndex;
    }

    // [MARKER:WHEEL_FINAL_EFFECT] 中奖特效 - 触发最终开奖动画
    finalEffect(index:number) {
        this.effTimer.finalEffect();
      
    }

    enterBet() {
        this.recoverItems();
        this.bg1Items();
        // this.salad.getComponent(ColorChange).recover();
        // this.pizza.getComponent(ColorChange).recover();
    }

    darkItem(index: number) {
        let item = this.items[index];
        for (let i = 0; i < item.childrenCount; ++i) {
            let itemEff = item.children[i].getComponent(ColorChange);
            // itemEff.dark();
        }
    }

    recoverItem(index: number) {
        let item = this.items[index];
        for (let i = 0; i < item.childrenCount; ++i) {
            //let itemEff = item.children[i].getComponent(ColorChange);
            // itemEff.recover();
            // let item = this.items[index];
            // let light = cc.find("WheelItem/Light", item);
            // light.opacity = 0;
        }
    }

    bg1Item(index: number) {
        let item = this.items[index];
        // cc.find("WheelItem/bg1", item).active = true;
        // cc.find("WheelItem/bg2", item).active = false;
        // cc.find("WheelItem/Finger", item).active = false;
    }

    bg2Item(index: number) {
        let item = this.items[index];
        // cc.find("WheelItem/bg1", item).active = false;
        // cc.find("WheelItem/bg2", item).active = true;
        // cc.find("WheelItem/Finger", item).active = false;
    }
    
    darkItems() {
        for (let i = 0; i < this.items.length; ++i) {
            this.darkItem(i);
        }
    }
    startADD(){
        let item = this.items[this.endIndex];
        let light = cc.find("WheelItem/Light", item);
        cc.tween(light)
        .to(0.5, {opacity: 255})
        .to(0.5,{opacity:0})
        .union()
        .repeat(3)
        .to(0.5, {opacity: 255})
        .call(()=> {
            light.opacity = 0;
        }).start();
    }
    stratRecoverItems(){
        for (let i = 0; i < this.items.length; ++i) {
            let item = this.items[i];
            let light = cc.find("WheelItem/Light", item);
            light.opacity = 0;
            let eff = cc.find("WheelItem/xuanzhong", item);
            eff.active = false;
        }
    }
    recoverItems() {
        for (let i = 0; i < this.items.length; ++i) {
            this.recoverItem(i);
        }
    }

    bg1Items() {
        for (let i = 0; i < this.items.length; ++i) {
            this.bg1Item(i);
        }
    }

    enterRun() {
        // cc.find("WheelItem/bg1", this.items[this.itemIndex]).active = true;
        // cc.find("WheelItem/bg2", this.items[this.itemIndex]).active = false;
        this.darkItems();
        // this.salad.getComponent(ColorChange).dark();
        // this.pizza.getComponent(ColorChange).dark();
    }

    private indexIncrease() {
        this.itemIndex = ++this.itemIndex % this.items.length;
    }
}
