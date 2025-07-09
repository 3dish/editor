import { Container, Label } from 'pcui';
import { Mat4, Vec3 } from 'playcanvas';

import { DataPanel } from './data-panel';
import { Events } from '../events';
import { BottomToolbar } from './bottom-toolbar';
import { ColorPanel } from './color-panel';
import { ImageSettingsDialog } from './image-settings-dialog';
import { localize, localizeInit } from './localization';
import { Menu } from './menu';
import { ModeToggle } from './mode-toggle';
import logo from './playcanvas-logo.png';
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
            text: `SUPERSPLAT v${version}`
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

        //! Folder selection UI (bottom left, above bottom toolbar)
        const folderSelectContainer = new Container({
            id: 'folder-select-container',
            class: 'folder-select-container'
        });
        Object.assign(folderSelectContainer.dom.style, {
            position: 'absolute',
            left: '10px',
            bottom: '100px', 
            zIndex: 10,
            background: 'rgba(30,30,30,0.95)',
            borderRadius: '6px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        });
        // File counter label (hidden/placeholder by default)
        const fileCounterLabel = new Label({
            text: '--/--',
            class: 'folder-file-counter-label'
        });
        Object.assign(fileCounterLabel.dom.style, {
            display: 'block',
            color: '#ffd700',
            fontWeight: 'bold',
            fontSize: '12px',
            marginBottom: '8px',
            textAlign: 'center',
            letterSpacing: '1px',
            minWidth: '48px'
        });
        folderSelectContainer.append(fileCounterLabel);
        const folderSelectButton = new Label({
            text: '📁 Select Folder',
            class: 'folder-select-button'
        });
        Object.assign(folderSelectButton.dom.style, {
            cursor: 'pointer',
            color: '#fff',
            fontWeight: '600',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, #444 0%, #222 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
        });
        folderSelectContainer.append(folderSelectButton);
        // Next File button
        const nextFileButton = new Label({
            text: 'Next File',
            class: 'folder-next-file-button'
        });
        Object.assign(nextFileButton.dom.style, {
            cursor: 'pointer',
            color: '#fff',
            fontWeight: '600',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, #555 0%, #222 100%)', // neutral gray gradient
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            display: 'inline-block',
            marginLeft: '8px'
        });
        // Button row container
        const buttonRow = document.createElement('div');
        buttonRow.style.display = 'flex';
        buttonRow.style.flexDirection = 'row';
        buttonRow.style.justifyContent = 'center';
        buttonRow.style.gap = '0px';
        buttonRow.appendChild(folderSelectButton.dom);
        buttonRow.appendChild(nextFileButton.dom);
        // Remove folderSelectButton from folderSelectContainer if already appended
        if (folderSelectButton.dom.parentElement === folderSelectContainer.dom) {
            folderSelectContainer.dom.removeChild(folderSelectButton.dom);
        }
        folderSelectContainer.dom.appendChild(buttonRow);
        // Info row: file counter (left) and filename (right)
        const filenameLabel = new Label({
            text: 'filename', // Placeholder for filename
            class: 'folder-filename-label'
        });
        Object.assign(filenameLabel.dom.style, {
            display: 'block',
            color: '#b0e0ff',
            fontWeight: '500',
            fontSize: '12px',
            textAlign: 'right',
            letterSpacing: '0.5px',
            minWidth: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '120px'
        });
        // Info row container
        const infoRow = document.createElement('div');
        infoRow.style.display = 'flex';
        infoRow.style.flexDirection = 'row';
        infoRow.style.justifyContent = 'space-between';
        infoRow.style.alignItems = 'center';
        infoRow.style.marginBottom = '8px';
        infoRow.appendChild(fileCounterLabel.dom);
        infoRow.appendChild(filenameLabel.dom);
        // Remove fileCounterLabel from folderSelectContainer if already appended
        if (fileCounterLabel.dom.parentElement === folderSelectContainer.dom) {
            folderSelectContainer.dom.removeChild(fileCounterLabel.dom);
        }
        folderSelectContainer.dom.insertBefore(infoRow, folderSelectContainer.dom.firstChild);

        // Folder path box (below the main UI box)
        const folderPathLabel = new Label({
            text: 'C:/path/to/folder', // Placeholder for folder path
            class: 'folder-path-label'
        });
        Object.assign(folderPathLabel.dom.style, {
            display: 'block',
            color: '#bbb',
            background: 'rgba(40,40,40,0.95)',
            fontSize: '11px',
            fontWeight: '400',
            borderRadius: '4px',
            padding: '4px 8px',
            marginTop: '10px',
            maxWidth: '220px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            border: '1px solid #333',
            boxSizing: 'border-box'
        });
        folderSelectContainer.append(folderPathLabel);
        //! Folder selection UI ends here

        
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
        canvasContainer.append(folderSelectContainer); //! <-- Ensure this is appended to the UI

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
        const dataPanel = new DataPanel(events);

        mainContainer.append(canvasContainer);
        //mainContainer.append(timelinePanel);
        mainContainer.append(dataPanel);

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
                message: `SUPERSPLAT v${version}`
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
