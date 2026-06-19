const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const rootPath = process.cwd()
const outputPath = path.join(rootPath, 'docs')
const srcPath = path.join(rootPath, 'src')

// ── Loader factories ──────────────────────────────────────────────────────

const makeJsLoader = () => ({
  test: /\.js$/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime'],
    },
  },
  exclude: /node_modules/,
})

const makeTsLoader = () => ({
  test: /\.ts$/,
  loader: 'ts-loader',
  exclude: /node_modules/,
})

const makeCssLoader = () => ({
  test: /\.css$/,
  exclude: /\/assets\//,
  use: ['style-loader', 'css-loader'],
})

const makeSassLoader = () => ({
  test: /\.scss$/,
  use: ['style-loader', 'css-loader', 'sass-loader'],
})

const makeAssetLoader = (assetsDir) => ({
  test: /\..*$/,
  include: [assetsDir],
  loader: path.join(__dirname, 'asset-loader.js'),
})

const makeDefaultHtmlLoader = () => ({
  test: /\.html$/,
  use: {
    loader: 'html-loader',
    options: {
      esModule: false,
      sources: {
        list: [
          '...',
          {
            tag: 'script',
            attribute: 'src',
            type: 'src',
            filter: () => false,
          },
          ...['src', 'gltf-model', 'cover-image-url', 'footer-image-url', 'watermark-image-url'].map(attr => ({
            tag: '*',
            attribute: attr,
            type: 'src',
          })),
        ],
      },
    },
  },
})

// ── Template builder ──────────────────────────────────────────────────────

function buildTemplateContent(equipmentEntry) {
  // Read the shared index template and splice in the equipment-specific parts.
  // All path substitutions happen here at build time — no EJS needed at runtime.
  const indexTemplate = fs.readFileSync(path.join(srcPath, 'index.html'), 'utf8')

  // Build body: shared UI (everything before <a-scene) + equipment scene block
  const sharedBody = fs.readFileSync(path.join(srcPath, 'body.html'), 'utf8')
  const sceneBlock = fs.readFileSync(equipmentEntry.scenePath, 'utf8')
  const sceneStart = sharedBody.indexOf('<a-scene')
  const bodyHtml = sharedBody.substring(0, sceneStart) + sceneBlock

  return indexTemplate
    .replace('<%- htmlWebpackPlugin.options.bodyHtml %>', bodyHtml)
    .replace(/CT Scanner Alpha/g, equipmentEntry.title)
    .replace('a model of a CT scanner', `a model of a ${equipmentEntry.displayName}`)
    .replace('any part of the CT scanner', `any part of the ${equipmentEntry.displayName}`)
}

// ── CopyPlugin pattern builder ────────────────────────────────────────────

function buildCopyPatterns(equipmentEntry, isFirst) {
  const equipOutputPath = path.join(outputPath, equipmentEntry.id)

  const patterns = [
    {
      from: equipmentEntry.assetsDir,
      to: path.join(equipOutputPath, 'assets'),
      noErrorOnMissing: true,
    },
    // external/ lives inside each equipment folder so xrextras can find its
    // sub-resources (fonts, images) relative to the served page location.
    {
      from: path.join(rootPath, 'external'),
      to: path.join(equipOutputPath, 'external'),
      noErrorOnMissing: true,
    },
    {
      from: path.join(rootPath, 'image-targets'),
      to: path.join(equipOutputPath, 'image-targets'),
      noErrorOnMissing: true,
    },
  ]

  // Copy logo to equipment dir so the landing-page AR overlay can find it at ./VaderLab-Logo.png
  patterns.push({
    from: path.join(srcPath, 'landing', 'VaderLab-Logo.png'),
    to: path.join(equipOutputPath, 'VaderLab-Logo.png'),
    noErrorOnMissing: true,
  })

  if (isFirst) {
    // Copy entire landing/ directory (HTML + logo) to docs root
    patterns.push({
      from: path.join(srcPath, 'landing'),
      to: outputPath,
      noErrorOnMissing: true,
    })
  }

  return patterns
}

// ── Dev server ────────────────────────────────────────────────────────────

function makeDevServer(equipmentEntry) {
  return {
    host: '0.0.0.0',
    port: 8080,
    open: false,
    compress: true,
    hot: true,
    liveReload: false,
    static: [
      {
        directory: path.join(rootPath, 'docs'),
        publicPath: '/',
      },
    ],
    devMiddleware: {
      // Serve webpack output at /<id>/ so requests for / fall through to the
      // static middleware which serves the landing page from docs/index.html.
      publicPath: `/${equipmentEntry.id}/`,
      writeToDisk: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    client: {
      overlay: {
        warnings: false,
        errors: true,
        runtimeErrors: false,
      },
    },
    allowedHosts: 'all',
  }
}

// ── Per-equipment config factory ──────────────────────────────────────────

function makeEquipmentConfig(equipmentEntry, isDevMode, isFirst) {
  const equipOutputPath = path.join(outputPath, equipmentEntry.id)

  const cfg = {
    entry: path.join(srcPath, 'app.js'),
    output: {
      filename: 'bundle.[contenthash:8].js',
      path: equipOutputPath,
      publicPath: 'auto',
      clean: {
        // Only clean bundle JS files; preserve assets and external
        keep: (asset) => !asset.endsWith('.js') || asset.startsWith('external') || asset.startsWith('assets'),
      },
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      // Redirect './data.js' imports to the equipment-specific data file.
      // NormalModuleReplacementPlugin matches the import *request string*, not the
      // resolved path, so it intercepts before webpack tries to find the file.
      new webpack.NormalModuleReplacementPlugin(
        /^\.\/data\.js$/,
        (resource) => { resource.request = equipmentEntry.dataPath }
      ),
      new HtmlWebpackPlugin({
        templateContent: buildTemplateContent(equipmentEntry),
        filename: 'index.html',
        inject: 'body',
      }),
      new CopyWebpackPlugin({
        patterns: buildCopyPatterns(equipmentEntry, isFirst),
      }),
    ],
    module: {
      rules: [
        makeJsLoader(),
        makeTsLoader(),
        makeCssLoader(),
        makeSassLoader(),
        makeAssetLoader(equipmentEntry.assetsDir),
        makeDefaultHtmlLoader(),
      ],
    },
    mode: isDevMode ? 'development' : 'production',
    context: srcPath,
  }

  if (isDevMode) {
    cfg.devServer = makeDevServer(equipmentEntry)
  }

  return cfg
}

// ── Exports ───────────────────────────────────────────────────────────────

module.exports = (env = {}) => {
  const equipment = require('./equipment-list')
  const isDevMode = !!env.WEBPACK_SERVE
  const targetId = env.equipment || 'CTScanner'

  if (isDevMode) {
    // Dev server: single equipment, determined by --env equipment=<id>
    const entry = equipment.find(e => e.id === targetId)
    if (!entry) throw new Error(`Unknown equipment id: "${targetId}". Valid ids: ${equipment.map(e => e.id).join(', ')}`)
    return makeEquipmentConfig(entry, true, true)
  }

  // Production build: one config per equipment, array form
  return equipment.map((entry, i) => makeEquipmentConfig(entry, false, i === 0))
}
