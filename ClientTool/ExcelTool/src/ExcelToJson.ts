import path from "path";
import { createTsClient, createTsServer } from "./JsonToTs";
import { ExcelToJsonConfig } from "./PathUtil";

const fs = require('fs')
const excel = require('exceljs');

interface ConvertResult {
    name: string;
    kind: string;
    dst: string;
    success: boolean;
    hasData: boolean;
    message: string;
}

const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const ARABIC_RE = /[\u0600-\u06FF]/;
const RTL_TRAILING_PUNCT_RE = /([:：])(?![\u200E\u200F])(\s*)$/;

function formatCellValue(tableName: string, key: string, value: string): string {
    if ((tableName === "Language" || tableName === "CommonLanguage") && key.toLowerCase() === "ar" && ARABIC_RE.test(value)) {
        return value.replace(RTL_TRAILING_PUNCT_RE, "$1\u200F$2");
    }
    return value;
}

/**
 * Excel转Json数据
 * @param {*} src           读取的excel文件目录
 * @param {*} dst           导出的json文件目录
 * @param {*} name          excel文件名
 * @param {*} isClient      是否为客户端数据
 */
async function convert(src: string, dst: string, name: string, isClient: boolean, tsOutDir?: string): Promise<ConvertResult> {
    const kind = isClient ? "客户端" : "服务器";
    let r: any = {};
    let names: any[] = [];          // 文名字段名
    let keys: any[] = [];           // 字段名
    let types: any[] = [];          // 通用字段数据类型
    let types_client: any = {};     // 客户端数据类型
    let servers: any[] = [];        // 是否输出服务器字段数据
    let clients: any[] = [];        // 是否输出客户端字段数据
    let primary: string[] = [];     // 多主键配置
    let primary_index: number[] = [];

    const workbook = new excel.Workbook();

    // 读取excel
    await workbook.xlsx.readFile(src);
    const worksheet = workbook.getWorksheet(1);                 // 获取第一个worksheet 
    worksheet.eachRow((row: any, rowNumber: number) => {
        let data: any = {};
        row.eachCell((cell: any, colNumber: number) => {
            const value = cell.text;
            // console.warn(cell.text, cell.string, cell.number, cell.result, cell.formula)
            if (rowNumber === 1) {                              // 字段中文名
                names.push(value);
                if (value.indexOf("【KEY】") > -1) primary_index.push(colNumber);
            }
            else if (rowNumber === 2) {                         // 字段英文名
                keys.push(value);
                if (primary_index.indexOf(colNumber) > -1) primary.push(value);
            }
            else if (rowNumber === 3) {                         // 通用字段数据类型
                types.push(value);
            }
            else if (isClient == false && rowNumber === 4) {    // 是否输出服务器字段数据
                servers.push(value);
            }
            else if (isClient == true && rowNumber === 5) {     // 客户端数据类型 
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
                            data[key] = formatCellValue(name, key, value);
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
                            catch {
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
            let temp: any = null;
            for (var i = 0; i < primary.length; i++) {
                let k = primary[i];
                let id = data[k];
                delete data[k];           // 主键数据删除

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
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        await fs.writeFileSync(dst, JSON.stringify(r));

        // 生成客户端脚本
        if (isClient) {
            if (tsOutDir) await createTsClient(name, types_client, r, primary, tsOutDir);
        }
        else {
            if (tsOutDir) await createTsServer(name, types_client, r, primary, tsOutDir);
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

async function convertWithResult(src: string, dst: string, name: string, isClient: boolean, tsOutDir?: string): Promise<ConvertResult> {
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

function logResult(result: ConvertResult) {
    const text = `[${result.kind}] ${result.name} ${result.success ? result.message : "导表失败"} -> ${result.dst}`;
    if (result.success) {
        console.log(text);
        return;
    }

    console.log(`${RED}${text}`);
    console.log(`失败原因: ${result.message}${RESET}`);
}

function logGroup(title: string, results: ConvertResult[]) {
    const visibleResults = results.filter(result => !result.success || result.hasData);
    if (visibleResults.length === 0) {
        return;
    }

    console.log("");
    console.log(title);
    visibleResults.forEach(logResult);
}

function getCommonGameConfigPath(inputExcelPath: string) {
    const commonGameConfigPath = path.join(path.dirname(path.dirname(path.resolve(inputExcelPath))), "CommonConfig", "GameConfig");
    if (fs.existsSync(commonGameConfigPath) && fs.statSync(commonGameConfigPath).isDirectory()) {
        return commonGameConfigPath;
    }
    return undefined;
}

function getCommonLanguageExcelPath(commonGameConfigPath: string | undefined) {
    if (!commonGameConfigPath) {
        return undefined;
    }

    const commonLanguageExcelPath = path.join(commonGameConfigPath, "CommonLanguage.xlsx");
    if (fs.existsSync(commonLanguageExcelPath)) {
        return commonLanguageExcelPath;
    }
    return undefined;
}

async function mergeCommonLanguageJson(languageJsonPath: string, commonLanguageExcelPath: string | undefined) {
    if (!commonLanguageExcelPath || !fs.existsSync(commonLanguageExcelPath)) {
        return false;
    }

    const tempJsonPath = path.join(path.dirname(languageJsonPath), `.CommonLanguage.${process.pid}.tmp.json`);
    try {
        const commonResult = await convertWithResult(commonLanguageExcelPath, tempJsonPath, "CommonLanguage", true);
        if (!commonResult.success) {
            throw new Error(commonResult.message);
        }
        if (!commonResult.hasData) {
            return true;
        }

        const languageJson = JSON.parse(fs.readFileSync(languageJsonPath, "utf8"));
        const commonLanguageJson = JSON.parse(fs.readFileSync(tempJsonPath, "utf8"));
        Object.keys(commonLanguageJson).forEach(key => {
            if (languageJson[key] === undefined) {
                languageJson[key] = commonLanguageJson[key];
            }
        });
        fs.writeFileSync(languageJsonPath, JSON.stringify(languageJson));
        return true;
    }
    finally {
        if (fs.existsSync(tempJsonPath)) {
            fs.unlinkSync(tempJsonPath);
        }
    }
}

async function convertLanguageWithCommon(src: string, dst: string, name: string, tsOutDir: string | undefined, commonLanguageExcelPath: string | undefined): Promise<ConvertResult> {
    const result = await convertWithResult(src, dst, name, true, tsOutDir);
    if (!result.success || !result.hasData) {
        return result;
    }

    try {
        const merged = await mergeCommonLanguageJson(dst, commonLanguageExcelPath);
        if (merged) {
            result.message = `${result.message}, merged CommonLanguage: ${commonLanguageExcelPath}`;
        }
        return result;
    }
    catch (error) {
        return {
            ...result,
            success: false,
            message: error instanceof Error ? `CommonLanguage merge failed: ${error.message}` : `CommonLanguage merge failed: ${String(error)}`,
        };
    }
}

function pushConvertTasksByExcelDir(
    excelDir: string | undefined,
    tasks: Promise<ConvertResult>[],
    outJsonPathClient: string | undefined,
    outJsonPathServer: string | undefined,
    outLangJsonPathClient: string | undefined,
    outInitLangJsonPathClient: string | undefined,
    outTsPathClient: string | undefined,
    commonLanguageExcelPath: string | undefined,
    isCommonDir: boolean
) {
    if (!excelDir || !fs.existsSync(excelDir)) {
        return;
    }

    const files = fs.readdirSync(excelDir);
    files.forEach((f: any) => {
        let name = f.substring(0, f.indexOf("."));
        let ext = f.toString().substring(f.lastIndexOf(".") + 1);
        let isLangJson = name == "Language";
        let isCommonLanguage = name == "CommonLanguage";
        if (ext == "xlsx" && !f.startsWith("~$") && !(isCommonDir && isCommonLanguage)) {
            const excelPath = path.join(excelDir as string, f);
            if (outJsonPathServer) tasks.push(convertWithResult(excelPath, path.join(outJsonPathServer, name + ".json"), name, false));
            if (isLangJson && outLangJsonPathClient) {
                tasks.push(convertLanguageWithCommon(excelPath, path.join(outLangJsonPathClient, name + ".json"), name, outTsPathClient, commonLanguageExcelPath));
            }
            else {
                if (name == "LanguageInit" && outInitLangJsonPathClient) {
                    tasks.push(convertWithResult(excelPath, path.join(outInitLangJsonPathClient, name + ".json"), name, true, outTsPathClient));
                }
                else if (outJsonPathClient) {
                    tasks.push(convertWithResult(excelPath, path.join(outJsonPathClient, name + ".json"), name, true, outTsPathClient));
                }
            }
        }
    });
}

export async function run(config: ExcelToJsonConfig) {
    var inputExcelPath = config.PathExcel;
    var outJsonPathClient = config.PathJsonClient;
    var outLangJsonPathClient = config.PathLangJsonClient;
    var outInitLangJsonPathClient = config.InitPathLangJsonClient;
    var outTsPathClient = config.PathTsClient
    var outJsonPathServer = config.PathJsonServer
    const commonGameConfigPath = getCommonGameConfigPath(inputExcelPath as string);
    const commonLanguageExcelPath = getCommonLanguageExcelPath(commonGameConfigPath);
    const tasks: Promise<ConvertResult>[] = [];
    const files: any[] = [];
    files.forEach((f: any) => {
        let name = f.substring(0, f.indexOf("."));
        let ext = f.toString().substring(f.lastIndexOf(".") + 1);
        let isLangJson = name == "Language";
        if (ext == "xlsx" && !f.startsWith("~$")) {
            const excelPath = path.join(inputExcelPath as string, f);
            if (outJsonPathServer) tasks.push(convertWithResult(excelPath, path.join(outJsonPathServer, name + ".json"), name, false));                  // 服务器数据

            if (isLangJson && outLangJsonPathClient) {
                tasks.push(convertLanguageWithCommon(excelPath, path.join(outLangJsonPathClient, name + ".json"), name, outTsPathClient, commonLanguageExcelPath));                   // 客户端数据
            }
            else {
                if (name == "LanguageInit" && outInitLangJsonPathClient) {
                    tasks.push(convertWithResult(excelPath, path.join(outInitLangJsonPathClient, name + ".json"), name, true, outTsPathClient));
                }
                else if (outJsonPathClient) {
                    tasks.push(convertWithResult(excelPath, path.join(outJsonPathClient, name + ".json"), name, true, outTsPathClient));
                }
            }
        }
    });
    pushConvertTasksByExcelDir(inputExcelPath, tasks, outJsonPathClient, outJsonPathServer, outLangJsonPathClient, outInitLangJsonPathClient, outTsPathClient, commonLanguageExcelPath, false);
    pushConvertTasksByExcelDir(commonGameConfigPath, tasks, outJsonPathClient, outJsonPathServer, outLangJsonPathClient, outInitLangJsonPathClient, outTsPathClient, commonLanguageExcelPath, true);
    const results = await Promise.all(tasks);
    logGroup("服务器导表结果", results.filter(result => result.kind === "服务器"));
    logGroup("客户端导表结果", results.filter(result => result.kind === "客户端"));

    const failures = results.filter(result => !result.success);
    if (failures.length > 0) {
        throw new Error(`${failures.length} 个导表任务失败`);
    }
}
