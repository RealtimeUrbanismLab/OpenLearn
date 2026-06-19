const path = require('path')

const rootPath = process.cwd()
const srcPath = path.join(rootPath, 'src')

module.exports = [
  {
    id: 'CTScanner',
    title: 'CT Scanner',
    displayName: 'CT Scanner',
    scenePath: path.join(srcPath, 'equipment', 'CTScanner', 'scene.html'),
    dataPath: path.join(srcPath, 'equipment', 'CTScanner', 'data.js'),
    assetsDir: path.join(srcPath, 'equipment', 'CTScanner', 'assets'),
  },
  {
    id: 'Linac',
    title: 'Linear Accelerator',
    displayName: 'Linac',
    scenePath: path.join(srcPath, 'equipment', 'Linac', 'scene.html'),
    dataPath: path.join(srcPath, 'equipment', 'Linac', 'data.js'),
    assetsDir: path.join(srcPath, 'equipment', 'Linac', 'assets'),
  },
]
