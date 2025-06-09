import { Asset, Prefab, assert } from "cc";
import { DEBUG } from "cc/env";
import { Container } from "db://game-core/game-framework";
import { AssetHandle, AssetService, AsyncNextStateMachine, BaseService, MultiAssetsHandle, OpenViewOptions, TaskService, UIAnimaOpenMode, UILayer, UIShowType } from "db://game-framework/game-framework";

@Container.injectable()
export class LoadingService extends BaseService<{ infoInvoke: string, progressInvoke: { progress: number, name: string } }> {
    public viewOptions(): OpenViewOptions {
        return new OpenViewOptions(
            this.assetSvr.getOrCreateAssetHandle(
                "preload-res",
                Prefab,
                "loading-view"),
            UIAnimaOpenMode.NONE, UIShowType.FullScreenView, void 0, UILayer.Top);
    }

    /**
     * 加载函数
     *
     * @param args 加载参数
     */
    public async load(args: unknown): Promise<void> {
        if (args) {
            if (args instanceof AsyncNextStateMachine) {
                await this.loadAsyncNextStateMachine(args);
            } else if (args instanceof MultiAssetsHandle) {
                await this.loadMultiAssetsInfo(args);
            } else if (Array.isArray(args)) {
                await this.loadAssetsArray(args);
            } else {
                DEBUG && assert(false, "LoadingView: args must be AsyncNextStateMachine or MultiAssetsInfo or Array<AssetInfo>");
            }
        } else {
            await this.loadFakeProgress();
        }
    }

    /**
     * 加载 AsyncNextStateMachine 类型的参数
     *
     * @param stateMachine AsyncNextStateMachine 对象
     */
    private async loadAsyncNextStateMachine(stateMachine: AsyncNextStateMachine): Promise<void> {
        for await (const actuator of stateMachine.run()) {
            actuator.infoInvoke = (message) => {
                this.dispatch("infoInvoke", message);
            }
            actuator.progressInvoke = (progress) => {
                this.dispatch("progressInvoke", progress);
            }
        }
    }

    /**
     * 加载 MultiAssetsInfo 类型的参数
     *
     * @param info MultiAssetsInfo 对象
     */
    private async loadMultiAssetsInfo(info: MultiAssetsHandle): Promise<void> {
        const loader = Container.get(AssetService)!;
        for await (const progress of loader.loadMultiAssets(info)) {
            this.dispatch("progressInvoke", progress);
        }
    }

    /**
     * 加载 Array<AssetInfo> 类型的参数
     *
     * @param assetsInfo AssetInfo 数组
     */
    private async loadAssetsArray(assetsInfo: Array<AssetHandle<typeof Asset>>): Promise<void> {
        const loader = Container.get(AssetService)!;
        for await (const progress of loader.loadAssets(assetsInfo)) {
            this.dispatch("progressInvoke", progress);
        }
    }

    /**
     * 加载一个假的进度条
     */
    private async loadFakeProgress(): Promise<void> {
        const iter = Container.get(TaskService)!.loopFrameAsyncIter(120);
        for await (const progress of iter) {
            this.dispatch("progressInvoke", { progress: progress / 120, name: "加载中..." });
        }
    }
}