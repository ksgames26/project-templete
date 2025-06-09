import { ProgressBar, _decorator, Label } from "cc";
import { BaseView, eventViewListener } from "db://game-framework/game-framework";
import { LoadingService } from "./loading-service";
const { ccclass, property } = _decorator;

@ccclass("LoadingView")
export class LoadingView extends BaseView<LoadingService> {
    @property({type: Label})
    private readonly _labInfo: Label = null!;
    @property({type: ProgressBar}) private _prgLoadingBar: ProgressBar = null!;

    protected async onShow() {
        await this._service.load(this._options.args);
    }

    @eventViewListener("infoInvoke")
    protected onMessage(info: string) { 
        this._labInfo.string = info;
    }

    @eventViewListener("progressInvoke")
    protected onProgress({ progress, name }: { progress: number, name: string }) {
        this._prgLoadingBar.progress = progress;
        this._labInfo.string = name;
    }

    public onClose<R>(): R {
        return null!;
    }
}