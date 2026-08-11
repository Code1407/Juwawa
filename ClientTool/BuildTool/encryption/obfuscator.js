const JavaScriptObfuscator = require("javascript-obfuscator");
const fs = require("fs-extra");
const path = require("path");

function levelToOptions(level) {
  // 你可以按项目实际再微调参数；这里只给一个清晰的等级映射
  switch (level) {
    case 0:
      return { compact: true };
    case 1:
      return {
        "compact": true,
        "controlFlowFlattening": true,
        "controlFlowFlatteningThreshold": 0.75,
        "deadCodeInjection": false,
        "stringArray": true,
        "stringArrayThreshold": 0.75 
      };
    case 2:
      return {
		"compact": true,
		"controlFlowFlattening": true,
		"controlFlowFlatteningThreshold": 0.9,
		"deadCodeInjection": true,
		"deadCodeInjectionThreshold": 0.4,
		"renameGlobals": false,
		"stringArray": true,
		"stringArrayEncoding": ["base64"],
		"stringArrayThreshold": 0.9,
		"transformObjectKeys": true
      };
    case 3:
      return {
		"compact": true,
		"controlFlowFlattening": true,
		"controlFlowFlatteningThreshold": 1,
		"deadCodeInjection": true,
		"deadCodeInjectionThreshold": 0.5,
		"renameGlobals": true,
		"stringArray": true,
		"stringArrayEncoding": ["rc4"],
		"stringArrayThreshold": 1,
		"transformObjectKeys": true 
      };
	case 4:
      return {
		"compact": true,
		"controlFlowFlattening": true,
		"controlFlowFlatteningThreshold": 1,
		"deadCodeInjection": true,
		"deadCodeInjectionThreshold": 1,
		"renameGlobals": true,
		"stringArray": true,
		"stringArrayEncoding": ["base64", "rc4"],
		"stringArrayThreshold": 1,
		"transformObjectKeys": true,
		"unicodeEscapeSequence": true,
		"disableConsoleOutput": true 
      };
  }
}

// 同步递归混淆：脚本退出 = 全部完成
function findAndObfusJSFile(dir, options) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.lstatSync(fullPath).isDirectory()) {
      findAndObfusJSFile(fullPath, options);
    } else if (item.endsWith(".js")) {
      const data = fs.readFileSync(fullPath, "utf8");
      const obfuscatedData = JavaScriptObfuscator.obfuscate(data, options).getObfuscatedCode();
      fs.writeFileSync(fullPath, obfuscatedData, "utf8");
    }
  }
}

module.exports = { findAndObfusJSFile };

// CLI:
// node obfuscator.js "E:\...\web-mobile\assets" --level 2
if (require.main === module) {
  const buildPath = process.argv[2];
  let level = 2;

  for (let i = 3; i < process.argv.length; i++) {
    if (process.argv[i] === "--level") {
      level = parseInt(process.argv[i + 1] || "2", 10);
      i++;
    }
  }
  if (Number.isNaN(level)) level = 2;

  if (!buildPath) {
    console.error("[OBF] missing buildPath");
    process.exit(2);
  }
  if (!fs.existsSync(buildPath)) {
    console.error("[OBF] buildPath not exists:", buildPath);
    process.exit(3);
  }

  const options = levelToOptions(level);
  console.log(`[OBF] Start. Dir=${buildPath} level=${level}`);

  try {
    findAndObfusJSFile(buildPath, options);
    console.log("[OBF] Done");
    process.exit(0);
  } catch (e) {
    console.error("[OBF] Failed:", e && e.stack ? e.stack : e);
    process.exit(1);
  }
}