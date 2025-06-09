import { _decorator } from "cc";
import { BaseView } from "db://game-framework/game-framework";
import { DebugService } from "./debug-service";
const { ccclass, property } = _decorator;

@ccclass("DebugView")
export class DebugView extends BaseView<DebugService> {

    protected async onShow() {
        
    }
    
    public onClose<R>(): R {
        return null!;
    }
}