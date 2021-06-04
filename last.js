const fs = require('fs');
const join = require('path').join;
const http = require('http');
let distJson = {};
readHtml();

// 读demo模板
function readHtml() {
    const file = join('watch', 'dist.json')
    const file2 = join('watch', 'dist2.json')
    fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
            console.log("err", err);
            return false;
        }
        let json = JSON.parse(data);
        for (let n in json) {
            if (json[n]) {
                const name = n.split('/');
                const className = name.reverse()[0] + '-auto-container';
                distJson[n] = {};
                let innerJson = json[n];
                innerJson['vue'] = "<template>";
                innerJson['vue'] += "\n";

                innerJson['vue'] += `<div class="${className}">`;
                innerJson['vue'] += "\n";
                innerJson['vue'] += innerJson['wxml'];
                innerJson['vue'] += "\n";

                innerJson['vue'] += "<div>";
                innerJson['vue'] += "\n";
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

                distJson[n]['json'] = innerJson['json'];

                distJson[n]['scss'] = `.${className} {`
                distJson[n]['scss'] += "\n";
                distJson[n]['scss'] += innerJson['wxss'];
                distJson[n]['scss'] += "\n";
                distJson[n]['scss'] += `}`

                distJson[n]['vue'] = innerJson['vue'];
            }
        }
        wHtml(file2, JSON.stringify(distJson));
    })
}

// 写模板
function wHtml(file, result) {
    fs.writeFile(file, result, 'utf-8', function(err) {
        if (err) {
            console.log(err);
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
            if (stat.isFile() && /(\.wxml|\.vue|\.js)$/.test(fPath) && !/sdk/.test(fPath)) {
                // if (stat.isFile() && /(\.wxml|\.vue|\.js)$/.test(fPath)) {
                jsonFiles.push(fPath);
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