import { Container, Label, Button } from 'pcui';  //! Added for File Selector feature
import { Mat4, Vec3 } from 'playcanvas';


import { Events } from '../events';
import { BottomToolbar } from './bottom-toolbar';
import { ColorPanel } from './color-panel';
import { ImageSettingsDialog } from './image-settings-dialog';
import { localize, localizeInit } from './localization';
import { Menu } from './menu';
import { ModeToggle } from './mode-toggle';
import logo from './3dish-logo.png';
import { Popup, ShowOptions } from './popup';
import { PublishSettingsDialog } from './publish-settings-dialog';
import { RightToolbar } from './right-toolbar';
import { ScenePanel } from './scene-panel';
import { ShortcutsPopup } from './shortcuts-popup';
import { Spinner } from './spinner';
import { TimelinePanel } from './timeline-panel';
import { Tooltips } from './tooltips';
import { VideoSettingsDialog } from './video-settings-dialog';
import { ViewCube } from './view-cube';
import { ViewPanel } from './view-panel';
import { ViewerExportPopup } from './viewer-export-popup';
import { version } from '../../package.json';
           //added for file navigator

class EditorUI {
    appContainer: Container;
    topContainer: Container;
    canvasContainer: Container;
    toolsContainer: Container;
    canvas: HTMLCanvasElement;
    popup: Popup;

    constructor(events: Events, remoteStorageMode: boolean) {
        localizeInit();

        // favicon
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = logo;
        document.head.appendChild(link);

        // app
        const appContainer = new Container({
            id: 'app-container'
        });

        // editor
        const editorContainer = new Container({
            id: 'editor-container'
        });

        // tooltips container
        const tooltipsContainer = new Container({
            id: 'tooltips-container'
        });

        // top container
        const topContainer = new Container({
            id: 'top-container'
        });

        // canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'canvas';

        // app label
        const appLabel = new Label({
            id: 'app-label',
            text: `3Dish Editor v${version}`
        });

        // cursor label
        const cursorLabel = new Label({
            id: 'cursor-label'
        });

        let fullprecision = '';

        events.on('camera.focalPointPicked', (details: { position: Vec3 }) => {
            cursorLabel.text = `${details.position.x.toFixed(2)}, ${details.position.y.toFixed(2)}, ${details.position.z.toFixed(2)}`;
            fullprecision = `${details.position.x}, ${details.position.y}, ${details.position.z}`;
        });

        ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'dblclick'].forEach((eventName) => {
            cursorLabel.dom.addEventListener(eventName, (event: Event) => event.stopPropagation());
        });

        cursorLabel.dom.addEventListener('pointerdown', () => {
            navigator.clipboard.writeText(fullprecision);

            const orig = cursorLabel.text;
            cursorLabel.text = localize('cursor.copied');
            setTimeout(() => {
                cursorLabel.text = orig;
            }, 1000);
        });

        // canvas container
        const canvasContainer = new Container({
            id: 'canvas-container'
        });

        // tools container
        const toolsContainer = new Container({
            id: 'tools-container'
        });

        // tooltips
        const tooltips = new Tooltips();
        tooltipsContainer.append(tooltips);

        // bottom toolbar
        const scenePanel = new ScenePanel(events, tooltips);
        const viewPanel = new ViewPanel(events, tooltips);
        const colorPanel = new ColorPanel(events, tooltips);
        const bottomToolbar = new BottomToolbar(events, tooltips);
        const rightToolbar = new RightToolbar(events, tooltips);
        const modeToggle = new ModeToggle(events, tooltips);
        const menu = new Menu(events);

        //! --- Folder selection UI ---  8888
        // Create a button at the bottom left corner
        const selectFolderButton = document.createElement('button');
        selectFolderButton.textContent = 'Select Folder';
        selectFolderButton.style.position = 'fixed';
        selectFolderButton.style.left = '36px';
        selectFolderButton.style.bottom = '189px';
        selectFolderButton.style.zIndex = '1000';
        selectFolderButton.style.padding = '12px 24px'; // Increased size
        selectFolderButton.style.fontSize = '1rem'; // Make text bigger
        selectFolderButton.style.background = '#222';
        selectFolderButton.style.color = '#fff';
        selectFolderButton.style.border = 'none';
        selectFolderButton.style.borderRadius = '6px'; // Slightly more rounded
        selectFolderButton.style.cursor = 'pointer';
        selectFolderButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        selectFolderButton.addEventListener('mouseenter', () => {
            selectFolderButton.style.background = '#444';
        });
        selectFolderButton.addEventListener('mouseleave', () => {
            selectFolderButton.style.background = '#222';
        });
        document.body.appendChild(selectFolderButton);


