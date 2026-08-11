import * as fs from "fs";

export default class FileWatchUtil {
    private static watchers: { [key: string]: fs.FSWatcher } = {};
    
    private constructor() {}

    public static watch(filePath: string, callback: (eventType: string, filename: string) => void): void {
        // 如果已经在监视该文件，则不再次监视
        if (this.watchers[filePath]) {
          return;
        }
    
        const watcher = fs.watch(filePath, (eventType, filename) => {
          callback(eventType, filename.toString());
        });
    
        this.watchers[filePath] = watcher;
    }
    
    public static unwatch(filePath: string): void {
        if (this.watchers[filePath]) {
          this.watchers[filePath].close();
          delete this.watchers[filePath];
        }
    }
}