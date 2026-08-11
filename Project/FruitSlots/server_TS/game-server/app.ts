import { pinus } from 'pinus';
import GameServer from './app/servers/game/GameServer';
import { preload } from './preload';
import { createPinusHttpPlugin } from 'pinus-http-plugin';
import * as path from 'path';
const easyMonitor = require('easy-monitor');
/**
 *  替换全局Promise
 *  自动解析sourcemap
 *  捕获全局错误
 */
preload();

/**
 * Init app for client.
 */
let app = pinus.createApp();
app.set('name', 'GameServer');

const easyConfig = {
    // logLevel: 3,
    appName: 'GameServer',
    httpServerPort: 10086,

    // filterFunction: function (filePath, funcName) {
    //     if (funcName === 'anonymous' || ~filePath.indexOf('node_modules')) {
    //         return false;
    //     }
    //     return Boolean(/^\(\/.*/.test(filePath));
    // },
    // monitorAuth: function (user, pass) {
    //     return new Promise(resolve => resolve(Boolean(user === 'admin' && pass === 'lifeishard')));
    // }
};

easyMonitor('GameServer');

app.configure('development', 'gamehttp', function () {
    app.loadConfig('httpConfig', path.resolve(app.getBase(), 'config/http.json'));
    app.use(createPinusHttpPlugin(), app.get('httpConfig')[app.getServerId()]);
});

// app configuration
app.configure('production|development|simulation', 'connector', function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: 3,
            useDict: true,
            useProtobuf: true
        });
});

app.configure('production|development|simulation', 'game', function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            useProtobuf: true,
        });
});

app.configure('production|development|simulation', 'database', function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            useProtobuf: true
        });
});

// start app
app.start((error) => {
    if (error) {
        console.log(error);
    }

    console.log(" ===== start ===== ");

    if (app.getServerType() == "game") {
        let gameServer = new GameServer(app);
        app.set('GameServer', gameServer);
    }
});
