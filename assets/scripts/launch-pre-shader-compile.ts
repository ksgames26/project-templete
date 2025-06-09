
import { _decorator, director, error, gfx, renderer, rendering } from "cc";
import { NATIVE } from "cc/env";
import { Container } from "db://game-core/game-framework";
import { AssetService, AsyncNextState, TaskService } from "db://game-framework/game-framework";

const { ccclass, property } = _decorator;

@ccclass('LaunchPreShaderCompile')
export class LaunchPreShaderCompile extends AsyncNextState {

    public async enter(): Promise<void> {
        const loader = Container.get(AssetService)!;
        this._message = "正在加载shader";
        if (this._actuator.infoInvoke) this._actuator.infoInvoke(this._message);

        const shaderAssets = [

        ];

        if (shaderAssets.length === 0) {
            this._progress = 1.0;
            this._message = "预编译shader完毕";
            if (this._actuator.infoInvoke) this._actuator.infoInvoke(this._message);
            return;
        }

        for await (const progress of loader.loadAssets(shaderAssets)) {
            this._progress = progress.progress;
        }

        let count = 12;

        this._message = "正在预编译shader";
        console.time("着色器预编译");

        interface ShaderDefinesCombination {
            [key: string]: boolean | number;
        }

        interface ShaderDefinesConfig {
            combinations: ShaderDefinesCombination[];
        }

        interface VariantDefines {
            [shaderPath: string]: ShaderDefinesConfig;
        }

        const varinatDefines: VariantDefines = {

        };

        let progress = 0;
        let callProgress = 0;
        for (const asset of shaderAssets) {
            const effect = asset.getAsset()!;

            for (const tech of effect.techniques) {

                for (const pass of tech.passes) {

                    const passID = rendering.getPassID(pass.pass);
                    const phaseID = rendering.getPhaseID(passID, pass.phase);

                    const programKey = pass.program.split("|")[0];
                    const defineObjs = varinatDefines[programKey as keyof typeof varinatDefines];
                    if (!defineObjs) {

                        continue;
                    }

                    const shaderDefines = defineObjs.combinations;

                    progress++;
                    this._progress = progress / count;

                    for (let i = 0; i < shaderDefines.length; ++i) {
                        const define = shaderDefines[i] as renderer.MacroRecord;
                        Object.assign(define, director.root?.pipeline?.macros);

                        const key = rendering.programLib.getKey(phaseID, pass.program, define);
                        const variant = rendering.programLib.getProgramVariant(gfx.deviceManager.gfxDevice, phaseID, pass.program, define, key);

                        callProgress++;
                        if (!NATIVE) {
                            // 临时解决方案。
                            // 直接调用gpuShader是会触发编译的。但是这种使用仅限在web端
                            // 原生端不行

                            // @ts-ignore
                            const gpuShader = variant?.shader.gpuShader;
                            if (!gpuShader) {
                                error("gpuShader is null");
                            }

                            if (callProgress > 20) {
                                callProgress = 0;
                                const task = Container.get(TaskService)!;
                                await task.waitNextFrame();
                                continue;
                            }
                        }

                        if (variant) {
                            try {
                                // 使用一段简单的pipelineStateInfo来触发编译
                                // 创建基本的PipelineStateInfo
                                const pipelineStateInfo = new gfx.PipelineStateInfo();

                                // 设置必要的渲染状态
                                pipelineStateInfo.blendState = new gfx.BlendState();
                                const blendTarget = new gfx.BlendTarget();
                                blendTarget.blend = true;
                                pipelineStateInfo.blendState.targets = [blendTarget];

                                pipelineStateInfo.rasterizerState = new gfx.RasterizerState();
                                pipelineStateInfo.depthStencilState = new gfx.DepthStencilState();

                                // 设置shader和基本输入
                                pipelineStateInfo.shader = variant.shader;
                                pipelineStateInfo.inputState = new gfx.InputState([
                                    new gfx.Attribute('a_position', gfx.Format.RGB32F)
                                ]);

                                const colorAttachment = new gfx.ColorAttachment();
                                const depthStencilAttachment = new gfx.DepthStencilAttachment();
                                colorAttachment.format = gfx.Format.RGBA8;
                                depthStencilAttachment.format = gfx.Format.DEPTH_STENCIL;
                                depthStencilAttachment.stencilStoreOp = gfx.StoreOp.DISCARD;
                                depthStencilAttachment.depthStoreOp = gfx.StoreOp.DISCARD;

                                colorAttachment.loadOp = gfx.LoadOp.CLEAR;
                                depthStencilAttachment.depthLoadOp = gfx.LoadOp.LOAD;
                                depthStencilAttachment.stencilLoadOp = gfx.LoadOp.LOAD;
                                depthStencilAttachment.barrier = gfx.deviceManager.gfxDevice.getGeneralBarrier(new gfx.GeneralBarrierInfo(
                                    gfx.AccessFlagBit.DEPTH_STENCIL_ATTACHMENT_WRITE,
                                    gfx.AccessFlagBit.DEPTH_STENCIL_ATTACHMENT_WRITE,
                                ));

                                const renderPassInfo = new gfx.RenderPassInfo([colorAttachment], depthStencilAttachment);

                                pipelineStateInfo.renderPass = gfx.deviceManager.gfxDevice.createRenderPass(renderPassInfo);
                                pipelineStateInfo.pipelineLayout = rendering.programLib.getPipelineLayout(gfx.deviceManager.gfxDevice, phaseID, pass.program);

                                // 创建PipelineState触发编译
                                // 没有RenderPass。会报错
                                const pipelineState = gfx.deviceManager.gfxDevice.createPipelineState(pipelineStateInfo);

                                // 释放创建的PipelineState
                                // shader已经编译完成，所以释放
                                if (pipelineState) {
                                    pipelineState.destroy();
                                }


                            } catch (error: any) {
                                console.error(`编译着色器失败: ${pass.program}`, error);


                            }

                            if (callProgress > 20) {
                                callProgress = 0;
                                const task = Container.get(TaskService)!;
                                await task.waitNextFrame();
                            }
                        }
                    }

                }

            }

        }
        this._progress = 1.0;
        console.timeEnd("着色器预编译");
    }
}
