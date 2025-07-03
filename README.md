## Brightness and BlackPoint Default Values

To change these values go to files `src/ui/color-panel.ts` and `src/splat.ts`

## Center and Fit

To change the number of blocks to center within, go to file `src/editor.ts`and change the "const scale" variable, and to change the bootom of image placement, change the "targetY" variable in the same function

### Files edited for Center Button feature:
`src/editor.ts`
`src/ui/bottom-toolbar.ts`

## Export Button

Files changed:
`src/ui/menu.ts`
`src/ui/viewer-export-popup.ts`


## Set Camera Position for 2D image

Cam1 and Cam2 buttons:
The Set Camera Position feature was added in the following files:
- `src/editor.ts`
- `src/ui/bottom-toolbar.ts`

## Remove Button

Removes the splats below xz plane (y<0)
- `src/editor.ts`
- `src/ui/bottom-toolbar.ts`

## Local Development

To initialize a local development environment for SuperSplat, ensure you have [Node.js](https://nodejs.org/) 18 or later installed. Follow these steps:

1. Clone the repository:

   ```sh
   git clone https://github.com/playcanvas/supersplat.git
   cd supersplat
   ```

2. Install dependencies:

   ```sh
   git submodule update --init
   npm install
   ```

3. Build SuperSplat and start a local web server:

   ```sh
   npm run develop
   ```

4. Open a web browser tab and make sure network caching is disabled on the network tab and the other application caches are clear:

   - On Safari you can use `Cmd+Option+e` or Develop->Empty Caches.
   - On Chrome ensure the options "Update on reload" and "Bypass for network" are enabled in the Application->Service workers tab:

   <img width="846" alt="Screenshot 2025-04-25 at 16 53 37" src="https://github.com/user-attachments/assets/888bac6c-25c1-4813-b5b6-4beecf437ac9" />

5. Navigate to `http://localhost:3000`

When changes to the source are detected, SuperSplat is rebuilt automatically. Simply refresh your browser to see your changes.

## Contributors

SuperSplat is made possible by our amazing open source community:

<a href="https://github.com/playcanvas/supersplat/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=playcanvas/supersplat" />
</a>
