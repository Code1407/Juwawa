// import { Application } from 'pinus';
// import * as express from 'express';
// import {BoxingDragonTiger} from "../../game/handler/BoxingDragonTiger";

// export = function (app: Application, http: express.Express) {

//     http.get('/test', async function (req, res) {
//         res.send('hello world');
//     });

//     let game = new BoxingDragonTiger(app);
//     http.post('/api/BoxingDragonTiger/bet', async function(req, resp) {
//         let msg = req.body;
//         let session = req.session;
//         let respData = await game.bet(msg, session);

//         if (respData) resp.send(respData);
//         else resp.send("Error");
//     });
// };
