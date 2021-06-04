const fs = require('fs');
const join = require('path').join;
const http = require('http');
let distJson = {};
readHtml();

// 读demo模板
function readHtml() {
    const file = join( 'watch', 'dist.json')
    const file2 = join( 'watch', 'dist2.json')
    fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
            console.log("err", err);
            return false;
        }
        let json = JSON.parse(data);
        for (let n in json) {
            if (json[n]) {
                distJson[n] = {};
                let innerJson = json[n];
                innerJson['vue'] = "<template>";
                innerJson['vue'] += "\n";

                innerJson['vue'] += "<view>";
                innerJson['vue'] += "\n";
                innerJson['vue'] += innerJson['wxml'];
                innerJson['vue'] += "\n";

                innerJson['vue'] += "<view>";
                innerJson['vue'] += "\n";
                innerJson['vue'] += "</template>";
                innerJson['vue'] += "\n";
                innerJson['vue'] += "<script>";
                innerJson['vue'] += "\n";
                innerJson['vue'] += 'import "./index.scss";';
                innerJson['vue'] += "\n";

                let templateJson = innerJson['json'];
                console.log("json", innerJson['json']);
                let components = {};
                for (let templateItem in templateJson) {
                    const finnalTemplate = templateItem.replace(/\-(\w)/g, `${reserveLetter('$1')}`);
                    components[templateItem] = templateJson[templateItem]
                    innerJson['vue'] += `import ${finnalTemplate} from '${templateJson[templateItem]};'`;
                    innerJson['vue'] += "\n";
                }
                let jsFileData = innerJson['js'];
                if (jsFileData) {
                    jsFileData = jsFileData.replace(/(export default \{)/g, `$1\n  components:${JSON.stringify(components)},`);
                }

                innerJson['vue'] += jsFileData;
                innerJson['vue'] += "\n";
                innerJson['vue'] += "</script>";

                distJson[n]['json'] = innerJson['json'];
                distJson[n]['scss'] = innerJson['wxss'];
                distJson[n]['vue'] = innerJson['vue'];
            }
        }
        wHtml(file2, JSON.stringify(distJson));
    })
}

function reserveLetter(item) {
    return item.toLocaleUpperCase();
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