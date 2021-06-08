const fs = require('fs');
const path = require('path');
const config = require('../weapp2taro.config');

const { sourceDir, outPutDir, splitStr } = config;

// 做删除,copy文件准备
class PrepareParam {
    constructor() {
        this.dirName = outPutDir;
        this.dirPath = path.resolve(__dirname, '..', outPutDir);
        this.deleteFolderRecursive(this.dirPath);
    }

    // 删除文件夹
    deleteFolderRecursive(url) {
        let files = [];
        /**
         * 判断给定的路径是否存在
         */
        if (fs.existsSync(url)) {
            /**
             * 返回文件和子目录的数组
             */
            files = fs.readdirSync(url);
            files.forEach((file, index) => {

                let curPath = path.join(url, file);
                /**
                 * fs.statSync同步读取文件夹文件，如果是文件夹，在重复触发函数
                 */
                if (fs.statSync(curPath).isDirectory()) { // recurse
                    this.deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            /**
             * 清除文件夹
             */
            fs.rmdirSync(url);
            if (this.dirPath == url) {
                this.createFolder();
            }
        } else {
            this.createFolder();
        }
    }

    // 创建文件夹
    createFolder() {
        try {
            fs.mkdirSync(this.dirName);
            this.copyFolder(sourceDir, this.dirName);
        } catch (err) {
            console.log("fail", err);
        }
    }

    // copy文件夹
    copyFolder(src, dst) {
        //读取目录
        fs.readdir(src, (err, paths) => {
            if (err) {
                throw err;
            }
            paths.forEach((path) => {
                let _src = src + splitStr + path;
                let _dst = dst + splitStr + path;
                let readable;
                let writable;
                fs.stat(_src, (err, st) => {
                    if (err) {
                        throw err;
                    }
                    if (st.isFile()) {
                        readable = fs.createReadStream(_src); //创建读取流
                        writable = fs.createWriteStream(_dst); //创建写入流
                        readable.pipe(writable);
                    } else if (st.isDirectory()) {
                        this.existFolder(_src, _dst);
                    }
                });
            });
        });
    }

    existFolder(src, dst) {
        //测试某个路径下文件是否存在
        const exists = fs.existsSync(dst);
        if (exists) { //存在
            this.copyFolder(src, dst);
        } else { // 不存在
            try {
                fs.mkdirSync(dst);
                this.copyFolder(src, dst);
            } catch (err) {
                console.log("创建文件夹失败:", err);
            }
        }
    }
}
module.exports = new PrepareParam();