/**
 * 一般一个游戏的启动流程如下:
 * 初始化资源包
 * 更新资源版本号
 * 更新资源清单
 * 根据资源清单下载新的资源
 * 清理不必要的缓存文件
 * 登录和拉取账号信息以及初始化客户端用户数据
 * 启动完成
 */

import { Asset, BufferAsset, director, Prefab } from "cc";
// import { OPEN_DEBUG_PANEL } from "cc/userland/macro";
import { Container } from "db://game-core/game-framework";
import { AssetHandle, AssetService, AsyncNextState, ConfService, DirAsset, PalService, UIService } from "db://game-framework/game-framework";
import { UserService } from "./core/user-service";
import { MainService } from "./modules/main/main-service";

/**
 * 初始化
 *
 * @export
 * @class LaunchInitialize
 * @extends {AsyncNextState}
 */
export class LaunchInitialize extends AsyncNextState {
    public async enter(): Promise<void> {
        const loader = Container.get(AssetService)!;
        this._message = "正在加载资源";
        if (this._actuator.infoInvoke) this._actuator.infoInvoke(this._message);

        const assets: AssetHandle<typeof Asset>[] = [
            // 加载主bundle包
            loader.getOrCreateAssetHandle("main-ui-res", Prefab, "main-view"),

            // 加载配置文件bundle包
            loader.getOrCreateAssetHandle("config-res", DirAsset, "")
        ];

        //    if (OPEN_DEBUG_PANEL) {
        //         assets.push(loader.getOrCreateAssetHandle("debug-res", DirAsset, ""));
        //     }

        for await (const progress of loader.loadAssets(assets)) {
            this._progress = progress.progress;
        }
    }
}

/**
 * 登录
 *
 * @export
 * @class LaunchLogin
 * @extends {AsyncNextState}
 */
export class LaunchLogin extends AsyncNextState {
    public async enter(): Promise<void> {

        // 解析配置表
        director.emit("game-framework-initialize");
        const conf = Container.get(ConfService)!;
        const loader = Container.get(AssetService)!;
        const info = loader.getOrCreateAssetHandle("config-res", BufferAsset, "cfg");
        this._progress = 0.5;
        const bin = await loader.getAssetAsync(info)!;
        conf.initliaze(bin!.buffer());
        await loader.releaseAsyncAsset(info, true);

        // 平台登录
        const pal = Container.get(PalService);
        this._progress = 1.0;
        const user = await pal!.login();
        Container.get(UserService)!.initialize();
    }
}

/**
 * 启动完成
 *
 * @export
 * @class LaunchDone
 * @extends {AsyncNextState}
 */
export class LaunchDone extends AsyncNextState {
    public async enter(): Promise<void> {
        const uiService = Container.get(UIService)!;
        await uiService.open(MainService);
        await uiService.closeOrPopViewName("LoadingView");

        // if (OPEN_DEBUG_PANEL) {
        //     const root = uiService.getLayer(UILayer.Root)!;
        //     const loader = Container.get(AssetService)!;
        //     const handle = loader.getOrCreateAssetHandle("debug-res", Prefab, "debug-button");
        //     const btn = loader.instantiateAsset(handle, true);
        //     root.addChild(btn);

        //     const draggable = btn.getComponent(DraggableNode);
        //     draggable?.setCallback(async () => {
        //         if (uiService.hasOpenView("DebugView")) {
        //             return;
        //         }
        //         await uiService.open(DebugService);
        //     });
        // }
    }
}