// 完整的更新服务器示例
// 这是一个Node.js Express服务器，用于提供自动更新服务
// 实际部署时，你需要将这个服务器部署到你的服务器上

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const port = 3000;

// 设置CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// 更新文件目录
const updatesDir = path.join(__dirname, 'updates');

// 确保更新目录存在
if (!fs.existsSync(updatesDir)) {
    fs.mkdirSync(updatesDir, { recursive: true });
    console.log('创建更新目录:', updatesDir);
}

// 提供更新文件下载
app.use('/updates', express.static(updatesDir));

// 计算文件SHA512哈希
function calculateSHA512(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha512');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', (data) => {
            hash.update(data);
        });
        
        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });
        
        stream.on('error', (error) => {
            reject(error);
        });
    });
}

// 获取文件大小
function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
}

// 更新检查接口 - JSON格式
app.get('/updates/latest', async (req, res) => {
    try {
        const platform = req.query.platform || 'win32';
        const arch = req.query.arch || 'x64';
        
        // 查找对应的更新文件
        const fileName = `HarobotBlocklyEditor-1.2.0-${platform}-${arch}.exe`;
        const filePath = path.join(updatesDir, fileName);
        
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            console.log(`文件不存在: ${fileName}`);
            return res.status(404).json({
                error: '更新文件不存在',
                message: `未找到版本 1.2.0 的更新文件`
            });
        }
        
        // 计算文件哈希和大小
        const sha512 = await calculateSHA512(filePath);
        const size = getFileSize(filePath);
        
        // 构建更新信息
        const updateInfo = {
            version: '1.2.0',
            files: [
                {
                    url: `http://localhost:${port}/updates/${fileName}`,
                    sha512: sha512,
                    size: size
                }
            ],
            path: fileName,
            sha512: sha512,
            releaseDate: new Date().toISOString(),
            releaseName: 'Harobot Blockly Editor v1.2.0',
            releaseNotes: '测试版本V1.2，新增在线更新功能，修复了一些bug'
        };
        
        console.log('返回更新信息:', updateInfo);
        res.json(updateInfo);
        
    } catch (error) {
        console.error('更新检查错误:', error);
        res.status(500).json({
            error: '服务器内部错误',
            message: error.message
        });
    }
});

// 更新检查接口 - YAML格式 (electron-updater期望的格式)
app.get('/updates/latest.yml', async (req, res) => {
    try {
        const platform = req.query.platform || 'win32';
        const arch = req.query.arch || 'x64';
        
        // 查找对应的更新文件
        const fileName = `HarobotBlocklyEditor-1.2.0-${platform}-${arch}.exe`;
        const filePath = path.join(updatesDir, fileName);
        
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            console.log(`文件不存在: ${fileName}`);
            return res.status(404).json({
                error: '更新文件不存在',
                message: `未找到版本 1.2.0 的更新文件`
            });
        }
        
        // 计算文件哈希和大小
        const sha512 = await calculateSHA512(filePath);
        const size = getFileSize(filePath);
        
        // 构建YAML格式的更新信息
        const yamlContent = `version: 1.2.0
files:
  - url: HarobotBlocklyEditor-1.2.0-${platform}-${arch}.exe
    sha512: ${sha512}
    size: ${size}
path: HarobotBlocklyEditor-1.2.0-${platform}-${arch}.exe
sha512: ${sha512}
releaseDate: '${new Date().toISOString()}'
releaseName: 'Harobot Blockly Editor v1.2.0'
releaseNotes: '测试版本V1.2，新增在线更新功能，修复了一些bug'`;
        
        console.log('返回YAML更新信息');
        res.setHeader('Content-Type', 'text/yaml');
        res.send(yamlContent);
        
    } catch (error) {
        console.error('更新检查错误:', error);
        res.status(500).json({
            error: '服务器内部错误',
            message: error.message
        });
    }
});

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        server: 'Harobot Update Server',
        version: '1.0.0'
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`=== Harobot 更新服务器 ===`);
    console.log(`服务器地址: http://localhost:${port}`);
    console.log(`更新检查接口: http://localhost:${port}/updates/latest`);
    console.log(`健康检查接口: http://localhost:${port}/health`);
    console.log(`更新文件目录: ${updatesDir}`);
    console.log(`\n使用说明:`);
    console.log(`1. 将你的应用安装包放在 ${updatesDir} 目录中`);
    console.log(`2. 文件名格式: HarobotBlocklyEditor-1.2.0-win32-x64.exe`);
    console.log(`3. 修改 update-config.js 中的环境为 'local'`);
    console.log(`4. 启动应用并测试更新功能`);
    console.log(`\n示例文件结构:`);
    console.log(`${updatesDir}/`);
    console.log(`  ├── HarobotBlocklyEditor-1.2.0-win32-x64.exe`);
    console.log(`  ├── HarobotBlocklyEditor-1.2.0-darwin-x64.dmg`);
    console.log(`  └── HarobotBlocklyEditor-1.2.0-linux-x64.AppImage`);
});

module.exports = app;
