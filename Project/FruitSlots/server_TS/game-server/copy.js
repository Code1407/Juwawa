const fs = require('fs')
// 复制配置文件到打包好的目录中
fs.cp('./config', './dist/config', {recursive: true}, ()=> {
    console.log('build. config files copied');
});