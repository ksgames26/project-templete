import { _decorator } from "cc";
import { BaseView } from "db://game-framework/game-framework";
import { MainService } from "./main-service";
const { ccclass, property } = _decorator;

@ccclass("MainView")
export class MainView extends BaseView<MainService> {


    public override async onShow(): Promise<void> {

    }

    public onClose(): void {

    }
}