"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path_1 = __importDefault(require("path"));
const JsonToTs_1 = require("./JsonToTs");
const PathUtil_1 = require("./PathUtil");
const fs = require('fs');
const excel = require('exceljs');
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
/**
 * Excel转Json数据
 * @param {*} src           读取的excel文件目录
 * @param {*} dst           导出的json文件目录
 * @param {*} name          excel文件名
 * @param {*} isClient      是否为客户端数据
 */
async function convert(src, dst, name, isClient, tsOutDir) {
    const kind = isClient ? "客户端" : "服务器";
    let r = {};
    let names = []; // 文名字段名
    let keys = []; // 字段名
    let types = []; // 通用字段数据类型
    let types_client = {}; // 客户端数据类型
    let servers = []; // 是否输出服务器字段数据
    let clients = []; // 是否输出客户端字段数据
    let primary = []; // 多主键配置
    let primary_index = [];
    const workbook = new excel.Workbook();
    // 读取excel
    await workbook.xlsx.readFile(src);
    const worksheet = workbook.getWorksheet(1); // 获取第一个worksheet 
    worksheet.eachRow((row, rowNumber) => {
        let data = {};
        row.eachCell((cell, colNumber) => {
            const value = cell.text;
            // console.warn(cell.text, cell.string, cell.number, cell.result, cell.formula)
            if (rowNumber === 1) { // 字段中文名
                names.push(value);
                if (value.indexOf("【KEY】") > -1)
                    primary_index.push(colNumber);
            }
            else if (rowNumber === 2) { // 字段英文名
                keys.push(value);
                if (primary_index.indexOf(colNumber) > -1)
                    primary.push(value);
            }
            else if (rowNumber === 3) { // 通用字段数据类型
                types.push(value);
            }
            else if (isClient == false && rowNumber === 4) { // 是否输出服务器字段数据
                servers.push(value);
            }
            else if (isClient == true && rowNumber === 5) { // 客户端数据类型 
                clients.push(value);
            }
            else if (rowNumber > 5) {
                let index = colNumber - 1;
                let type = types[index];
                let server = servers[index];
                let client = clients[index];
                // 验证是否输出这个字段
                let isWrite = isClient && client === "client" || isClient == false && server === "server";
                if (isWrite) {
                    let key = keys[index];
                    switch (type) {
                        case "int":
                            // console.warn(`${index}int`, key, value, cell.string, cell.number, cell.result)
                            if (cell.formula) {
                                data[key] = parseInt(cell.result);
                            }
                            else {
                                data[key] = parseInt(value);
                            }
                            types_client[key] = {
                                en: "number",
                                zh: names[index]
                            };
                            break;
                        case "float":
                            // console.warn(`${index}int`, key, value, cell.string, cell.number, cell.result)
                            if (cell.formula) {
                                data[key] = parseFloat(cell.result);
                            }
                            else {
                                data[key] = parseFloat(value);
                            }
                            types_client[key] = {
                                en: "number",
                                zh: names[index]
                            };
                            break;
                        case "string":
                            // console.warn(`${index}int`, key, value, cell.string, cell.number, cell.result)
                            data[key] = value;
                            types_client[key] = {
                                en: "string",
                                zh: names[index]
                            };
                            break;
                        case "any":
                            // console.warn(`${index}int`, key, value, cell.string, cell.number, cell.result)
                            try {
                                data[key] = JSON.parse(value);
                                types_client[key] = {
                                    en: "any",
                                    zh: names[index]
                                };
                            }
                            catch (_a) {
                                console.log('Cell ' + cell.address + ' has value ' + cell.text);
                                console.warn(`文件【${src}】的【${key}】字段【${data[key]}】类型数据【${value}】JSON转字段串错误【${client}】`);
                            }
                            break;
                    }
                }
            }
        });
        // 生成数据（多主键）
        if (rowNumber > 5) {
            let temp = null;
            for (var i = 0; i < primary.length; i++) {
                let k = primary[i];
                let id = data[k];
                delete data[k]; // 主键数据删除
                if (primary.length == 1) {
                    r[id] = data;
                }
                else {
                    if (i == primary.length - 1) {
                        temp[id] = data;
                    }
                    else if (i == 0) {
                        if (r[id] == undefined) {
                            r[id] = {};
                        }
                        temp = r[id];
                    }
                    else {
                        temp[id] = {};
                        temp = temp[id];
                    }
                }
            }
        }
    });
    // 写入流
    if (r["undefined"] == null) {
        fs.mkdirSync(path_1.default.dirname(dst), { recursive: true });
        await fs.writeFileSync(dst, JSON.stringify(r));
        // 生成客户端脚本
        if (isClient) {
            if (tsOutDir)
                await (0, JsonToTs_1.createTsClient)(name, types_client, r, primary, tsOutDir);
        }
        else {
            if (tsOutDir)
                await (0, JsonToTs_1.createTsServer)(name, types_client, r, primary, tsOutDir);
        }
        return {
            name,
            kind,
            dst,
            success: true,
            hasData: true,
            message: "导表成功",
        };
    }
    else {
        return {
            name,
            kind,
            dst,
            success: true,
            hasData: false,
            message: "无数据",
        };
    }
}
async function convertWithResult(src, dst, name, isClient, tsOutDir) {
    try {
        return await convert(src, dst, name, isClient, tsOutDir);
    }
    catch (error) {
        return {
            name,
            kind: isClient ? "客户端" : "服务器",
            dst,
            success: false,
            hasData: true,
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
function logResult(result) {
    const text = `[${result.kind}] ${result.name} ${result.success ? result.message : "导表失败"} -> ${result.dst}`;
    if (result.success) {
        console.log(text);
        return;
    }
    console.log(`${RED}${text}`);
    console.log(`失败原因: ${result.message}${RESET}`);
}
function logGroup(title, results) {
    const visibleResults = results.filter(result => !result.success || result.hasData);
    if (visibleResults.length === 0) {
        return;
    }
    console.log("");
    console.log(title);
    visibleResults.forEach(logResult);
}
async function run(config, options = {}) {
    const projectRoot = options.projectRoot || (0, PathUtil_1.getDefaultProjectRoot)();
    var inputExcelPath = (0, PathUtil_1.resolveConfigPath)(config.PathExcel, projectRoot);
    var outJsonPathClient = (0, PathUtil_1.resolveConfigPath)(config.PathJsonClient, projectRoot);
    var outLangJsonPathClient = (0, PathUtil_1.resolveConfigPath)(config.PathLangJsonClient, projectRoot);
    var outInitLangJsonPathClient = (0, PathUtil_1.resolveConfigPath)("project://assets/resources", projectRoot);
    var outTsPathClient = (0, PathUtil_1.resolveConfigPath)(config.PathTsClient, projectRoot);
    var outTsPathServer = (0, PathUtil_1.resolveConfigPath)(config.PathTsServer, projectRoot);
    var outJsonPathServer = null;
    const pathJsonServer = options.serverJsonPath || config.PathJsonServer;
    if (pathJsonServer != null && pathJsonServer.length > 0) {
        outJsonPathServer = (0, PathUtil_1.resolveConfigPath)(pathJsonServer, projectRoot);
    }
    const files = fs.readdirSync(inputExcelPath);
    const tasks = [];
    files.forEach((f) => {
        let name = f.substring(0, f.indexOf("."));
        let ext = f.toString().substring(f.lastIndexOf(".") + 1);
        let isLangJson = name == "Language";
        if (ext == "xlsx" && !f.startsWith("~$")) {
            const excelPath = path_1.default.join(inputExcelPath, f);
            if (outJsonPathServer)
                tasks.push(convertWithResult(excelPath, path_1.default.join(outJsonPathServer, name + ".json"), name, false, outTsPathServer)); // 服务器数据
            if (isLangJson && outLangJsonPathClient) {
                tasks.push(convertWithResult(excelPath, path_1.default.join(outLangJsonPathClient, name + ".json"), name, true, outTsPathClient)); // 客户端数据
            }
            else {
                if (name == "LanguageInit") {
                    tasks.push(convertWithResult(excelPath, path_1.default.join(outInitLangJsonPathClient, name + ".json"), name, true, outTsPathClient));
                }
                else {
                    tasks.push(convertWithResult(excelPath, path_1.default.join(outJsonPathClient, name + ".json"), name, true, outTsPathClient));
                }
            }
        }
    });
    const results = await Promise.all(tasks);
    logGroup("服务器导表结果", results.filter(result => result.kind === "服务器"));
    logGroup("客户端导表结果", results.filter(result => result.kind === "客户端"));
    const failures = results.filter(result => !result.success);
    if (failures.length > 0) {
        throw new Error(`${failures.length} 个导表任务失败`);
    }
}
exports.run = run;
