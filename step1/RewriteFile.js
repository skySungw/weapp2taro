import fs from 'fs';
const ProgressBar = require('progress');
import config from '../weapp2taro.config';
const { splitStr } = config;

class RewriteFile {
    constructor(filesData, countJson) {
        this.init(filesData, countJson);
    }

    //  filesData - 所有读取后的数据, countJson 各个文件数量
    init(filesData, countJson) {
        // console.log("我要重写wxml文件", files, filesData)
        let json = JSON.parse(filesData);
        let containerFlag = false;
        let count = 0;
        for (let n in json) {
            // 给wxml加个最外层元素
            if (json[n]['wxml']) {
                const name = n.split(splitStr);
                const className = name.reverse()[0] + '-auto-container';
                let wxmlArr = [];
                if (!/-auto-container/g.test(json[n]['wxml'])) {
                    containerFlag = true;
                } else {
                    count++;
                }
                if (containerFlag) {
                    wxmlArr.push(`<view class="${className}">`);
                    wxmlArr.push("\n");
                }
                wxmlArr.push(json[n]['wxml']);
                if (containerFlag) {
                    wxmlArr.push("\n");
                    wxmlArr.push("</view>");
                }
                json[n]['wxml'] = wxmlArr.join("");
                if (json[n]['wxss']) {
                    let wxssArr = [];
                    if (containerFlag) {
                        wxssArr.push(`.${className} {`);
                        wxssArr.push("\n");
                    }
                    wxssArr.push(json[n]['wxss']);
                    if (containerFlag) {
                        wxssArr.push("\n");
                        wxssArr.push(`}`);
                    }
                    json[n]['wxss'] = wxssArr.join("");
                }
            }
        }
        // 返回最终数据
        // return json;
        // 重写wxml文件，在最外层加上父级
        if (count) {
            console.log("当前文件已执行过 convert 命令，不能再次执行!")
            return false;
        } else {
            this.onRewriteWxml(json);
        }
        // 重写js文件
        this.onRewriteJs(json);
    }

    onRewriteJs(data) {
        console.log("开始重写Js文件");
    }

    // 重写wxml文件
    onRewriteWxml(data) {
        console.log("开始重写wxml");
        let total = 0;
        let count = 0;
        const fileType = 'wxml';
        for (let fileName in data) {
            if (data[fileName][fileType]) {
                ++total;
            }
        }
        // 设置进度条
        let writeBar = new ProgressBar('存储进度: [:bar]:current/:total', { total: total, width: Math.floor(total / 10), complete: '=' });
        for (let n in data) {
            if (data[n][fileType]) {
                // 进度条 +1
                writeBar.tick(1);
                this.wHtml(++count === total, n + '.' + fileType, data[n][fileType]);
            }
        }

    }

    // 写文件
    wHtml(flag, file, result) {
        fs.writeFile(file, result, 'utf-8', (err) => {
            if (err) {
                console.log(err);
                return false;
            }
            if (flag) {
                console.log("wxml文件全部重写完毕!");
            }
        })
    }

}
export default RewriteFile;