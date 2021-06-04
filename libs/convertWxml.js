const fs = require('fs');
const join = require('path').join;
const http = require('http');
const path = require('path');
const compiler = require('vue-template-compiler')

const files = getJsonFiles("src");
const pageFilters = 'src\\pages';
const componentFilters = 'src\\component';

let str = '';
let count = 0;
// let acorn = require("acorn");
// console.log(acorn.parse("1 + 1", { ecmaVersion: 2020 }));

const getData = code => {
    return compiler.compile(code, false);
}

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
        if (type == 'wxml') {
            try {
                const code = getData(data)

                deleteEmptyProperty(code);
                const renderTreeData = code.ast;
                const domRes = startGenerator(renderTreeData);
                wHtml(file, domRes);
            } catch (err) {
                console.log("filesss", file);
            }

        }

    })
}
// 删除 parent的循环引用
function deleteEmptyProperty(object) {
    for (var i in object) {
        var value = object[i];
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                if (value.length == 0) {
                    delete object[i];
                    continue;
                }
            }
            if (i == 'parent') {
                delete object[i];
            } else {
                deleteEmptyProperty(value);
            }
        } else {
            if (i == 'parent') {
                delete object[i];
            }
        }
    }
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
                        console.log(`delete 文件 ${fPath} 成功`);
                    })
                }
            }
        });
    }
    findJsonFile(jsonPath);
    return jsonFiles;
}



// attribute 转字符串
function setAttributeMethod(key, value) {
    let attrStr = `:${key}=`;
    let classArr = [];
    let arr = [];
    if (key == 'class') {
        value = value.replace(/\s+/g, '');
        value = value.replace(/(\{\{)([^}]+)(\}\})/g, ' $2');

        arr = value.split(' ');

        arr.forEach(v => {
            let obj = {};
            if (/\?/.test(v)) {
                let attrInnerArr = v.split('?');
                let attrInnerKey = attrInnerArr[1].split(':')[0].replace(/\'|\"/g, '');
                let attrInnerValue = `${attrInnerArr[0]}`;
                obj[attrInnerKey] = attrInnerValue;
                // 动态添加一个class
                classArr.push(obj);
            } else {
                classArr.push(v);
            }
        })
    } else if (key == 'style') {
        // style="height:{{windowHeight - (navBarHeight + tabBarHeight + 62)}}px"

    }
    let vvalue = `'${JSON.stringify(classArr)}'`.replace(/\:\"([^"]+)\"/g, ':$1');
    return attrStr + vvalue;
}

// 下面用来拼dom元素
function startGenerator(rootData) {
    count += 2;
    if (!rootData['tag']) {
        return false;
    }
    str += '\n';
    let nbspNum = '';
    for (let i = 0; i < count; i++) {
        nbspNum += ' '
    }
    // 拼标签
    str += `${nbspNum}<${rootData['tag']}`;
    // 拼属性
    const attrObj = rootData['attrsMap'];
    // 动态属性过滤
    let filterArr = ['class', 'style'];
    if (attrObj) {
        for (let attrItem in attrObj) {
            // 如果属性中有变量 {{}}
            if (filterArr.includes(attrItem) && /\{\{([^}]+)\}\}/.test(attrObj[attrItem])) {
                str += ' ' + setAttributeMethod(attrItem, attrObj[attrItem]);
            } else if (/^\{\{([^}]+)\}\}$/.test(attrObj[attrItem])) {
                // 属性中，只有 {{ xxx }} 
                const wxKeysObj = {
                    'wx:if': 'v-if',
                    'wx:elif': 'v-else-if',
                    'wx:else': 'v-else',
                    'wx:for': 'v-for',
                }
                let attrStr = '';
                // 如果是wx:for，需要拼 v-for="(item, index) in list"
                if (attrItem == 'wx:for') {
                    let letItem = 'item';
                    let letIndex = 'index';
                    if (attrObj['wx:for-item']) {
                        letItem = attrObj['wx:for-item'];
                    }
                    if (attrObj['wx:key']) {
                        letIndex = attrObj['wx:key'];
                    }
                    attrStr = wxKeysObj[attrItem];
                    str += ` ${attrStr}="(${letItem}, ${letIndex}) in ${attrObj[attrItem].replace(/^(\{\{)([^}]+)(\}\})$/, '$2')}"`;
                } else {
                    // wx:for 以外的 ,wxKeysObj 里的替换
                    if (wxKeysObj[attrItem]) {
                        attrStr = wxKeysObj[attrItem]
                    } else {
                        attrStr = `:${attrItem}`;
                    }
                    str += ` ${attrStr}="${attrObj[attrItem].replace(/^(\{\{)([^}]+)(\}\})$/, '$2')}"`;
                }

            } else {
                // 属性中 没有 花括号的 {{ }}
                const wxNoneConfig = {
                    'wx:key': ':key'
                };
                // 如果有 wx:item, wx:key
                if (attrItem == 'wx:for-item') {
                    str += '';
                } else if (attrItem == 'wx:key') {
                    str += ` ${wxNoneConfig[attrItem]}="${attrObj[attrItem]}"`;
                } else {
                    str += ` ${attrItem}="${attrObj[attrItem]}"`;
                }
            }
            // str += ` ${attrItem}="${attrObj[attrItem]}"`;
        }
    }
    // 开始标签闭合
    str += '>';
    // 如果标签中间有内容，拼content expression
    const childrenExp = rootData['children'];
    console.log("childrenExp", childrenExp)
    if (childrenExp && childrenExp.length) {
        childrenExp.forEach(childItem => {
            if (childItem['text']) {
                str += childItem.text;
            }
        })
    }
    // 判断闭合标签是否需要换行
    let breakFlag = false;
    // 拼子元素
    const childArr = rootData['children'];
    if (childArr && childArr.length) {
        breakFlag = true;
        childArr.forEach(v => {
            startGenerator(v);
        })
    }
    // 拼结束标签
    if (breakFlag) {
        str += '\n';
        str += `${nbspNum}</${rootData['tag']}>`;
    } else {
        str += `</${rootData['tag']}>`;
    }
    return str;
}