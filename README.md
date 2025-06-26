# SuperSplat - 3D Gaussian Splat Editor

## Brightness and  Blackpoint Update

 
The default values for **Brightness** and **Black Point** have been updated to 0.1

Changed files:
- `src/ui/color-panel.ts`: change made in the **const brightnessSlider** (line 137) and **const blackPointSLider** (line 159), and also in the "reset.on(click)" (lines 376/377).
- `src/splat.ts`: values of "_brightness" and "_blackPoint" changed in lines 73/74



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





