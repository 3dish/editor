## 1. Center Dish and Small Center buttons

**Functionality**: Centers dish within 5 blocks or 3 blocks. To change the number of blocks to center within, go to file `src/editor.ts`and change the "const scale" variable, and to change the bootom of image placement, change the "targetY" variable in the same function

**Implementation Files**:
- `src/editor.ts`
- `src/ui/bottom-toolbar.ts`


## 2. Camera buttons for  2D images

**Functionality**: Sets camera angles for the 2d images

**Implementation Files**:
- `src/editor.ts`
- `src/ui/bottom-toolbar.ts`

## 3. Remove Bottom button

**Functionality**: Removes the splats below xz plane (y<0)

**Implementation Files**:
- `src/editor.ts`
- `src/ui/bottom-toolbar.ts`


## 4. Sphere button Update

**Functionality**: Calls the sphere to clean extra splats from the sides of the wood 

**Implementation Files**:
- `src/ui/sphere-shape.ts`
- `src/tools/sphere-selection.ts`


## 5. Clean Wood button added to remove clouds

**Functionality**: Creates a small sphere selection (radius 0.53) at a specific offset to remove cloud splats around the dish.

**Implementation Files**:
- `src/main.ts`
- `src/sphere-shape.ts`
- `src/tools/sphere-selection.ts`
- `src/ui/bottom-toolbar.ts`
- `src/ui/editor.ts`

## 6. Crop Wood button added to delete extra wood

**Functionality**: Crops extra wood from the sides of the dish by creating an sphere selection around the dish and removing surrounding wood splats.

**Implementation Files**:
- `src/tools/new-crop.ts` - New file created for main crop tool implementation
- `src/ui/bottom-toolbar.ts` - Button UI 

## 7. Tilt button added to fix tilted dishes

**Functionality**: Automatically detects and corrects tilted dishes by analyzing wood splat positions and applying statistical tilt correction in multiple iterations.

**Implementation Files**:
- `src/tools/tilt-detection.ts` - New file created for Tilt detection and correction algorithm
- `src/ui/bottom-toolbar.ts` - Button UI 


## 8. Step 1 button
**Functionality**: Removes cloud and extra wood from the bottom by selecting splats below y=0.06 or above y=0.4 and deleting them.
**Implementation Files**:
- `src/editor.ts` - Remove logic (splats.selectBelowXZ2 event)
- `src/ui/bottom-toolbar.ts` - Button UI and event binding

## 9. Final Step button
**Functionality**: Automates a complete workflow sequence: Center → Fix Tilt → Center → Crop → Delete → Center with appropriate delays between operations.
**Implementation Files**:
- `src/editor.ts` - Sequence automation logic
- `src/ui/bottom-toolbar.ts` - Button UI and event binding


## 10. Thumbnail Export and HD ImagecExport buttons

**Functionality**: Renders 2d images for thumbnail, and high quality images

**Implementation Files**:
- `src/ui/menu.ts`
- `src/ui/viewer-export-popup.ts`


## 11. Folder Path Feature and Wood file added

**Functionality**: Allows users to select a folder of .plys or .splats to work on the editor

**Implementation Files**:
- `src/ui/editor.ts`

## 12. Brightness and BlackPoint Default Values

To change these values go to files `src/ui/color-panel.ts` and `src/splat.ts`


## 13. Inverse Brush/Rectangle Selection

**Functionality**: Alt+brush/rect now selects/highlights the region not brushed

**Implementation Files**:
- `src/edit-ops.ts`
- `src/editor.ts`
- `src/tools/brush-selection.ts`
- `src/tools/rect-selection.ts`

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
