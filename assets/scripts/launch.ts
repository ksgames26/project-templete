import { _decorator, Component, director, DynamicAtlasManager, Prefab } from 'cc';
import { EDITOR } from 'cc/env';
import { Container, implementation, logger, LoggerType, previewAutoFullScreen, previewNewConsole } from "db://game-core/game-framework";
import { AssetService, AsyncNextStateMachine, ConfService, EventDispatcher, Extensions, PalService, TaskService, UIService } from "db://game-framework/game-framework";
import { ProtobufSerializer } from 'db://game-protobuf/game-framework';
import { UserService } from './core/user-service';
import { LaunchDone, LaunchInitialize, LaunchLogin } from './launch-flow';
import { LoadingService } from './modules/loading/loading-service';
import { CustomPal } from './pal/custom-pal';
import { LaunchPreShaderCompile } from './launch-pre-shader-compile';
const { ccclass } = _decorator;

Extensions.initialize();
DynamicAtlasManager.instance.enabled = false;

@ccclass('IEnv')
@implementation("IGameFramework.IEnv")
class Env implements IGameFramework.IEnv {
    private _physics: IGameFramework.JoltPhysicsSettings = {} as IGameFramework.JoltPhysicsSettings;

    get isSingleMock(): boolean {
        return true;
    }

    get physics(): IGameFramework.JoltPhysicsSettings {
        return this._physics as IGameFramework.JoltPhysicsSettings;
    }

    set physics(value: IGameFramework.JoltPhysicsSettings) {
        this._physics = value;
    }

    frameSyncConf<T extends IGameFramework.IFrameSync.IAppAdapter>(openId: string, accessToken?: string): Parameters<T['onCreate']>[0] {
        return {

        };
    }
}

@ccclass('Launch')
export class Launch extends Component {
    async start() {
        previewAutoFullScreen();
        previewNewConsole();

        director.addPersistRootNode(this.node);

        if (EDITOR) {
            logger.type = LoggerType.CUSTOME;
        } else {
            logger.type = LoggerType.CONSOLE;
        }

        // core
        Container.addInstance(EventDispatcher);
        const assetSvr = Container.addInstance(AssetService);
        Container.addInstance(UserService);

        // paltfomr adapters
        const pal = Container.addInstance(PalService);
        pal.adaptation();
        pal.adapter = new CustomPal();

        Container.addInstance(ConfService);
        const taskService = Container.addSingleton(TaskService, { taskPoolSize: 50 });
        const uiService = Container.addSingleton(UIService, {
            clickBgHandle: assetSvr.getOrCreateAssetHandle("main-res", Prefab, "prefabs/main-clickBg"),
            createTouchLayer: false
        });
        Container.addInstance(ProtobufSerializer);
        Container.registerInjectables();

        //waterfall flow before the game starts
        const launchFlow = new AsyncNextStateMachine(taskService);
        launchFlow.addState(new LaunchInitialize());
        launchFlow.addState(new LaunchPreShaderCompile());
        launchFlow.addState(new LaunchLogin());
        launchFlow.addState(new LaunchDone());
        await uiService.open(LoadingService, launchFlow);
    }

    update(deltaTime: number) {
        Container.update();
    }
}

