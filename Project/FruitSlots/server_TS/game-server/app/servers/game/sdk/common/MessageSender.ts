import ResponseBase from "./ResponseBase";
import DebugLogger from "./DebugLogger";

export default class MessageSender<T extends ResponseBase> {
    constructor(private dLogger: DebugLogger, private responseBody: T) {
    }

    async postJsonNReceive(signSrc: string, url: string, body: any, headers?: HeadersInit, kick?: () => void): Promise<T> {
        // let headers = {"Content-Type": "application/json;charset=UTF-8"};
        if (!headers) headers = {};
        if (!headers["Content-Type"]) headers["Content-Type"] = "application/json;charset=UTF-8";

        return this.sendNReceive(signSrc, "POST", url, headers, body, kick);
    }

    async getNReceive(signSrc: string, url: string, headers?: HeadersInit, kick?: () => void): Promise<T> {
        if (!headers) headers = {};
        return this.sendNReceive(signSrc, "GET", url, headers, null, kick);
    }

    async sendNReceive(signSrc: string, method: string, url: string, headers?: any, body?: any,
                       kick?: () => void): Promise<T> {
        let resp = {
            type: null,
            status: null,
            statusText: null,
            ok: null,
            text: null
        };

        try {
            this.dLogger.print("sending request to: " + url);
            if (headers) this.dLogger.print("headers: " + JSON.stringify(headers));
            if (body) this.dLogger.print("body: " + JSON.stringify(body));
            if (signSrc) this.dLogger.print("sign src: " + signSrc);

            // 使用fetch完成请求
            let response = await
                (method == "GET"
                        ? fetch(url, headers ? {headers: headers} : null)
                        : fetch(url, {
                            method: method,
                            headers: headers,
                            body: JSON.stringify(body)
                        })
                );

            // 获取响应
            try {
                resp.ok = response.ok;
                resp.type = response.type;
                resp.status = response.status;
                resp.statusText = response.statusText;
                resp.text = await response.text();
                this.dLogger.print("response: " + resp.text);

                if (!resp.ok) {
                    this.dLogger.logError("request failed: !resp.ok");
                    this.logRequest(signSrc, method, url, headers, body);
                    this.logResponse(resp.status, resp.statusText, resp.text);

                    return null
                }

                const respBody = JSON.parse(resp.text);
                if (!respBody) {
                    this.dLogger.logError("response failed: responseBody parse error");
                    this.logRequest(signSrc, method, url, headers, body);
                    this.logResponse(resp.status, resp.statusText, resp.text);

                    return null;
                }

                this.responseBody.setBody(respBody);
                if (this.responseBody.tokenInvalid()) {
                    this.dLogger.logError("response failed: tokenInvalid");
                    this.logRequest(signSrc, method, url, headers, body);
                    this.logResponse(resp.status, resp.statusText, resp.text);

                    kick && kick();

                    return this.responseBody;
                }

                if (this.responseBody.failed()) {
                    this.dLogger.logError("response failed: errorCode = " + this.responseBody.getErrorCode());
                    this.logRequest(signSrc, method, url, headers, body);
                    this.logResponse(resp.status, resp.statusText, resp.text);
                }

                this.dLogger.print("request success!");
                return this.responseBody;
            } catch (e) {
                this.dLogger.logError("parse response exception: " + e);
                if (resp.status && resp.statusText && resp.type) throw `{status: ${resp.status}, statusText: ${resp.statusText}, type: ${resp.type}}`;

                throw e;
            }
        } catch (e) {
            this.dLogger.logError("request exception: " + e);
            this.logRequest(signSrc, method, url, headers, body);

            throw e;
        }
    }

    logRequest(signSrc: string, method: string, url: string, headers: any, body: any) {
        let headerString = typeof headers == "string" ? headers : JSON.stringify(headers);
        let bodyString = typeof body == "string" ? body : JSON.stringify(body);

        this.dLogger.logNotNull(signSrc, "sign src: " + signSrc);
        this.dLogger.logNotNull(method, "method: " + method);
        this.dLogger.logNotNull(url, "url: " + url);
        this.dLogger.logNotNull(headerString, "headers: " + headerString);
        this.dLogger.logNotNull(bodyString, "body: " + bodyString);
    }

    logResponse(statusCode: number, statusText: string, respText: string) {
        this.dLogger.logNotNull(statusCode, "statusCode: " + statusCode);
        this.dLogger.logNotNull(statusText, "statusText: " + statusText);
        this.dLogger.logNotNull(respText, "respText: " + respText);
    }

}
