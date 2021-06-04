const config = {
    port: 8877,
    compute: 'windows', // 'windows' | 'mac'
    // filePaths: ['src\\pages', 'src\\component'], // 需要匹配的目录
    sourceDir: 'src', // 源文件目录
    includeDir: ['pages', 'component'], // 需要转换的文件目录
    outPutDir: 'convertDir' // 转换后文件目录
}
config.splitStr = config.compute == 'windows' ? '\\' : '\/';

export default config;