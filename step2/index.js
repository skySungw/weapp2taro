// 读取转taro后的 wxml、json、js、wxss文件，并存储
const fs = require('fs');
const path = require('path');
const join = path.join;

let config = require('../weapp2taro.config');
const userConfig = require(path.resolve(process.cwd(), 'weapp2taro.config.json'));

config = Object.assign({}, config, userConfig);
let { outPutDir, splitStr, includeDir } = config;

includeDir.forEach((v, i) => {
    includeDir[i] = outPutDir + splitStr + v;
});

const dist = path.resolve(__dirname, 'dist.json');

class CreateView {
    constructor() {
        this.jsonFiles = [];
        this.files = this.getJsonFiles(includeDir);
        // 读取后最终数据
        this.distData = {};
        this.init();
    }
    init() {
        this.files.forEach(v => {
            this.readHtml(v);
        });
    }

    // 读模板数据
    readHtml(file) {
        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) {
                console.log("errs", err);
                return false;
            }
            const type = file.split('.').pop();
            this.setData(file.split('.')[0], type, data);
            this.wHtml(dist, JSON.stringify(this.distData));
        })
    }

    setData(midName, type, data) {
        if (!this.distData[midName]) {
            this.distData[midName] = {};
        }
        let usingComponents = null;
        if (type == 'json') {
            usingComponents = JSON.parse(data);
            if (usingComponents['usingComponents']) {
                this.distData[midName][type] = usingComponents.usingComponents;
            }
            return false;
        }
        this.distData[midName][type] = data;
    }

    // 写模板
    wHtml(file, result) {
        fs.writeFile(file, result, 'utf-8', (err) => {
            if (err) {
                console.log("write wrong!")
                return false;
            }
        })
    }

    // 遍历所有文件夹，文件
    getJsonFiles(includeDir) {
        includeDir.forEach(v => {
            this.findJsonFile(v);
        });
        return this.jsonFiles;
    }

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
                        // console.log(`delete 文件 ${fPath} 成功`);
                    })
                } else {
                    this.jsonFiles.push(fPath);
                }
            }
        });
    }
}

new CreateView();