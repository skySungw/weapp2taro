const fs = require('fs');
const join = require('path').join;
const http = require('http');

const files = getJsonFiles("src");
const pageFilters = 'src\/pages';
const componentFilters = 'src\/component';
const dist = join('watch', 'dist.json');

let distCount = 0;
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
            midName = file.split('.')[0].split('\/').pop();
            readHtml(midName, file, distCount++);
        }
    }
}

// 读demo模板
function readHtml(midName, file, count) {
    fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
            console.log("errs", err);
            return false;
        }
        const type = file.split('.').pop();
        const replaceData = replaceRules(type, data);
        setData(file.split('.')[0], type, replaceData);
        wHtml(dist, JSON.stringify(distData));
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
// 转换 匹配js文件 、html文件
function replaceRules(flag, data) {
    if (flag == 'js') {
        data = data.replace(/(wx\.)(\w*)(\()?/g, 'Taro.$2$3');
    } else if (flag == 'wxml') {
        data = data.replace(/(wx\:)(\w*)(\=\"\s*\")?/ig, 'v-$2$3');
        data = data.replace(/(v\-)(elif)(\=)?/ig, '$1else-if$3');
        data = data.replace(/(v\-)(key)(\=)?/ig, ':key$3');
        data = data.replace(/(v-\w*)(\=\")(\{\{})/ig, '$1$2')
        data = data.replace(/(bind)(\w*)(\=)/ig, '@$2$3');
        // data = data.replace(/(class\=\"\{\{)/g, '<font color="red">$1</font>');
        // var regex3 = /\{\{(.+?)\}\}/ig; // {} 花括号，大括号

        // data = data.replace(regex3, '<font color="red">$1</font>');

        // data = data.replace(/\<block/ig, '&lt;block');
        // data = data.replace(/\<\/block/ig, '&lt;\/block');
        // data = data.replace(/\<view/ig, '&lt;view');
        // data = data.replace(/\<\/view/ig, '&lt;\/view');
        // data = data.replace(/\<text/ig, '&lt;text');
        // data = data.replace(/\<\/text/ig, '&lt;\/text');
        // data = data.replace(/\<image/ig, '&lt;image');
        // data = data.replace(/\<\/image/ig, '&lt;\/image');
        // data = data.replace(/\<input/ig, '&lt;input');
        // data = data.replace(/\<\/input/ig, '&lt;\/input');
        // data = data.replace(/\<button/ig, '&lt;button');
        // data = data.replace(/\<\/button/ig, '&lt;\/button');
    }
    return data;
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
            // if (stat.isFile() && /(\.wxml|\.vue|\.js)$/.test(fPath) && !/sdk/.test(fPath)) {
            // if (stat.isFile() && /(\.wxml|\.vue|\.js)$/.test(fPath)) {
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
// demo httpServer
function createServer(result) {
    http.createServer((req, res) => {
        res.write('<head><meta charset="utf-8"></meta></head>')
        res.write(result);
        res.end();
    }).listen(3001);
}