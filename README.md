### Your Exported Project
This zip contains your project source code, assets, image targets, and configuration needed to build and publish your 8th Wall project. It does not connect to any 8th Wall services, so will work even after the 8th Wall servers are shut down.

### Setup
If node/npm are not installed, install using https://github.com/nvm-sh/nvm or https://nodejs.org/en/download.

Run `npm install` in this folder.

### Development
Run `npm run serve` to run the development server.

#### Testing on Mobile
AR experiences require HTTPS and camera access, so you can't test on a phone via a plain local IP. Use [ngrok](https://ngrok.com/) to create a secure HTTPS tunnel to your local dev server.

**Install ngrok** (one-time):
```
npm install -g ngrok
```
Then authenticate with your free ngrok account:
```
ngrok config add-authtoken <your-token>
```
Get your token at [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken).

**Run** (in a second terminal, while `npm run serve` is running):
```
ngrok http 8080
```
Ngrok prints an `https://xxxx.ngrok-free.app` URL — open that on your phone. The webpack dev server is already configured to accept ngrok hosts, so no config changes are needed.

### Publishing
Run `npm run build` to generate a production build. The resulting build will be in `docs/` for GitHub Pages (`main` branch, `/docs` folder).

### Project Overview
- `src/`: Contains all your original project code and assets.
    - References to asset bundles will need to be updated. Asset bundles are now plain folders. For example,
      - GLTF bundles need to be updated to the `.gltf` file in the folder, i.e., if your model is at `assets/mymodel.gltf/`, update your code to reference `assets/mymodel.gltf/mymodel_file.gltf`.
- `image-targets/`: Contains your project's image targets (if any).
  - The image target with the `_target` suffix is the image target loaded by the engine. The others are used for various display purposes, but are exported for your convenience.
  - To enable image targets, call this in `app.js` or `app.ts` file. (Note: `app.js` or `app.ts` may not be created by default; you will need to create this file yourself.) The autoload targets will have a `"loadAutomatically": true` property in their json file.
```javascript
const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/target1.json'),
      require('../image-targets/target2.json'),
    ],
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
```
- `config/`: Contains the necessary webpack configuration and typescript definitions to support project development.
- `external/`: Contains dependencies used by your project, loaded in `index.html`.
  - If you are not using the XR Engine, you can remove the xr.js script tag from `index.html` and delete the `external/xr/` folder to save bandwidth.
  - You can also customize whether `face`, `slam`, or both, are loaded on the `data-preload-chunks` attribute.

### Final Notes
Please reach out to support@8thwall.com with any questions not yet answered in the docs. Thank you for being part of 8th Wall's story!