        //! Create a "Next" button next to the Select Folder button  8888
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next File';
        nextButton.style.position = 'fixed';
        nextButton.style.left = '155px'; // Adjusted for bigger button width
        nextButton.style.bottom = '189px';
        nextButton.style.zIndex = '1000';
        nextButton.style.padding = '12px 24px'; // Increased size
        nextButton.style.fontSize = '1rem'; // Make text bigger
        nextButton.style.background = '#222';
        nextButton.style.color = '#fff';
        nextButton.style.border = 'none';
        nextButton.style.borderRadius = '6px'; // Slightly more rounded
        nextButton.style.cursor = 'pointer';
        nextButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        nextButton.addEventListener('mouseenter', () => {
            nextButton.style.background = '#444';
        });
        nextButton.addEventListener('mouseleave', () => {
            nextButton.style.background = '#222';
        });
        document.body.appendChild(nextButton);

        //! --- File counter display box UI ---  8888
        const fileCounterBox = document.createElement('div');
        fileCounterBox.style.position = 'fixed';
        fileCounterBox.style.left = '36px';
        fileCounterBox.style.bottom = '140px'; // Above the buttons
        fileCounterBox.style.zIndex = '1000';
        fileCounterBox.style.width = '215px'; // Fixed width matching both buttons
        fileCounterBox.style.height = '48px'; // Increased height
        fileCounterBox.style.display = 'flex';
        fileCounterBox.style.alignItems = 'center';
        fileCounterBox.style.justifyContent = 'center';
        fileCounterBox.style.padding = '0'; // Remove vertical padding since height is fixed
        fileCounterBox.style.background = '#333';
        fileCounterBox.style.color = '#fff';
        fileCounterBox.style.borderRadius = '6px';
        fileCounterBox.style.fontSize = '1.3rem';
        fileCounterBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        fileCounterBox.style.textAlign = 'center';
        fileCounterBox.textContent = 'No file selected';
        document.body.appendChild(fileCounterBox);

        //! --- File search input and Go button ---  8888
        const fileSearchContainer = document.createElement('div');
        fileSearchContainer.style.position = 'fixed';
        fileSearchContainer.style.left = '36px';
        fileSearchContainer.style.bottom = '84px'; // Below the file counter
        fileSearchContainer.style.zIndex = '1000';
        fileSearchContainer.style.display = 'flex';
        fileSearchContainer.style.flexDirection = 'row';
        fileSearchContainer.style.alignItems = 'center';
        fileSearchContainer.style.background = '#222';
        fileSearchContainer.style.borderRadius = '6px';
        fileSearchContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
        fileSearchContainer.style.padding = '3px 5px';
        // Remove fixed width: fileSearchContainer.style.width = '120px';

        const fileSearchInput = document.createElement('input');
        fileSearchInput.type = 'text';
        fileSearchInput.placeholder = 'Jump to file...';
        fileSearchInput.style.height = '23px';
        fileSearchInput.style.width = '75px';
        fileSearchInput.style.fontSize = '.85rem';
        fileSearchInput.style.border = 'none';
        fileSearchInput.style.borderRadius = '4px';
        fileSearchInput.style.marginRight = '4px';
        fileSearchInput.style.padding = '0 4px';
        fileSearchInput.style.background = '#444';
        fileSearchInput.style.color = '#fff';
        fileSearchInput.style.outline = 'none';

        const fileSearchButton = document.createElement('button');
        fileSearchButton.textContent = 'Go';
        fileSearchButton.style.height = '23px';
        fileSearchButton.style.fontSize = '.85rem';
        fileSearchButton.style.background = '#222';
        fileSearchButton.style.color = '#fff';
        fileSearchButton.style.border = 'none';
        fileSearchButton.style.borderRadius = '4px';
        fileSearchButton.style.cursor = 'pointer';
        fileSearchButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
        fileSearchButton.style.width = 'auto';
        fileSearchButton.style.padding = '0 3px';
        fileSearchButton.style.marginLeft = '0';

