import path from "path";

export interface ExcelToJsonConfig {
    PathExcel: string | undefined;
    PathJsonClient: string | undefined;
    PathLangJsonClient?: string | undefined;
    InitPathLangJsonClient?: string | undefined;
    PathTsClient: string | undefined;
    PathJsonServer?: string | undefined;
    PathTsServer?: string | undefined;
}
