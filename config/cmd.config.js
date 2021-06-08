
const path = require('path');

const delDist = path.resolve(__dirname, '..', 'step1', 'delDir.js');
const indexDist = path.resolve(__dirname, '..', 'step1', 'getAllWxml.js');
const weappDist = path.resolve(__dirname, '..', 'step1', 'Weapp2Taro.js');

const analise = path.resolve(__dirname, '..', 'analise', 'analisejs.js');

// excuteFn(`node ${delDist} && node ${indexDist} && node ${weappDist}`)

function excuteFn(command, callback) {
  require('child_process')
    .exec(command, {encoding: 'utf-8'}, (err, stdout, stderr) => {
      if (err) {
          console.log(err.stack);
          console.log('err code: ' + err.code);
          console.log('Signal received: ' + err.signal);
      }
      //console.log(err, stdout, stderr);
      console.log('data : ' + stdout);
      callback && callback()
    }).on('exit', function (code) {
        console.log('子进程已退出, 退出码 ' + code);
    });
}
module.exports = function(cmd, arg) {
  switch(cmd) {
    case 'a':
    case 'analise':
      excuteFn(`node ${analise}`)
      break;
    case 'c':
    case 'convert':
      excuteFn(`node ${delDist} && node ${indexDist} && node ${weappDist}`)
      break;
    default:
      console.log(`${cmd}不存在，请输入 --help 查看帮助`);
  }
}