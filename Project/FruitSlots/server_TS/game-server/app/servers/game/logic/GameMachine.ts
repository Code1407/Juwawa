import { EGameStatus } from "../interface/IGame";

export default interface IGameMachine {
    status(): EGameStatus;
    destroy();
    forceDestroy();
}
