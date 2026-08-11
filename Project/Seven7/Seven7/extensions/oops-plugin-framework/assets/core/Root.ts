/*
 * @Author: dgflash
 * @Date: 2021-07-03 16:13:17
 * @LastEditors: dgflash
 * @LastEditTime: 2023-08-28 10:02:57
 */
import { _decorator, director, Game, game, JsonAsset, Node, resources, screen, sys } from "cc";
import { GameConfig } from "../module/config/GameConfig";
import { oops } from "./Oops";
import { AudioManager } from "./common/audio/AudioManager";
import { EventMessage } from "./common/event/EventMessage";
import { message } from "./common/event/MessageManager";
import { resLoader } from "./common/loader/ResLoader";
import { StorageManager } from "./common/storage/StorageManager";
import { StorageSecuritySimple } from "./common/storage/StorageSecuritySimple";
import { TimerManager } from "./common/timer/TimerManager";
import { GameManager } from "./game/GameManager";
import { LayerManager } from "./gui/layer/LayerManager";
import { SingletonFactory } from "db://assets/script/framework/commom/SingletonFactory";
import Network from "db://assets/script/framework/netWork/Network";
import { GameComponent } from "../module/common/GameComponent";
import { UIID } from "db://assets/script/module/common/GameUIConfig";
import { GlobalAvatarMgr } from "db://assets/script/module/common/GlobalAvatarMgr";

const { property } = _decorator;

/** 框架显示层根节点 */
export class Root extends GameComponent {
    /** 游戏层节点 */
    @property({
        type: Node,
        tooltip: "游戏层"
    })
    game: Node = null!;            // 可使用多摄像机自定义二维或三维游戏场景

    /** 界面层节点 */
    @property({
        type: Node,
        tooltip: "界面层"
    })
    gui: Node = null!;

    /** 框架常驻节点 */
    private persist: Node = null!

    onLoad() {
        this.enabled = false;

        this.initModule();
        this.iniStart();
        this.loadSdkConfig().then();
        this.loadGameConfig().then();
    }

    private initModule() {
        // 创建持久根节点
        this.persist = new Node("OopsFrameworkPersistNode");
        director.addPersistRootNode(this.persist);
        // oops.config.btc = new BuildTimeConstants();
        // Web平台查询参数管理
        //oops.config.query = new GameQueryConfig();
        // 资源管理模块
        oops.res = resLoader;
        // 全局消息
        oops.message = message;
        // 创建时间模块
        oops.timer = this.persist.addComponent(TimerManager)!;
        // 游戏场景管理
        oops.game = new GameManager(this.game);
        // 创建游戏界面管理对象
        oops.gui = new LayerManager();
        // 创建网络模块
        oops.network = SingletonFactory.getInstance(Network);
        // 创建全局Avatar管理模块
        oops.avatarMgr = SingletonFactory.getInstance(GlobalAvatarMgr);
    }

    private async loadSdkConfig() {
        const sdkCfgName = "configSdk";
        resources.load(sdkCfgName, JsonAsset, (err, config) => {
            if (err) {
                this.loadSdkConfig().then();
                return;
            }
            oops.config.sdk = Object.freeze(config.json);
            resources.release(sdkCfgName);
        });
    }

    private async loadGameConfig() {
        const gameCfgName = "configGame";
        resources.load(gameCfgName, JsonAsset, (err, config) => {
            if (err) {
                this.loadGameConfig().then();
                return;
            }

            oops.config.game = new GameConfig(config);

            // 本地存储模块
            oops.storage = new StorageManager();
            oops.storage.init(new StorageSecuritySimple);
            // oops.storage.init(new StorageSecurityCrypto);

            // 创建音频模块
            oops.audio = this.persist.addComponent(AudioManager);
            oops.audio.load();

            // 设置默认资源包
            oops.res.defaultBundleName = oops.config.game.bundleDefault;

            // 游戏界面管理
            oops.gui.mobileSafeArea = oops.config.game.mobileSafeArea;
            //@ts-ignore
            oops.gui.initLayer(this.gui, config.json.gui);

            // 初始化每秒传输帧数
            game.frameRate = oops.config.game.frameRate;

            this.enabled = true;
            this.init();
            this.run();

            resources.release(gameCfgName);
        });
    }

    update(dt: number) {
        //oops.ecs.execute(dt);
    }

    /** 初始化开始 */
    protected iniStart() {

    }

    /** 初始化游戏界面 */
    protected initGui() {

    }

    /** 加载完引擎配置文件后执行 */
    protected run() {

    }

    private init() {
        this.initGui();

        // 游戏显示事件
        game.on(Game.EVENT_SHOW, this.onShow, this);
        // 游戏隐藏事件
        game.on(Game.EVENT_HIDE, this.onHide, this);
        // 网络连接事件
        this.on(EventMessage.GAME_NET_CONNECT, this.onconnect, this);
        // 网络断开连接事件
        this.on(EventMessage.GAME_NET_DISCONNECT, this.disConnect, this);

        // 游戏尺寸修改事件
        if (!sys.isMobile) {
            screen.on("window-resize", () => {
                oops.message.dispatchEvent(EventMessage.GAME_RESIZE);
            }, this);

            screen.on("fullscreen-change", () => {
                oops.message.dispatchEvent(EventMessage.GAME_FULL_SCREEN);
            }, this);
        }

        screen.on("orientation-change", () => {
            oops.message.dispatchEvent(EventMessage.GAME_ORIENTATION);
        }, this);
    }

    private onconnect() {
        this.clearMgr();
        oops.gui.remove(UIID.Confirm);
        oops.gui.waitClose();
    }

    private disConnect() {

    }

    protected clearMgr() {

    }

    private onShow() {
        oops.timer.load();              // 处理回到游戏时减去逝去时间
        //oops.audio.resumeAll();         // 恢复所有暂停的音乐播放
        director.resume();              // 恢复暂停场景的游戏逻辑，如果当前场景没有暂停将没任何事情发生
        game.resume();                  // 恢复游戏主循环。包含：游戏逻辑，渲染，事件处理，背景音乐和所有音效
        oops.message.dispatchEvent(EventMessage.GAME_SHOW);
    }

    private onHide() {
        oops.timer.save();             // 处理切到后台后记录切出时间
        oops.audio.pauseAll();         // 暂停所有音乐播放
        director.pause();              // 暂停正在运行的场景，该暂停只会停止游戏逻辑执行，但是不会停止渲染和 UI 响应。 如果想要更彻底得暂停游戏，包含渲染，音频和事件
        game.pause();                  // 暂停游戏主循环。包含：游戏逻辑、渲染、输入事件派发（Web 和小游戏平台除外）
        oops.message.dispatchEvent(EventMessage.GAME_HIDE);
    }
}