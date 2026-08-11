import path from "path";

export interface ExcelToJsonConfig {
    PathExcel: string;
    PathJsonClient: string;
    PathLangJsonClient?: string;
    PathTsClient: string;
    PathJsonServer?: string;
    PathTsServer?: string;
}

export interface RunOptions {
    projectRoot?: string;
    serverJsonPath?: string;
}

export function getDefaultProjectRoot() {
    return path.resolve(__dirname, "../../..");
}

export function resolveConfigPath(value: string | undefined, projectRoot: string) {
    if (value == null || value.length === 0) {
        return "";
    }

    if (path.isAbsolute(value)) {
        return path.normalize(value);
    }

    if (value.startsWith("project://")) {
        return path.join(projectRoot, value.replace("project://", ""));
    }

    return path.resolve(projectRoot, value);
}
