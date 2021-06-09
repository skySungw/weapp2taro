// 读取已知页面信息，并拼装vue文件、scss文件
const fs = require('fs');
const path = require('path');
const config = require('../weapp2taro.config');
let { splitStr } = config;



class RewriteData {
    constructor() {
        this.file = path.resolve(__dirname, 'dist.json')
        this.distJson = {};
        this.readHtml(this.file);
    }
    // 读demo模板
    readHtml(file) {
        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) {
                console.log("err", err);
                return false;
            }
            let json = JSON.parse(data);
            for (let n in json) {
                if (json[n]) {
                    console.log('splitStr', `${splitStr}`)
                    const name = n.split(`${splitStr}`);
                    const className = name.reverse()[0] + '-auto-container';
                    this.distJson[n] = {};
                    let innerJson = json[n];
                    innerJson['vue'] = "<template>";
                    // innerJson['vue'] += "\n";

                    // innerJson['vue'] += `<div class="${className}">`;
                    innerJson['vue'] += "\n";
                    innerJson['vue'] += innerJson['wxml'];
                    innerJson['vue'] += "\n";

                    // innerJson['vue'] += "<div>";
                    // innerJson['vue'] += "\n";
                    innerJson['vue'] += "</template>";
                    innerJson['vue'] += "\n";
                    innerJson['vue'] += "<script>";
                    innerJson['vue'] += "\n";
                    innerJson['vue'] += 'import "./index.scss";';
                    innerJson['vue'] += "\n";

                    let templateJson = innerJson['json'];
                    let components = "{";
                    let componentsCount = 0;
                    for (let templateItem in templateJson) {
                        componentsCount++;
                        const finnalTemplate = templateItem.replace(/\-/ig, '');
                        components += '\n';
                        components += `    '${templateItem}': ${finnalTemplate},`;
                        innerJson['vue'] += `import ${finnalTemplate} from '${templateJson[templateItem]};'`;
                        innerJson['vue'] += "\n";
                    }
                    components += "\n  }";
                    let jsFileData = innerJson['js'];
                    if (jsFileData && componentsCount) {
                        jsFileData = jsFileData.replace(/(export default \{)/g, `$1\n  components:${components},`);
                    }
                    innerJson['vue'] += jsFileData;
                    innerJson['vue'] += "\n";
                    innerJson['vue'] += "</script>";

                    this.distJson[n]['json'] = innerJson['json'];

                    this.distJson[n]['scss'] = `.${className} {`
                    this.distJson[n]['scss'] += "\n";
                    this.distJson[n]['scss'] += innerJson['wxss'];
                    this.distJson[n]['scss'] += "\n";
                    this.distJson[n]['scss'] += `}`

                    this.distJson[n]['vue'] = innerJson['vue'];
                }
            }
            this.genrateDatas();
        })
    }

    // 读demo模板
    genrateDatas() {
        let json = this.distJson;
        for (let n in json) {
            if (json[n]) {
                const path = n.replace(/\\(\w+)$/, '\\');
                this.wHtml(n + '.vue', json[n]['vue']);
                this.wHtml(path + 'index.scss', json[n]['scss']);
            }
        }
    }
    // 写模板
    wHtml(file, result) {
        fs.writeFile(file, result, 'utf-8', function(err) {
            if (err) {
                console.log(err);
                return false;
            }
        })
    }
}

new RewriteData();