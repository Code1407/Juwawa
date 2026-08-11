
import { oops } from 'db://oops-framework/core/Oops';
import { BundleName } from '../../framework/commom/FrameDefine';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { isValid } from 'cc';

export class GameGlobal {
    /** 音效 */
    public static SoundOpen: boolean = true;
    public static ChipIndex: number = 1; //筹码挡位

    static playAudio(audioPath: string, bundle = BundleName.Common, soundVolume: number = 0.7, loop: boolean = false) {
        if (!GameGlobal.SoundOpen) {
            return;
        }
        oops.audio.playEffect(audioPath, {
            bundle: bundle,
            loop: loop,
            volume: soundVolume,
        })
    }

    static playAudioByComp(comp:GameComponent, audioPath: string, bundle = BundleName.Common, soundVolume: number = 0.7, loop: boolean = false){
        if (!GameGlobal.SoundOpen) {
            return;
        }
        if(!comp || !isValid(comp)){
            return;
        }
        comp.playEffect(audioPath,{
            bundle: bundle,
            loop: loop,
            volume: soundVolume,
        })
    }
}


