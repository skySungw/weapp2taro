// 读取所有需要编译文件
const ProgressBar = require('progress');
const fs = require('fs');
const path = require('path');
const join = require('path').join;

let config = require('../weapp2taro.config');
const RewriteFile = require('./RewriteFile');
// 匹配目标目录

let { outPutDir, splitStr, includeDir } = config;
includeDir.forEach((v, i) => {
    includeDir[i] = outPutDir + splitStr + v;
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
                this.distData[midName][type] = usingComponents.usingComponents;
            }
        } else {
            this.distData[midName][type] = data;
        }
        // 进度条 +1
        this.bar.tick(1);
        // 读取到所有数据，最后一次写入，暂未做判断
        if (this.count === this.len) {
            // wHtml(distFile, JSON.stringify(this.distData));
            console.log("数据读取完成!");
            console.log("开始重写wxml文件");
            new RewriteFile(JSON.stringify(this.distData), this.countJson);
        }
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
}
module.exports = new Weapp();