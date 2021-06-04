import fs from 'fs';
const join = require('path').join;

const files = getJsonFiles("src");
const pageFilters = 'src\\pages';
const componentFilters = 'src\\component';
import toJson from '../parser/json-parser.js';

const recast = require('recast');
const getData = (code) => {
    const ast = recast.parse(code);
    const res = toJson(ast);
    //将AST对象重新转回可以阅读的代码
    return recast.print(res).code;
}

let distData = {
    wxml: null,
    wxss: null,
    js: null,
    json: null
}

files.forEach(v => {
    getFiles(v);
});

// 读所有src下文件
function getFiles(file) {
    if (file.indexOf(pageFilters) != -1 || file.indexOf(componentFilters) != -1) {
        if (file.split('.').pop() !== 'vue') {
            // midName = file.split('.')[0].split('\/').pop();
            readHtml(file);
        }
    }
}

// 读demo模板
function readHtml(file) {
    fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
            console.log("errs", err);
            return false;
        }
        const type = file.split('.').pop();
        if (type == 'js') {
            try {
                const code = getData(data)
                wHtml(file, code);
            } catch (err) {
                console.log("filesss", file);
            }

        }

    })
}
// set json数据
function setData(midName, type, data) {
    if (!distData[midName]) {
        distData[midName] = {};
    }
    let usingComponents = null;
    if (type == 'json') {
        usingComponents = JSON.parse(data);
        if (usingComponents['usingComponents']) {
            distData[midName][type] = usingComponents.usingComponents;
        }
        return false;
    }
    distData[midName][type] = data;
}

// 写模板
function wHtml(file, result) {
    fs.writeFile(file, result, 'utf-8', function(err) {
        if (err) {
            console.log('abc', err);
            return false;
        }
    })
}
// 遍历所有文件夹，文件
function getJsonFiles(jsonPath) {
    let jsonFiles = [];

    function findJsonFile(path) {
        let files = fs.readdirSync(path);
        files.forEach(function(item, index) {
            let fPath = join(path, item);
            let stat = fs.statSync(fPath);
            if (stat.isDirectory() === true) {
                findJsonFile(fPath);
            }
            if (stat.isFile() && !/\.png|\.jpg|\.jpeg|\.gif/ig.test(fPath)) {
                jsonFiles.push(fPath);
                if (/\.vue$ | \.scss$ | \.index\.config\.js$/ig.test(fPath)) {
                    fs.unlink(fPath, function() {
                        // console.log(`delete 文件 ${fPath} 成功`);
                    })
                }
            }
        });
    }
    findJsonFile(jsonPath);
    return jsonFiles;
}