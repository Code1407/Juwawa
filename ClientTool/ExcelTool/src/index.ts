
import { run } from "./ExcelToJson";

function readArg(name: string) {
    const index = process.argv.indexOf(name);
    if (index > -1 && index + 1 < process.argv.length) {
        return process.argv[index + 1];
    }
    return "";
}

async function main() {
    const excelDir = readArg("--excel")
    const clientDir = readArg("--client")
    const clientTs = readArg("--ts")
    const serverDir = readArg("--server")
    const langDir = readArg("--lang")
    const initLangDir = readArg("--initlang")
    const cfg = {
        PathExcel: excelDir.length === 0 ? undefined : excelDir,
        PathJsonClient: clientDir.length === 0 ? undefined : clientDir,
        PathLangJsonClient: langDir.length === 0 ? undefined : langDir,
        InitPathLangJsonClient: initLangDir.length === 0 ? undefined : initLangDir,
        PathTsClient: clientTs.length === 0 ? undefined : clientTs,
        PathJsonServer: serverDir.length === 0 ? undefined : serverDir
    }
    console.log(cfg)
    await run(cfg);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
