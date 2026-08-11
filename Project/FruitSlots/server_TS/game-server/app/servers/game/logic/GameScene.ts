import { EGameStatus } from "../interface/IGame";
import { FrontendSession } from 'pinus';
import IGamePlayer, { IPlayerstatus } from "./GamePlayer"

export interface ISceneStatus {
    sdkName: string,
    scene: string, 
    status: EGameStatus,
    playerStatus: IPlayerstatus[]
    machineStatus?: any;
}

export default interface IGameScene {
    initScene();
    forceRemovePlayer(uid: string);
    getPlayer(uid: string): IGamePlayer;
    status(): ISceneStatus;
    destroy(): Promise<ISceneStatus>;
    removePlayer(uid: string);
    forceDestroy();
    restart(): Promise<ISceneStatus>;
}