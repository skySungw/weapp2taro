// 读取所有需要编译文件
const ProgressBar = require('progress');
const fs = require('fs');
const join = require('path').join;
import opn from 'opn';

// 匹配目标目录
let { parseHtmlConfig, port, sourceDir, splitStr, includeDir } = config;

const Koa = require('koa');
const Router = require('koa-router');
const Swig = require('koa-swig');
const co = require('co');
const router = new Router();
const app = new Koa();
// html模板解析
app.context.render = co.wrap(Swig(parseHtmlConfig));

import config from '../weapp2taro.config';
import path from 'path';
const distFile = path.resolve(__dirname, 'dist.json');
import toJson from '../parser/parseJsMethods.js';
const recast = require('recast');
const getData = (code) => {
    const ast = recast.parse(code);
    const arr = toJson(ast);
    // 页面方法对象
    return arr;
}

includeDir.forEach((v, i) => {
    includeDir[i] = sourceDir + splitStr + v;
});
class Weapp {
    constructor() {
        this.jsonFiles = [];
        this.files = this.getJsonFiles(includeDir);
        // 读取对象文件
        this.distData = {};
        // 所有文件长度
        this.len = this.files.length;
        // 写文件长度
        this.count = 0;
        // 进度条
        this.bar = null;
        // wxml文件数量
        this.countJson = {
            wxml: 0,
            js: 0,
            json: 0,
            wxss: 0
        };

        this.init();
    }

    init() {
        this.initBar();
        // 开始遍历所有文件
        this.files.forEach(v => {
            this.readHtml(v);
        });

    }

    initBar() {
        // 设置进度条
        this.bar = new ProgressBar('读取进度: [:bar]:current/:total', { total: this.len, width: Math.floor(this.len / 10), complete: '=' });
    }

    // 读文件数据
    readHtml(file) {
        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) {
                console.log("读取文件出错：", err);
                return false;
            }
            const type = file.split('.').pop();
            const replaceData = this.replaceRules(type, data);
            this.setData(file.split('.')[0], type, replaceData);
        })
    }

    // 存数据JSON
    setData(midName, type, data) {
        if (this.countJson[type] != undefined) {
            this.countJson[type]++;
        }
        this.count++;
        if (!this.distData[midName]) {
            this.distData[midName] = {};
        }
        let usingComponents = null;
        // 对json文件处理
        if (type == 'json') {
            usingComponents = JSON.parse(data);
            if (usingComponents['usingComponents']) {
                // this.distData[midName][type] = usingComponents.usingComponents;
            }
        } else {
            this.distData[midName][type] = data;
            if(type == 'wxml') {
              let methodsArr = [];
              if (/bind\w+\=['|"]/g.test(data)) {
                methodsArr = data.match(/(bind\w+\=['|"])([^' | ^"]+)(['|"])/g)
                methodsArr.forEach((v, i)=> {
                  methodsArr[i] = v.replace(/(bind\w+\=['|"])([^' | ^"]+)(['|"])/g, '$2')
                })
              }

              const uniqueArr = [...new Set(methodsArr)];
              this.distData[midName]['wxmlMethod'] = uniqueArr;
            }
            if (type == 'js') {
              try {
                const arr = getData(data);
                const uniqueArr = [...new Set(arr)];
               
                uniqueArr.forEach((v, i) => {
                  let flag = false; // 没有引用 
                  if (eval("/\\." + v + "\\(/g").test(data)) {
                    flag = true; // 页面中有引用
                  }
                  uniqueArr[i] = (flag ? '': '无引用:') + v;
                });
                this.distData[midName]['jsMethod'] = uniqueArr;
              } catch(err) {
                console.log(`\n${midName} 文件解析有问题，可能包含 ...运算符`);
              }
            }
        }
        // 进度条 +1
        this.bar.tick(1);
        // 读取到所有数据，最后一次写入，暂未做判断
        if (this.count === this.len) {
            this.wHtml(distFile, JSON.stringify(this.distData));
            console.log("数据读取完成!");
            console.log("开始重写wxml文件");
            this.createServer(this.distData);
        }
    }
    // 写文件
    wHtml(file, result) {
      fs.writeFile(file, result, 'utf-8', (err) => {
          if (err) {
              console.log(err);
              return false;
          }
      })
    }
    // 处理js文件，替换wx. to  Taro.
    replaceRules(flag, data) {
        if (flag == 'js') {
            data = data.replace(/(wx\.)(\w*)(\()?/g, 'Taro.$2$3');
        }
        return data;
    }

    // 遍历所有文件夹，文件
    getJsonFiles(includeDir) {
        includeDir.forEach(v => {
            this.findJsonFile(v);
        });
        return this.jsonFiles;
    }

    // 循环遍历文件夹下文件
    findJsonFile(path) {
        let files = fs.readdirSync(path);
        files.forEach((item, index) => {
            let fPath = join(path, item);
            let stat = fs.statSync(fPath);
            if (stat.isDirectory() === true) {
                this.findJsonFile(fPath);
            }
            if (stat.isFile() && !/\.png|\.jpg|\.jpeg|\.gif/ig.test(fPath)) {
                if (/\.vue$|\.scss$/g.test(fPath)) {
                    fs.unlink(fPath, () => {
                        console.log(`delete 文件 ${fPath} 成功`);
                    })
                } else {
                    this.jsonFiles.push(fPath);
                }
            }
        });
    }

    createServer(result) {
      app.use(async ctx => ctx.body = await ctx.render('index', { result }));
      app.listen(port, () => {
        const url = `http:127.0.0.1:${port}`;
        console.log(`${port}端口已成功启动, 请访问 ${url}`);
        opn(url);
      });
    }
}
export default new Weapp();