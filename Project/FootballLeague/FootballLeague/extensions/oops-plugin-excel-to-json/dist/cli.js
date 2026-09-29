"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ExcelToJson_1 = require("./ExcelToJson");
const PathUtil_1 = require("./PathUtil");
function readArg(name) {
    const index = process.argv.indexOf(name);
    if (index > -1 && index + 1 < process.argv.length) {
        return process.argv[index + 1];
    }
    return "";
}
async function main() {
    const projectRoot = path_1.default.resolve(readArg("--project") || (0, PathUtil_1.getDefaultProjectRoot)());
    const configPath = path_1.default.resolve(readArg("--config") || path_1.default.join(projectRoot, "settings/v2/packages/oops-plugin-excel-to-json.json"));
    const serverJsonPath = readArg("--server-json");
    if (!fs_1.default.existsSync(configPath)) {
        throw new Error(`ExcelToJson config not found: ${configPath}`);
    }
    const config = JSON.parse(fs_1.default.readFileSync(configPath, "utf8"));
    await (0, ExcelToJson_1.run)(config, {
        projectRoot,
        serverJsonPath: serverJsonPath || undefined,
    });
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
