import { Application, FrontendSession } from 'pinus';
import GameServer from '../GameServer';


export default function (app: Application) {
    return new AntiAddiction(app);
}

export class AntiAddiction {
    constructor(private app: Application) { }

    async checkAddiction(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        let antiAddiction = game.antiAddiction
        if (antiAddiction) {
            antiAddiction.checkAddiction(msg.uid, msg.gameName);
        }
    }

    async lockUser(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        let antiAddiction = game.antiAddiction
        if (antiAddiction) {
            antiAddiction.lockUser(msg.uid, msg.gameName, msg.sec);
        }
    }

    async ignoreAddiction(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        let antiAddiction = game.antiAddiction
        if (antiAddiction) {
            antiAddiction.ignoreAddiction(msg.uid, msg.gameName);
        }
    }

    async eventTracking(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        let antiAddiction = game.antiAddiction
        if (antiAddiction) {
            antiAddiction.eventTracking(msg.uid, msg.eventId);
        }
    }
}