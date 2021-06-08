const fs = require('fs');
const join = require('path').join;
const compiler = require('vue-template-compiler')
const config = require('../weapp2taro.config');
// 匹配目标目录
const { outPutDir, splitStr, includeDir } = config;
includeDir.forEach((v, i) => {
    includeDir[i] = outPutDir + splitStr + v;
});
class Weapp2Taro {
    constructor() {
        this.currentFileIndex = 0;
        this.codeStr = '';
        this.jsonFiles = [];
        this.files = this.getJsonFiles(includeDir);
        this.start(0);
    }
    start(count) {
        // 遍历所有文件
        this.init();
        if (this.files.length > count) {
            // console.log("count", count + 1, "共:", this.files.length);
            this.readHtml(this.files[count]);
        }
    }

    init() {
        this.codeStr = '';
    }

    getData(code) {
        return compiler.compile(code, false);
    }

    // attribute 转字符串
    setAttributeMethod(key, value) {
        let attrStr = `:${key}`;
        let classArr = [];
        let arr = [];
        if (key == 'class') {
            let matchArr = value.match(/(\{\{)([^}]+)(\}\})/g);
            value = value.replace(/(\{\{)([^}]+)(\}\})/g, '');

            matchArr.forEach((m, n) => {
                m = m.replace(/(\{\{)([^}]+)(\}\})/g, '($2)');
                matchArr[n] = m;
            })

            classArr = value.split(' ');

            classArr = classArr.concat(matchArr);

            for (let arrIndex = classArr.length - 1; arrIndex >= 0; arrIndex--) {
                if (!classArr[arrIndex].trim()) {
                    classArr.splice(arrIndex, 1);
                }
            }
            let vvalue = `${classArr}`;
            return classArr.length ? `${attrStr}="[${vvalue}]"` : attrStr;
        } else if (key == 'style') {
            // style="height:{{windowHeight - (navBarHeight + tabBarHeight + 62)}}px"
            value = value.replace(/(\{\{)([^}]+)(\}\})/g, '$2');
            value = value.replace(/\;$/, '');
            value = `\{${value.replace(/\;/g, ',')}\}`;
            return `${attrStr}="${value}"`;
        }

    }

    // 下面用来拼dom元素
    startGenerator({ rootData, num, file }) {
        let count = num || 0;
        count += 2;
        if (!rootData['tag']) {
            return false;
        }
        // 标签名
        const tagName = rootData['tag'];

        this.codeStr += '\n';
        let nbspNum = '';
        for (let i = 0; i < count; i++) {
            nbspNum += ' '
        }
        // 拼标签
        this.codeStr += `${nbspNum}<${tagName}`;
        // 拼属性
        const attrObj = rootData['attrsMap'];
        // 动态属性过滤
        let filterArr = ['class', 'style'];
        if (attrObj) {
            for (let attrItem in attrObj) {
                // 属性值
                let attrValue = attrObj[attrItem];
                // 如果属性中有变量 {{}}
                if (filterArr.includes(attrItem) && /\{\{([^}]+)\}\}/.test(attrValue)) {
                    this.codeStr += ' ' + this.setAttributeMethod(attrItem, attrValue);
                } else if (/^\{\{([^}]+)\}\}$/.test(attrValue)) {
                    // 属性中，只有 {{ xxx }} 
                    const wxKeysObj = {
                        'wx:if': 'v-if',
                        'wx:elif': 'v-else-if',
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
                        let noKey = false;
                        if (attrObj['wx:key']) {
                            letIndex = attrObj['wx:key'];
                            if (attrObj['wx:key'] == '*this') {
                                noKey = true;
                                attrObj['wx:key'] = letItem;
                            }
                        }
                        attrStr = wxKeysObj[attrItem];
                        // :key="*this" 转换
                        if (noKey) {
                            this.codeStr += ` ${attrStr}="${letItem} in ${attrValue.replace(/^(\{\{)([^}]+)(\}\})$/, '$2')}"`;
                        } else {
                            this.codeStr += ` ${attrStr}="(${letItem}, ${letIndex}) in ${attrValue.replace(/^(\{\{)([^}]+)(\}\})$/, '$2')}"`;
                        }
                    } else {
                        // wx:for 以外的 ,wxKeysObj 里的替换
                        if (wxKeysObj[attrItem]) {
                            attrStr = wxKeysObj[attrItem]
                        } else {
                            attrStr = `:${attrItem}`;
                        }
                        this.codeStr += ` ${attrStr}="${attrValue.replace(/^(\{\{)([^}]+)(\}\})$/, '$2')}"`;

                    }

                } else {
                    // 属性中 没有 花括号的 {{ }}
                    const wxNoneConfig = {
                        'wx:key': ':key',
                        'wx:else': 'v-else'
                    };
                    // 如果有 wx:item, wx:key
                    if (attrItem == 'wx:for-item') {
                        this.codeStr += '';
                    } else if (attrItem == 'wx:key') {
                        this.codeStr += ` ${wxNoneConfig[attrItem]}="${attrValue}"`;
                    } else if (attrItem == 'wx:else') {
                        this.codeStr += ` ${wxNoneConfig[attrItem]}`;
                    } else if (attrItem == 'src') {
                        // 如果是 image标签,并且没有变量
                        if (tagName == "image") {
                            // 图片路径是否是动态的
                            let imageAsync = false;
                            let imageArr = [];
                            // 如果有绝对路径,需要转成相对路径
                            if (/^\//.test(attrValue)) {
                                const len = file.split(splitStr).length - 2;
                                imageArr = new Array(len).fill('..');
                            }
                            if (imageArr.length) {
                                attrValue = attrValue.replace(/^\//, '');
                                imageArr.push(attrValue);
                                let finnalImageUrl = imageArr.join('/');
                                if (/\{\{([^}]+)\}\}/g.test(finnalImageUrl)) {
                                    imageAsync = true;
                                    finnalImageUrl = `'${finnalImageUrl}'`;
                                    finnalImageUrl = finnalImageUrl.replace(/(\{\{)([^}]+)(\}\})/g, "\'+$2+\'");
                                }
                                this.codeStr += ` ${imageAsync ? ':' : ''}${attrItem}="${finnalImageUrl}"`;
                            } else {
                                // 如果路径里有变量
                                if (/\{\{([^}]+)\}\}/g.test(attrValue)) {
                                    imageAsync = true;
                                    attrValue = `'${attrValue}'`;
                                    attrValue = attrValue.replace(/(\{\{)([^}]+)(\}\})/g, "\'+$2+\'");
                                }
                                this.codeStr += ` ${imageAsync ? ':' : ''}${attrItem}="${attrValue}"`;
                            }
                        }
                    } else {
                        if (attrValue) {
                            this.codeStr += ` ${attrItem}="${attrValue}"`;
                        } else {
                            this.codeStr += ` ${attrItem}`;
                        }
                    }
                }
                // str += ` ${attrItem}="${attrValue}"`;
            }
        }
        // 开始标签闭合
        this.codeStr += '>';
        // 如果标签中间有内容，拼content expression
        const childrenExp = rootData['children'];
        if (childrenExp && childrenExp.length) {
            childrenExp.forEach(childItem => {
                if (childItem['text']) {
                    this.codeStr += childItem.text;
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
                this.startGenerator({ rootData: v, num: count, file: file });
            })
        }
        // 拼结束标签
        if (breakFlag) {
            this.codeStr += '\n';
            this.codeStr += `${nbspNum}</${tagName}>`;
        } else {
            this.codeStr += `</${tagName}>`;
        }
        return this.codeStr;
    }

    // 删除 parent的循环引用
    deleteEmptyProperty(object) {
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
                    this.deleteEmptyProperty(value);
                }
            } else {
                if (i == 'parent') {
                    delete object[i];
                }
            }
        }
    }

    // 写模板
    wHtml(file, result) {
        fs.writeFile(file, result, 'utf-8', (err) => {
            if (err) {
                console.log('abc', err);
                return false;
            }
            this.startNext();
        })
    }

    // 读下一个文件
    startNext() {
        // 写下一个文件
        this.start(++this.currentFileIndex);
    }

    // 读demo模板
    readHtml(file) {
        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) {
                console.log("errs", err);
                return false;
            }
            if (!data) {
                console.log("没有数据的空wxml文件", file);
                this.startNext();
            } else {
                const type = file.split('.').pop();
                if (type == 'wxml') {
                    try {
                        const code = this.getData(data)
                        this.deleteEmptyProperty(code);
                        const renderTreeData = code.ast;
                        const domRes = this.startGenerator({ rootData: renderTreeData, file: file });
                        this.wHtml(file, domRes);
                    } catch (err) {
                        console.log("filesss", file, err);
                    }

                }
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

    // 循环遍历文件夹下文件
    findJsonFile(path) {
        let files = fs.readdirSync(path);
        files.forEach((item, index) => {
            let fPath = join(path, item);
            let stat = fs.statSync(fPath);
            if (stat.isDirectory() === true) {
                this.findJsonFile(fPath);
            }
            if (stat.isFile() && /\.wxml/ig.test(fPath)) {
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

module.exports = new Weapp2Taro();