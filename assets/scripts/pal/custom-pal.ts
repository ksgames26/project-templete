import { ILoginAdapter, IPal } from "db://game-framework/game-framework";

/**
 * 登录适配器
 *
 * @export
 * @class CustomPal
 * @implements {IPal}
 */
export class CustomPal implements ILoginAdapter {
    
    public async login<T>(openId: string): Promise<T> {

        return Promise.resolve(null as T);
    }

    public async logout(): Promise<void> {

    }
}