import {getLogger} from "pinus-logger";

let logger = getLogger('sdk', __filename);

export default class DebugLogger {
    print = (data: any) => this.debugPrint(data);
    constructor(private isDebug: boolean) {}

    debugPrint(data: any) {
        if (this.isDebug) {
            console.log(data);
        }
    }

    logNotNull(data: any, msg: string) {
        if (data) {
            this.print(msg);
            logger.error(msg);
        }
    }

    logError(error: any) {
        this.logNotNull(error, "error: " + error);
    }
}
