# OpenLearn — Medical Equipment AR

**OpenLearn** is an augmented-reality learning platform for medical education built by the [VaiderLab](https://vaiderlab.org/) and [Realtime Urbanism Lab](http://labs.aap.cornell.edu/realtime-urbanism). Each module places a detailed, interactive 3D model of a piece of medical equipment into the real world via a phone or tablet camera. Tapping any part of the model opens a description of its purpose and role in patient care.

**Live site:** https://realtimeurbanismlab.github.io/OpenLearn/

| Module | URL |
|--------|-----|
| CT Scanner | https://realtimeurbanismlab.github.io/OpenLearn/CTScanner/ |
| Linear Accelerator | https://realtimeurbanismlab.github.io/OpenLearn/Linac/ |

---

## Tech stack

- **8th Wall** – WebAR engine (SLAM world tracking, camera pipeline)
- **A-Frame** – declarative 3D / WebXR scene graph
- **Webpack 5** – multi-config build, one per equipment module
- **GitHub Pages** – static hosting from `main` branch `/docs` folder

---

## Repository layout

```
OpenLearn/
├── src/
│   ├── app.js                  # A-Frame component registration, material overrides
│   ├── index.html              # Shared HTML shell (head + scripts)
│   ├── head.html               # <head> fragment (loaded into index.html)
│   ├── body.html               # Shared UI (instruction overlay, popup, buttons)
│   │                           # The <a-scene> block is stripped; equipment scene.html is spliced in
│   ├── index.css               # All UI styles
│   ├── selectcomponent.js      # Tap-to-select, popup display
│   ├── next-button.js          # Next / Back navigation between components
│   ├── popup.js                # Popup positioning and content
│   ├── qr-code.js              # Desktop QR code fallback
│   ├── rotate-button.js        # Model rotation toggle
│   ├── landing/
│   │   ├── index.html          # Landing page (links to all modules)
│   │   └── VaderLab-Logo.png   # Branding logo
│   └── equipment/
│       ├── CTScanner/
│       │   ├── scene.html      # <a-scene> block for CT Scanner
│       │   ├── data.js         # Component descriptions for CT Scanner
│       │   └── assets/         # GLB models + EXR environment map
│       └── Linac/
│           ├── scene.html      # <a-scene> block for Linear Accelerator
│           ├── data.js         # Component descriptions for Linac
│           └── assets/         # GLB models + EXR environment map
├── config/
│   ├── equipment-list.js       # Registry — one entry per equipment module
│   ├── webpack.config.js       # Multi-config build, dev server
│   ├── asset-loader.js         # Custom webpack loader for assets/ folder
│   └── inject-commit.js        # Injects current git commit message at build
├── external/                   # Vendored 8th Wall / A-Frame libraries
│   ├── xr/                     # 8th Wall SLAM engine
│   ├── xrextras/               # 8th Wall A-Frame extras
│   ├── xrextras-shared-resources/  # Fonts, loading images
│   ├── landing-page/           # 8th Wall AR loading screen component
│   ├── scripts/                # A-Frame build
│   └── resources/              # Supporting assets for external libs
├── image-targets/              # (optional) 8th Wall image target data
├── docs/                       # Production build output — served by GitHub Pages
│   ├── index.html              # Landing page (copied from src/landing/)
│   ├── VaderLab-Logo.png
│   ├── CTScanner/
│   │   ├── index.html
│   │   ├── bundle.<hash>.js
│   │   ├── assets/
│   │   └── external/           # Copied per-module so xrextras resolves fonts correctly
│   └── Linac/
│       ├── index.html
│       ├── bundle.<hash>.js
│       ├── assets/
│       └── external/
├── package.json
└── README.md
```

---

## Development

### Install dependencies
```
npm install
```

### Run the dev server
```
npm run serve               # CT Scanner (default)
npm run serve:CTScanner
npm run serve:Linac
```

The dev server runs on `http://localhost:8080`. The landing page is at `/`, the equipment page is at `/<ModuleId>/`.

### Test on mobile (HTTPS required for camera access)

AR requires HTTPS. Use [ngrok](https://ngrok.com/) to tunnel your local server:

**Install ngrok** (one-time):
```
npm install -g ngrok
```

**Authenticate** (one-time — get your token from [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)):
```
ngrok config add-authtoken <your-token>
```

**Start the tunnel** (in a second terminal while `npm run serve` is running):
```
ngrok http 8080
```

Ngrok prints an `https://xxxx.ngrok-free.app` URL — open that on your phone. The webpack dev server is pre-configured to allow all ngrok hosts.

---

## Building and deploying

### Production build
```
npm run build
```

Outputs to `docs/`. Both modules are built in a single command.

### Deploy to GitHub Pages

Push the `main` branch. GitHub Pages is configured to serve from `main / /docs`.

```
git add docs/ ...
git commit -m "build: update production output"
git push
```

The live site updates within ~60 seconds.

---

## Adding a new equipment module

1. **Create the folder structure:**
   ```
   src/equipment/<ModuleId>/
     assets/          ← GLB files + hospital_env.exr (environment map)
     data.js          ← component descriptions (copy from CTScanner/data.js as template)
     scene.html       ← A-Frame scene (copy from CTScanner/scene.html as template)
   ```

2. **Register the module** in [config/equipment-list.js](config/equipment-list.js):
   ```js
   {
     id: 'MRI',                  // used as URL path segment: /OpenLearn/MRI/
     title: 'MRI Scanner',       // browser tab title
     displayName: 'MRI Scanner', // used in instruction text
     scenePath: path.join(srcPath, 'equipment', 'MRI', 'scene.html'),
     dataPath:  path.join(srcPath, 'equipment', 'MRI', 'data.js'),
     assetsDir: path.join(srcPath, 'equipment', 'MRI', 'assets'),
   }
   ```

3. **Add a card** to [src/landing/index.html](src/landing/index.html):
   ```html
   <a class="card" href="./MRI/">
     <h2>MRI Scanner</h2>
     <span>Explore all components in AR</span>
   </a>
   ```

4. **Run `npm run build`** — `docs/MRI/index.html` is generated automatically.

That's it. No changes to `app.js`, `selectcomponent.js`, or `webpack.config.js`.

---

## data.js structure

`data.js` in each equipment folder exports the list of interactive components:

```js
const modelDescriptions = [
  {
    Index: '0',
    Modelname: 'gantry_housing',   // must exactly match the entity id in scene.html
    Title: 'Gantry Housing',
    Subtitle: 'Optional subtitle shown under the title',
    Description: 'Markdown-ish text. Supports <a href="...">links</a> and \\n\\n for paragraphs.',
  },
  // ...
]

export { modelDescriptions, getSelectedIndex, setSelectedIndex }
```

**Key rules:**
- `Modelname` must match the `id` attribute of the `<a-entity>` in `scene.html` that has `class="cantap interactable"`
- Leave `Modelname: ''` for entries with no 3D model (only reachable via Next/Back)
- `Index` values are strings; order in the array determines Next/Back sequence
- `Description` supports inline HTML (anchor tags with `href`, `\n\n` for paragraph breaks)

---

## scene.html structure

Each `scene.html` is a complete `<a-scene>…</a-scene>` block. It is spliced into the shared `body.html` template at build time, replacing everything from `<a-scene` onward.

**Interactable entities** must have:
- `id` matching the `Modelname` in `data.js`
- `class="cantap interactable"`
- A corresponding `<a-asset-item id="<id>_asset" src="assets/<file>.glb">` in `<a-assets>`

**Visual-only entities** (not tappable, not in data.js) omit the `id` and `class`:
```html
<a-entity gltf-model="#casing_asset" shadow="cast: true; receive: true" med-plastic></a-entity>
```

---

## Material components

Registered in [src/app.js](src/app.js), these A-Frame components override the GLB's baked materials to give a consistent look. Apply them as bare HTML attributes on `<a-entity>`:

| Component | Appearance | Typical use |
|-----------|-----------|-------------|
| `metallic` | bright silver, high reflectance (envMapIntensity 32) | metal structural parts |
| `slip-ring-assembly-metal` | bright white metal, slightly higher reflectance | ring/disc assemblies |
| `light-plastic` | light blue-grey plastic, subtle reflection | housings, covers |
| `med-plastic` | mid-grey plastic, subtle reflection | outer casings |
| `dark-plastic` | near-black plastic, subtle reflection | dark enclosures |
| `laser-positioning-dark` | very dark matte with minimal reflection | laser housing |
| `fabric` | warm off-white, moderate roughness | patient tables, padding |
| `screen-glow` | emissive screen (pass `color` and `emissive` schema props) | monitors, displays |

**Example:**
```html
<a-entity id="gantry_ring" gltf-model="#gantry_ring_asset"
  class="cantap interactable"
  shadow="cast: true; receive: true"
  metallic>
</a-entity>
```

> Note: these components override color, roughness, and metalness entirely. For fine-grained PBR control (e.g., texture maps, per-mesh materials), the GLB files themselves need to be updated in your 3D modelling software.

---

## AR loading screen

The loading screen before AR starts is controlled by the `landing-page` attribute on `<a-scene>` in each `scene.html`:

```html
landing-page="logoSrc: ./VaderLab-Logo.png; backgroundColor: #f7fafa; textColor: #1a3d40"
```

- `logoSrc` — path relative to the equipment page URL (`./` = `docs/CTScanner/`)
- `backgroundColor` — CSS color string or gradient (same syntax as the `background` CSS property)
- `textColor` — color of instruction text on the loading screen

The `VaderLab-Logo.png` is automatically copied to each equipment output directory by the webpack build.

---

## external/ folder

The `external/` folder contains vendored copies of the 8th Wall SDK and related libraries. These are **not** installed via npm — they must be kept in the repo and are copied verbatim into each equipment's output directory at build time.

Each equipment subdirectory gets its own copy of `external/` because xrextras resolves sub-resources (fonts, images) relative to the served page URL — a shared `../external/` path at the root does not work.

Do not delete or move files in `external/` without understanding their dependency chain.
