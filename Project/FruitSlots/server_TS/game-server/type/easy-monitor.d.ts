declare module 'easy-monitor' {
    interface EasyMonitorConfig {
        projectName?: string;
        port?: number;
        // 根据实际情况添加其他配置项
    }

    function easyMonitor(config: string | EasyMonitorConfig): void;
    export = easyMonitor;
}
