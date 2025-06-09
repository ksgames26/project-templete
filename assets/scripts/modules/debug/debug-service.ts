import { Prefab } from "cc";
import { Container } from "db://game-core/game-framework";
import { BaseService, OpenViewOptions, UIAnimaOpenMode, UILayer, UIShowType } from "db://game-framework/game-framework";

@Container.injectable()
export class DebugService extends BaseService {
    public viewOptions(): OpenViewOptions {
        return new OpenViewOptions(
            this.assetSvr.getOrCreateAssetHandle(
                "debug-res",
                Prefab,
                "debug-view"),
            UIAnimaOpenMode.NONE, UIShowType.BlackBaseView, void 0, UILayer.Top);
    }
}