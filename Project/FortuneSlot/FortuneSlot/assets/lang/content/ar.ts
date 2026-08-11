import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.ar;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
text.game.balance = "الرصيد";
text.game.win = "الربح";
text.game.extra = `50% إضافية من التكلفة
مطلوب منك لدفع التكاليف الإضافية.
،في وضع التكلفة الإضافية
1x سيتم إزالة رمز المضاعف
.15x من البكرة الخاصة، وسيتم إضافة رمز المضاعف
،في وضع التكلفة الإضافية
سيتم مضاعفة قيمة الجائزة على عجلة الحظ
.1x,2x,3x,5x,10x,15x :بمضاعف عشوائي يمكن أن يكون`
text.game.extraBtn = "تكلفة إضافية",
text.game.autoTip = "اضغط للعب التلقائي"
text.game.round = " :دائري"

text.help.title = "قواعد"
text.help.symbol = "رمز";
text.help.symboContent = '.هذا هو الرمز "البري". يظهر على جميع البكرات ويحل محل جميع الرموز';
text.help.SpecialReel = "بكرة خاصة";
text.help.SpecialReelContent1 = 'البكرة الرابعة هي بكرة خاصة، وتحتوي فقط على رموز المضاعف و';
text.help.SpecialReelContent2 = '.سيتم مضاعفة جميع المكاسب بواسطة المضاعف الموجود في وسط البكرة الخاصة';
text.help.SpecialReelContent3 = '1x، 2x، 3x، 5x، 10x :ستة ناك رموز مضاعفة في وضع التكلفة العادية';
text.help.SpecialReelContent4_1 = ' سيؤدي هبوط  '
text.help.SpecialReelContent4_2 = '  في منتصف البكرة الخاصة إلى تشغيل ';
text.help.SpecialReelContent4_3 = '.عجلة الحظ '
text.help.LuckyWheel = "عجلة الحظ ";
text.help.LuckyWheelContent1 = `سيؤدي تشغيل عجلة الحظ إلى منح قيمة جائزة عشوائية يمكن أن تكون
1x ،3x ،5x ،8x ،10x ،15x ،20x ،30x ،50x ،100x ،200x ،1000x
.من التكلفة`;
text.help.Paytable = "جدول دفع";
text.help.PaytableContent1 = `.تستخدم هذه اللعبة جدول دفع ديناميكي، وتعكس مدفوعات الرموز المعروضة أدناه المبلغ الممنوح لتحقيق المجموعة عند مستوى التكلفة المحدد حاليًا`;
text.help.GameRule = "قواعد اللعبة";
text.help.GameRuleContent1 = `.5 هذه لعبة فيديو بها 3 بكرات وبكرة خاصة واحدة و3 صفوف وعدد خطوط الدفع هو `;
text.help.GameRuleContent2 = '.يتم دفع جميع الرموز الفائزة من اليسار إلى اليمين على خطوط الدفع المحددة';
text.help.GameRuleContent3 = ':خطوط الدفع';
text.help.GameRuleContent4 = '.يتم دفع أعلى قيمة ربح فقط على كل خط دفع';
text.help.GameRuleContent5 = '.عند الفوز على خطوط دفع متعددة، تتم إضافة جميع الأرباح إلى إجمالي الربح';
text.help.GameRuleContent6 = `سيتم تشغيل الألعاب المميزة بنفس إعدادات التكلفة الموجودة في
اللعبة المحفزة`;
text.help.GameRuleContent7 = '.يتم إجراء التركيبات الفائزة والمدفوعات وفقًا لجدول الدفع';
text.help.GameRuleContent8 = `سيتم حساب مبلغ الفوز في وضع التكلفة الإضافية بناءً على
إعدادات التكلفة العادية والرجوع إلى قيم جدول الدفع
`;

text.setting.title = "الإعدادات ";
text.setting.sound = "الصوت";

text.notice.autoEnable = "تم تفعيل السحب التلقائي ";
text.notice.autoDisable = "تم إيقاف السحب التىقائي";
text.notice.playing = "لعب اللعبة";
text.notice.title = "نظام";
text.notice.comfirm = "يتأكد"

text.history.title = "سجل"
text.history.time = "وقت";
text.history.cost = "يكلف";
text.history.result = "تفاصيل النتيجة"
text.history.win = "يفوز"