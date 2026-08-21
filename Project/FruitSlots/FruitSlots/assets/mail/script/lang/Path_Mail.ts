export class Path {
    path0: string;
    path1: string;
    path2: string;
    path3: string;
}
export let paths: Path = {
    path0: "/GlobalMailUI/view_mail_main/root/bg_main/btn_deleteAll/label",
    path1: "/GlobalMailUI/view_mail_main/root/Content/common/btn_receive/Label",
    path2: "/GlobalMailUI/view_mail_main/root/Content/common/received/Label",
    path3: "/GlobalMailUI/view_mail_main/root/bg_main/lab_title",
}
export let textsMap: { [lang: string]: Path } = {};


export class MailLang {
    lang:{[langKey: string]: string} = {}
}
export let mailLangMap: { [lang: string]: MailLang } = {};