        fileSearchContainer.appendChild(fileSearchInput);
        fileSearchContainer.appendChild(fileSearchButton);
        document.body.appendChild(fileSearchContainer);

        function jumpToFileByName(name: string) {
            if (!folderFiles.length) return;
            const search = name.trim().toLowerCase();
            if (!search) return;
            const idx = folderFiles.findIndex(f => f.name.toLowerCase().includes(search));
            if (idx !== -1) {
                currentFileIndex = idx;
                events.fire('scene.clear');
                events.fire('camera.reset');
                events.fire('doc.setName', null);
                loadCurrentFile().then(() => {
                    updateFileCounter();
                    setTimeout(() => {
                        events.fire('tool.smallSphereSelection');
                        events.fire('tool.deactivate');
                    }, 1300);
                });
            } else {
                alert('File not found: ' + name);
            }
        }

        fileSearchButton.addEventListener('click', () => {
            jumpToFileByName(fileSearchInput.value);
        });
        fileSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                jumpToFileByName(fileSearchInput.value);
            }
        });

        //! --- Folder path display box UI ---  8888
        const folderPathBox = document.createElement('div');
        folderPathBox.style.position = 'fixed';
        folderPathBox.style.left = '36px';
        folderPathBox.style.bottom = '114px'; 
        folderPathBox.style.zIndex = '1000';
        folderPathBox.style.width = '215px';
        folderPathBox.style.height = '25px';
        folderPathBox.style.display = 'flex';
        folderPathBox.style.alignItems = 'center';
        folderPathBox.style.justifyContent = 'center';
        folderPathBox.style.background = '#222';
        folderPathBox.style.color = '#fff';
        folderPathBox.style.borderRadius = '6px';
        folderPathBox.style.fontSize = '.8rem';
        folderPathBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
        folderPathBox.style.textAlign = 'center';
        folderPathBox.textContent = '';
        document.body.appendChild(folderPathBox);

        // --- File counter display update function ---
        function updateFileCounter() {
            if (folderFiles.length > 0) {
                const file = folderFiles[currentFileIndex];
                fileCounterBox.innerHTML = `<span style="font-size:1.3rem;">${currentFileIndex + 1}/${folderFiles.length}</span><span style="margin-left: 70px; font-size:1.3rem;">${file ? file.name : ''}</span>`;
            } else {
                fileCounterBox.textContent = 'No file selected';
            }
        }

        //! --- Folder selection logic ---  8888
        let folderFiles: File[] = [];
        let currentFileIndex = 0;

        // 1. Create a hidden file input for folder selection
        const folderInput = document.createElement('input');
        folderInput.type = 'file';
        folderInput.webkitdirectory = true;
        folderInput.style.display = 'none';
        document.body.appendChild(folderInput);

        // 2. When the Select Folder button is clicked, open the folder picker
        selectFolderButton.addEventListener('click', () => {
            folderInput.value = '';
            folderInput.click();
        });

        // 3. Handle folder selection
        folderInput.addEventListener('change', () => {
            const files = Array.from(folderInput.files);
            folderFiles = files.filter(file =>
                file.name.toLowerCase().endsWith('.ply') ||
                file.name.toLowerCase().endsWith('.splat')
            );
            currentFileIndex = 0;
            console.log('Selected files:', folderFiles);
            if (folderFiles.length > 0) {
                loadCurrentFile().then(() => {
                    nextButton.disabled = folderFiles.length <= 1;
                    updateFileCounter();
                    setTimeout(() => {
                        events.fire('tool.smallSphereSelection');
                        events.fire('tool.deactivate');
                    }, 1300);
                });
                //nextButton.disabled = folderFiles.length <= 1;
                // Set folder path display
                const firstFile = folderFiles[0];
                if (firstFile && firstFile.webkitRelativePath) {
                    const pathParts = firstFile.webkitRelativePath.split('/');
                    pathParts.pop(); // Remove the file name
                    folderPathBox.textContent = pathParts.join('/');
                } else {
                    folderPathBox.textContent = '';
                }
            } else {
                alert('No .ply or .splat files found in the selected folder.');
                nextButton.disabled = true;
                folderPathBox.textContent = '';
            }
            updateFileCounter();
        });


        async function loadCurrentFile() {
            // 2. Now import the user-selected file (if any)
            const file = folderFiles[currentFileIndex];
            if (!file) return;
            const url = URL.createObjectURL(file);
            await events.invoke('import', url, file.name);
            URL.revokeObjectURL(url);
            // 1. Import WhitePlane.splat first
            const woodSplatPath = '/static/images/WhitePlane.splat'; // Use the correct path!
            try {
                const response = await fetch(woodSplatPath);
                if (!response.ok) throw new Error('Default splat file not found');
                const blob = await response.blob();
                const woodFile = new File([blob], 'WhitePlane.splat');
                const woodUrl = URL.createObjectURL(woodFile);
                events.invoke('scene.clear');
                // If events.invoke('import', ...) returns a promise, await it:
                await events.invoke('import', woodUrl, woodFile.name);
                URL.revokeObjectURL(woodUrl);
        
                // Center after WhitePlane.splat is loadeds
                //events.fire('centerFit.selectedSplat');

                const splats = await events.invoke('scene.splats');
                const woodSplat = splats.find(s => s.name === 'WhitePlane.splat');
                if (woodSplat) {
                    woodSplat.visible = false;
                }

                const userSplat = splats.find(s => s.name === file.name);
                if (userSplat) {
                    events.fire('selection', userSplat);
                }
                                
            } catch (err) {
                console.warn('Could not load default splat file:', err);
            }
        
        
            updateFileCounter();
        }

        //! Next button logic  8888     
        nextButton.addEventListener('click', () => {
            if (currentFileIndex < folderFiles.length - 1) {
                // Save current splat's color settings before clearing
                const currentSplats = events.invoke('scene.splats');
                if (currentSplats && currentSplats.length > 0) {
                    const currentSplat = currentSplats[0];
                    console.log('Saving color settings:', {
                        brightness: currentSplat.brightness,
                        blackPoint: currentSplat.blackPoint,
                        temperature: currentSplat.temperature,
                        saturation: currentSplat.saturation,
                        whitePoint: currentSplat.whitePoint,
                        transparency: currentSplat.transparency,
                        tintClr: { r: currentSplat.tintClr.r, g: currentSplat.tintClr.g, b: currentSplat.tintClr.b }
                    });
                    sessionStorage.setItem('supersplat_color_settings', JSON.stringify({
                        brightness: currentSplat.brightness,
                        blackPoint: currentSplat.blackPoint,
                        temperature: currentSplat.temperature,
                        saturation: currentSplat.saturation,
                        whitePoint: currentSplat.whitePoint,
                        transparency: currentSplat.transparency,
                        tintClr: { r: currentSplat.tintClr.r, g: currentSplat.tintClr.g, b: currentSplat.tintClr.b }
                    }));
                } else {
                    console.log('No current splats found');
                }
                
                events.fire('scene.clear');
                events.fire('camera.reset');
                events.fire('doc.setName', null);
                currentFileIndex++;
                loadCurrentFile().then(() => {
                    updateFileCounter();
                    setTimeout(() => {
                        events.fire('tool.smallSphereSelection');
                        events.fire('tool.deactivate');
                    }, 1300);
                    nextButton.disabled = currentFileIndex >= folderFiles.length - 1;
                });
            } else {
                alert('No more files in the folder.');
                nextButton.disabled = true;
                updateFileCounter();
            }
            events.fire('tool.deactivate');
        });


        


        canvasContainer.dom.appendChild(canvas);
        canvasContainer.append(appLabel);
        canvasContainer.append(cursorLabel);
        canvasContainer.append(toolsContainer);
        canvasContainer.append(scenePanel);
        canvasContainer.append(viewPanel);
        canvasContainer.append(colorPanel);
        canvasContainer.append(bottomToolbar);
        canvasContainer.append(rightToolbar);
        canvasContainer.append(modeToggle);
        canvasContainer.append(menu);

        // view axes container
        const viewCube = new ViewCube(events);
        canvasContainer.append(viewCube);
        events.on('prerender', (cameraMatrix: Mat4) => {
            viewCube.update(cameraMatrix);
        });

        // main container
        const mainContainer = new Container({
            id: 'main-container'
        });

        //onst timelinePanel = new TimelinePanel(events, tooltips);

        mainContainer.append(canvasContainer);
        //mainContainer.append(timelinePanel);

        editorContainer.append(mainContainer);

        tooltips.register(cursorLabel, localize('cursor.click-to-copy'), 'top');

        // message popup
        const popup = new Popup(tooltips);

        // shortcuts popup
        const shortcutsPopup = new ShortcutsPopup();

        // export popup
        const viewerExportPopup = new ViewerExportPopup(events);

        // publish settings
        const publishSettingsDialog = new PublishSettingsDialog(events);

        // image settings
        const imageSettingsDialog = new ImageSettingsDialog(events);

        // video settings
        const videoSettingsDialog = new VideoSettingsDialog(events);

        topContainer.append(popup);
        topContainer.append(viewerExportPopup);
        topContainer.append(publishSettingsDialog);
        topContainer.append(imageSettingsDialog);
        topContainer.append(videoSettingsDialog);

        appContainer.append(editorContainer);
        appContainer.append(topContainer);
        appContainer.append(tooltipsContainer);
        appContainer.append(shortcutsPopup);

        this.appContainer = appContainer;
        this.topContainer = topContainer;
        this.canvasContainer = canvasContainer;
        this.toolsContainer = toolsContainer;
        this.canvas = canvas;
        this.popup = popup;

        document.body.appendChild(appContainer.dom);
        document.body.setAttribute('tabIndex', '-1');

        events.on('show.shortcuts', () => {
            shortcutsPopup.hidden = false;
        });

        events.function('show.viewerExportPopup', (filename?: string) => {
            return viewerExportPopup.show(filename);
        });

        events.function('show.publishSettingsDialog', async () => {
            // show popup if user isn't logged in
            const canPublish = await events.invoke('publish.enabled');
            if (!canPublish) {
                await events.invoke('showPopup', {
                    type: 'error',
                    header: localize('popup.error'),
                    message: localize('publish.please-log-in')
                });
                return false;
            }

            // get user publish settings
            const publishSettings = await publishSettingsDialog.show();

            // do publish
            if (publishSettings) {
                await events.invoke('scene.publish', publishSettings);
            }
        });

        events.function('show.imageSettingsDialog', async (initial) => {
            const imageSettings = await imageSettingsDialog.show(initial);

            if (imageSettings) {
                events.fire('tool.deactivate');
                await events.invoke('render.image', imageSettings);
            }
        });

        events.function('show.videoSettingsDialog', async () => {
            const videoSettings = await videoSettingsDialog.show();

            if (videoSettings) {
                await events.invoke('render.video', videoSettings);
            }
        });

        events.function('show.about', () => {
            return this.popup.show({
                type: 'info',
                header: 'About',
                message: `3Dish Editor v${version}`
            });
        });

        events.function('showPopup', (options: ShowOptions) => {
            return this.popup.show(options);
        });

        // spinner

        const spinner = new Spinner();

        topContainer.append(spinner);

        events.on('startSpinner', () => {
            spinner.hidden = false;
        });

        events.on('stopSpinner', () => {
            spinner.hidden = true;
        });

        // initialize canvas to correct size before creating graphics device etc
        const pixelRatio = window.devicePixelRatio;
        canvas.width = Math.ceil(canvasContainer.dom.offsetWidth * pixelRatio);
        canvas.height = Math.ceil(canvasContainer.dom.offsetHeight * pixelRatio);

        ['contextmenu', 'gesturestart', 'gesturechange', 'gestureend'].forEach((event) => {
            document.addEventListener(event, (e) => {
                e.preventDefault();
            }, true);
        });

        // whenever the canvas container is clicked, set keyboard focus on the body
        canvasContainer.dom.addEventListener('pointerdown', (event: PointerEvent) => {
            // set focus on the body if user is busy pressing on the canvas or a child of the tools
            // element
            if (event.target === canvas || toolsContainer.dom.contains(event.target as Node)) {
                document.body.focus();
            }
        }, true);

        
    }
}

export { EditorUI };
