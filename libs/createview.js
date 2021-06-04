const fs = require('fs');
const join = require('path').join;
const http = require('http');
let distJson = {};
readHtml();
console.log("kkk")
// 读demo模板
function readHtml() {
    const file = join( 'watch', 'dist2.json')
    fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
            console.log("err", err);
            return false;
        }
        let json = JSON.parse(data);
        for (let n in json) {
            if (json[n]) {
                const path = n.replace(/\/(\w+)$/, '\/');
                // console.log("path", path);
                wHtml(n + '.vue', json[n]['vue']);
                wHtml(n + '.scss', json[n]['scss']);
                // wHtml(path + 'index.config.js', '// 自动生成')
            }
        }
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