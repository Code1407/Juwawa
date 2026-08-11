/*
 * @Author: dgflash
 * @Date: 2021-08-18 17:00:59
 * @LastEditors: dgflash
 * @LastEditTime: 2023-08-22 15:48:02
 */

import { JsonAsset } from "cc";
import { resLoader } from "../common/loader/ResLoader";
import { BundleName } from "db://assets/script/framework/commom/FrameDefine";

/** 资源路径 */
const bundle_name: string = BundleName.Config;
const path: string = "game";

/** 数据缓存 */
const data: Map<string, any> = new Map();

/** JSON数据表工具 */
export class JsonUtil {
    /**
     * 通知资源名从缓存中获取一个Json数据表
     * @param name  资源名
     */
    static get(name: string): any {
        if (data.has(name))
            return data.get(name);
    }

    /**
     * 通知资源名加载Json数据表
     * @param name      资源名
     * @param callback  资源加载完成回调
     */
    static load(name: string, callback: Function): void {
        if (data.has(name))
            callback(data.get(name));
        else {
            const url = path + name;
            resLoader.load(url, JsonAsset, (err: Error | null, content: JsonAsset) => {
                if (err) {
                    console.warn(err.message);
                    callback(null);
                }
                else {
                    data.set(name, content.json);
                    resLoader.release(url);
                    callback(content.json);
                }
            });
        }
    }

    /**
     * 异步加载Json数据表
     * @param name 资源名
     */
    static loadAsync(name: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (data.has(name)) {
                resolve(data.get(name))
            }
            else {
                const url = path + name;
                resLoader.load(url, JsonAsset, (err: Error | null, content: JsonAsset) => {
                    if (err) {
                        console.warn(err.message);
                        resolve(null);
                    }
                    else {
                        data.set(name, content.json);
                        resLoader.release(url);
                        resolve(content.json);
                    }
                });
            }
        });
    }

    /** 加载所有配置表数据到缓存中 */
    static loadDirAsync(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resLoader.loadDir(bundle_name, path, (err: Error | null, assets: JsonAsset[]) => {
                if (err) {
                    console.warn(err.message);
                    resolve(false);
                }
                else {
                    assets.forEach(asset => {
                        this.setIDIntoJson(asset);
                        data.set(asset.name, asset.json);
                    });
                    resLoader.releaseDir(path);
                    resolve(true);
                }
            });
        });
    }

    /**
     * 通过指定资源名释放资源内存
     * @param name 资源名
     */
    static release(name: string) {
        data.delete(name);
    }

    /** 清理所有数据 */
    static clear() {
        data.clear();
    }

    static setIDIntoJson(asset: JsonAsset) {
        const jsonData = asset.json;
        if (jsonData && typeof jsonData === 'object') {
            // 遍历json中的每个key-value对
            Object.entries(jsonData).forEach(([key, value]) => {
                // 确保value是对象类型（只有对象才能添加id字段）
                if (value && typeof value === 'object') {
                    // 避免覆盖已存在的id字段
                    if (!value.hasOwnProperty('id')) {
                        value.ID = Number(key); // 将当前key作为id赋值
                    } else {
                        console.warn(`JSON ${asset.name} 中键 ${key} 的值已存在id字段，未覆盖`);
                    }
                }
            });
        }
    }
}