import { Prefab } from "cc";
import { Container } from "db://game-core/game-framework";
import { BaseService, OpenViewOptions, UIAnimaOpenMode, UIShowType } from "db://game-framework/game-framework";

@Container.injectable()
export class MainService extends BaseService {

    public viewOptions(): OpenViewOptions {
        return new OpenViewOptions(
            this.assetSvr.getOrCreateAssetHandle(
                "main-ui-res",
                Prefab,
                "main-view"),
            UIAnimaOpenMode.NONE, UIShowType.FullScreenView);
    }
}