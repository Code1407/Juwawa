
type ResponseErrorCode = number;

export default abstract class ResponseBase {
    constructor(protected successCode: ResponseErrorCode, protected insufficientBalanceCode: ResponseErrorCode,
                protected invalidTokenCode: ResponseErrorCode, protected invalidSignCode: ResponseErrorCode) {
    }

    abstract setBody(body: any);
    abstract getNickname(): string;
    abstract getAvatar(): string;
    abstract getBalance(): number;
    abstract getOrderId(): string;
    abstract getErrorCode(): number;
    abstract getData(): any;
    getLevel(): number {
        return 0;
    }
    signInvalid(): boolean {
        return this.getErrorCode() == this.invalidSignCode;
    }
    tokenInvalid(): boolean {
        return this.getErrorCode() == this.invalidTokenCode;
    }
    insufficientBalance(): boolean {
        return this.getErrorCode() == this.insufficientBalanceCode;
    }
    success(): boolean {
        return this.getErrorCode() == this.successCode;
    }
    failed(): boolean {
        return !this.success();
    }
    getTime(): Date {
        return new Date();
    }
}
