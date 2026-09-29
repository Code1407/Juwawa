import fs from "fs";
import path from "path";
import { run } from "./ExcelToJson";
import { ExcelToJsonConfig, getDefaultProjectRoot } from "./PathUtil";

function readArg(name: string) {
    const index = process.argv.indexOf(name);
    if (index > -1 && index + 1 < process.argv.length) {
        return process.argv[index + 1];
    }
    return "";
}

async function main() {
    const projectRoot = path.resolve(readArg("--project") || getDefaultProjectRoot());
    const configPath = path.resolve(
        readArg("--config") || path.join(projectRoot, "settings/v2/packages/oops-plugin-excel-to-json.json")
    );
    const serverJsonPath = readArg("--server-json");

    if (!fs.existsSync(configPath)) {
        throw new Error(`ExcelToJson config not found: ${configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as ExcelToJsonConfig;
    await run(config, {
        projectRoot,
        serverJsonPath: serverJsonPath || undefined,
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
