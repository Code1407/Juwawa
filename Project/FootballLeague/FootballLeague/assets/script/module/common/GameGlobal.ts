
import { oops } from 'db://oops-framework/core/Oops';
import { BundleName } from '../../framework/commom/FrameDefine';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { isValid } from 'cc';
import { GameEvent } from './GameEvent';

export class GameGlobal {
    private static _soundOpen: boolean = true;
    /** 音效 */
    public static get SoundOpen(): boolean {
        return GameGlobal._soundOpen;
    }
    public static set SoundOpen(value: boolean) {
        if (GameGlobal._soundOpen === value) {
            return;
        }
        GameGlobal._soundOpen = value;
        oops.message.dispatchEvent(GameEvent.MSG_AUDIO_CHANGE, value);
    }
    public static ChipIndex: number = 1; //筹码挡位
    public static TeamId: number = 1; //球队ID

    public static getTeamId(): number {
        return GameGlobal.TeamId;
    }

    public static get_team_id(): number {
        return GameGlobal.getTeamId();
    }

    public static setTeamId(teamId: number): number {
        let value = Number(teamId) || 1;
        value = Math.max(1, Math.min(3, value));
        GameGlobal.TeamId = value;
        return GameGlobal.TeamId;
    }

    public static set_team_id(teamId: number): number {
        return GameGlobal.setTeamId(teamId);
    }

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


