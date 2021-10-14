const path = require('path');
const fs = require('fs');
let config = {
    port: 8877,
    parseHtmlConfig: {
      root: path.resolve(__dirname, 'views'), // 视图文件路径
      autoescape: true, // false:解析模板数据中的html
      cache: false, // 'memory':请用缓存，避免每次刷新页面都去解析模板
      ext: 'html'
    },
    compute: 'mac', // 'windows' | 'mac'
    // filePaths: ['src\\pages', 'src\\component'], // 需要匹配的目录
    sourceDir: 'src', // 源文件目录
    includeDir: ['pages', 'component'], // 需要转换的文件目录
    outPutDir: 'convertDir' // 转换后文件目录
}
const configJson = 'weapp2taro.config.json';
// fs.exists(process.cwd(), (exists) => {
//   console.log(exists ? '存在' : '不存在');
// });
const filePath = path.resolve(process.cwd(), configJson);
if (fs.existsSync(filePath)) {
  try {
    const userConfig = require(filePath);
    config = Object.assign({}, config, userConfig);
  } catch(err) {
    console.log(configJson + ' 配置文件异常');
  }
} else {
  console.log('如有特殊配置，请在执行目录下配置' + configJson + ' 文件');
}
config.splitStr = config.compute == 'windows' ? '\\' : '\/';
module.exports = config;