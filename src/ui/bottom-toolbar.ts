import { Button, Element, Container } from 'pcui';

import { Events } from '../events';
import { localize } from './localization';
import redoSvg from './svg/redo.svg';
import brushSvg from './svg/select-brush.svg';
import lassoSvg from './svg/select-lasso.svg';
import pickerSvg from './svg/select-picker.svg';
import polygonSvg from './svg/select-poly.svg';
import sphereSvg from './svg/select-sphere.svg';
import boxSvg from './svg/show-hide-splats.svg';
import undoSvg from './svg/undo.svg';
import { Tooltips } from './tooltips';
import arrowSvg from './svg/arrow.svg';
import collapseSvg from './svg/collapse.svg';

const createSvg = (svgString: string) => {
    const decodedStr = decodeURIComponent(svgString.substring('data:image/svg+xml,'.length));
    return new DOMParser().parseFromString(decodedStr, 'image/svg+xml').documentElement as HTMLElement;
};

class BottomToolbar extends Container {
    private collapsed = false;                 //!added for collapse/expand button
    private collapseButton: Button;            //!added for collapse/expand button                                   
    private textButtons: Button[];             //!text buttons (Crop, Tilt, Sphere, etc.)
    private iconButtons: Button[];             //!icon buttons (undo, redo, picker, etc.)
    constructor(events: Events, tooltips: Tooltips, args = {}) {
        args = {
            ...args,
            id: 'bottom-toolbar'
        };

        super(args);

        this.dom.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });

        const undo = new Button({
            id: 'bottom-toolbar-undo',
            class: 'bottom-toolbar-button',
            enabled: false
        });

        const redo = new Button({
            id: 'bottom-toolbar-redo',
            class: 'bottom-toolbar-button',
            enabled: false
        });

        const picker = new Button({
            id: 'bottom-toolbar-picker',
            class: 'bottom-toolbar-tool'
        });

        const polygon = new Button({
            id: 'bottom-toolbar-polygon',
            class: 'bottom-toolbar-tool'
        });

        const brush = new Button({
            id: 'bottom-toolbar-brush',
            class: 'bottom-toolbar-tool'
        });

        const lasso = new Button({
            id: 'bottom-toolbar-lasso',
            class: 'bottom-toolbar-tool'
        });

        const sphere = new Button({
            id: 'bottom-toolbar-sphere',
            class: 'bottom-toolbar-button',
            text: 'Sphere'
        });

        const box = new Button({
            id: 'bottom-toolbar-box',
            class: 'bottom-toolbar-tool'
        });

        // const crop = new Button({
        //     id: 'bottom-toolbar-crop',
        //     class: ['bottom-toolbar-tool', 'disabled']
        // });

        const translate = new Button({
            id: 'bottom-toolbar-translate',
            class: 'bottom-toolbar-tool',
            icon: 'E111'
        });

        const rotate = new Button({
            id: 'bottom-toolbar-rotate',
            class: 'bottom-toolbar-tool',
            icon: 'E113'
        });

        const scale = new Button({
            id: 'bottom-toolbar-scale',
            class: 'bottom-toolbar-tool',
            icon: 'E112'
        });

        const coordSpace = new Button({
            id: 'bottom-toolbar-coord-space',
            class: 'bottom-toolbar-toggle',
            icon: 'E118'
        });

        const origin = new Button({
            id: 'bottom-toolbar-origin',
            class: ['bottom-toolbar-toggle'],
            icon: 'E189'
        });

        //! Collapse/Expand button added(styled like menu bar)/////////////////
        this.collapseButton = new Button({
            id: 'bottom-toolbar-collapse',
            class: 'bottom-toolbar-button',
        });
        // Set initial icon to match open state
        this.collapseButton.dom.innerHTML = '';
        const initialIcon = createSvg(collapseSvg);
        initialIcon.classList.add('menu-icon');
        initialIcon.style.transform = '';
        this.collapseButton.dom.appendChild(initialIcon);
        this.append(this.collapseButton);
        this.collapseButton.on('click', () => {
            this.toggleCollapse();
        });
        /////////////////////////////////////////////////////////////////////////

        undo.dom.appendChild(createSvg(undoSvg));
        redo.dom.appendChild(createSvg(redoSvg));
        picker.dom.appendChild(createSvg(pickerSvg));
        polygon.dom.appendChild(createSvg(polygonSvg));
        brush.dom.appendChild(createSvg(brushSvg));
        // sphere.dom.appendChild(createSvg(sphereSvg)); // Removed icon
        box.dom.appendChild(createSvg(boxSvg));
        lasso.dom.appendChild(createSvg(lassoSvg));
        // crop.dom.appendChild(createSvg(cropSvg));

        this.append(undo);
        this.append(redo);
        this.append(new Element({ class: 'bottom-toolbar-separator' }));
        this.append(picker);
        this.append(lasso);
        this.append(polygon);
        this.append(brush);
        
        this.append(new Element({ class: 'bottom-toolbar-separator' }));
        this.append(box);
        this.append(new Element({ class: 'bottom-toolbar-separator' }));
        this.append(translate);
        this.append(rotate);
        this.append(scale);
        this.append(coordSpace);
        this.append(origin);


        //! Add Crop button next to Sphere1
        const CropButton = new Button({
            id: 'bottom-toolbar-new-approach',
            class: 'bottom-toolbar-button',
            text: 'Crop Wood'
        });
        this.append(CropButton);
        tooltips.register(CropButton, 'Crop extra wood from the sides of the dish', 'top');
        CropButton.dom.addEventListener('click', () => events.fire('tool.newApproach'));

        //! Add Tilt Detection button
        const tiltButton = new Button({
            id: 'bottom-toolbar-tilt-detection',
            class: 'bottom-toolbar-button',
            text: 'Fix Tilt'
        });
        this.append(tiltButton);
        tooltips.register(tiltButton, 'Fix tilted dishes', 'top');
        tiltButton.dom.addEventListener('click', () => events.fire('tool.tiltDetection'));


        // Move sphere button here, just before Center1
        this.append(sphere);

        //! Add Small Sphere button UI
        const smallSphere = new Button({
            id: 'bottom-toolbar-small-sphere',
            class: 'bottom-toolbar-button',
            text: 'Clean Cloud'
        });
        // smallSphere.dom.appendChild(createSvg(sphereSvg)); // Removed icon
        this.append(smallSphere);
        tooltips.register(smallSphere, 'Small Sphere for removing clouds', 'top');
        smallSphere.dom.addEventListener('click', () => events.fire('tool.smallSphereSelection'));

        //! First Center button
        const centerFitButton = new Button({
            id: 'bottom-toolbar-center-fit',
            class: 'bottom-toolbar-button',
            text: 'Center Dish'
        });
        centerFitButton.dom.classList.add('toolbar-center-btn');
        this.append(centerFitButton);
        tooltips.register(centerFitButton, 'Centers dishes within 5 units', 'top');
        centerFitButton.on('click', () => {
            events.fire('centerFit.selectedSplat');
        });

        //! Second Center button
        const centerFitButton2 = new Button({
            id: 'bottom-toolbar-center-fit',
            class: 'bottom-toolbar-button',
            text: 'Small Center'
        });
        centerFitButton2.dom.classList.add('toolbar-center-btn');
        this.append(centerFitButton2);
        tooltips.register(centerFitButton2, 'Centers taller dishes within 3 units', 'top');
        centerFitButton2.on('click', () => {
            events.fire('centerFit.selectedSplat2');
        });
        

        //! Custom Camera Position buttons
        //! Camera 1 ----
        const customCamera1Button = new Button({
            id: 'bottom-toolbar-custom-camera',
            class: 'bottom-toolbar-button',
            text: 'Dish Cam'
        });
        customCamera1Button.dom.classList.add('toolbar-camera-btn');
        this.append(customCamera1Button);
        tooltips.register(customCamera1Button, 'Primary Camera for most dishes', 'top');
        customCamera1Button.on('click', () => {
            events.fire('camera.setCustomPosition');
        });

        //! Camera 2 ----
        const customCamera2Button = new Button({
            id: 'bottom-toolbar-custom-camera',
            class: 'bottom-toolbar-button',
            text: 'Burger Cam'
        });
        customCamera2Button.dom.classList.add('toolbar-camera-btn');
        this.append(customCamera2Button);
        tooltips.register(customCamera2Button, 'Camera for Burgers/Lower angle', 'top');
        customCamera2Button.on('click', () => {
            events.fire('camera.setCustomPosition2');
        });

        //! Camera 3 ----
        const customCamera3Button = new Button({
            id: 'bottom-toolbar-custom-camera',
            class: 'bottom-toolbar-button',
            text: 'Drink Cam'
        });
        customCamera3Button.dom.classList.add('toolbar-camera-btn');
        this.append(customCamera3Button);
        tooltips.register(customCamera3Button, 'Camera for glasses', 'top');
        customCamera3Button.on('click', () => {
            events.fire('camera.setCustomPosition3');
        });



        //! Remove Button: Removes all splats under the xz plane (y < 0)---------------------------------------
        const removeBelowXZButton = new Button({
            id: 'bottom-toolbar-remove-below-xz',
            class: 'bottom-toolbar-button',
            text: 'Remove Bottom'
        });
        removeBelowXZButton.dom.classList.add('toolbar-remove-btn');
        this.append(removeBelowXZButton);
        tooltips.register(removeBelowXZButton, 'Remove splats below the y < 0', 'top');
        removeBelowXZButton.on('click', () => {
            events.fire('splats.selectBelowXZ');
        });

        //! Step 1 Button: Second remove button
        const removeBelowXZButton2 = new Button({
            id: 'bottom-toolbar-remove-below-xz-2',
            class: 'bottom-toolbar-button',
            text: 'Step 1'
        });
        removeBelowXZButton2.dom.classList.add('toolbar-step-btn');
        this.append(removeBelowXZButton2);
        tooltips.register(removeBelowXZButton2, 'Removes cloud and extra wood from bottom', 'top');
        removeBelowXZButton2.on('click', () => {
            events.fire('splats.selectBelowXZ2');
        });
 
        //! FInal STep Button: Automates a sequence of operations
        const finishButton = new Button({
            id: 'bottom-toolbar-finish',
            class: 'bottom-toolbar-button',
            text: 'Final Step'
        });
        finishButton.dom.classList.add('toolbar-finish-btn');
        this.append(finishButton);
        tooltips.register(finishButton, 'Finishes rest of the workflow', 'top');
        finishButton.on('click', async () => {
            // Execute the sequence: Center1 -> Tilt -> Center1 -> Crop -> Delete key -> Center1
            events.fire('centerFit.selectedSplat'); // Center1
            await new Promise(resolve => setTimeout(resolve, 50));
            
            events.fire('tool.tiltDetection'); // Tilt
            await new Promise(resolve => setTimeout(resolve, 200));
            
            events.fire('centerFit.selectedSplat'); // Center1
            await new Promise(resolve => setTimeout(resolve, 50));
            
            events.fire('tool.newApproach'); // Crop
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            events.fire('select.delete'); // Delete key
            await new Promise(resolve => setTimeout(resolve, 50));
            
            events.fire('centerFit.selectedSplat'); // Center1
        });



        undo.dom.addEventListener('click', () => events.fire('edit.undo'));
        redo.dom.addEventListener('click', () => events.fire('edit.redo'));
        polygon.dom.addEventListener('click', () => events.fire('tool.polygonSelection'));
        lasso.dom.addEventListener('click', () => events.fire('tool.lassoSelection'));
        brush.dom.addEventListener('click', () => events.fire('tool.brushSelection'));
        picker.dom.addEventListener('click', () => events.fire('tool.rectSelection'));
        sphere.dom.addEventListener('click', () => events.fire('tool.sphereSelection'));
        box.dom.addEventListener('click', () => events.fire('tool.boxSelection'));
        translate.dom.addEventListener('click', () => events.fire('tool.move'));
        rotate.dom.addEventListener('click', () => events.fire('tool.rotate'));
        scale.dom.addEventListener('click', () => events.fire('tool.scale'));
        coordSpace.dom.addEventListener('click', () => events.fire('tool.toggleCoordSpace'));
        origin.dom.addEventListener('click', () => events.fire('pivot.toggleOrigin'));

        events.on('edit.canUndo', (value: boolean) => {
            undo.enabled = value;
        });
        events.on('edit.canRedo', (value: boolean) => {
            redo.enabled = value;
        });

        events.on('tool.activated', (toolName: string) => {
            picker.class[toolName === 'rectSelection' ? 'add' : 'remove']('active');
            brush.class[toolName === 'brushSelection' ? 'add' : 'remove']('active');
            polygon.class[toolName === 'polygonSelection' ? 'add' : 'remove']('active');
            lasso.class[toolName === 'lassoSelection' ? 'add' : 'remove']('active');
            sphere.class[toolName === 'sphereSelection' ? 'add' : 'remove']('active');
            box.class[toolName === 'boxSelection' ? 'add' : 'remove']('active');
            translate.class[toolName === 'move' ? 'add' : 'remove']('active');
            rotate.class[toolName === 'rotate' ? 'add' : 'remove']('active');
            scale.class[toolName === 'scale' ? 'add' : 'remove']('active');
        });

        events.on('tool.coordSpace', (space: 'local' | 'world') => {
            coordSpace.dom.classList[space === 'local' ? 'add' : 'remove']('active');
        });

        events.on('pivot.origin', (o: 'center' | 'boundCenter') => {
            origin.dom.classList[o === 'boundCenter' ? 'add' : 'remove']('active');
        });

        // register tooltips
        tooltips.register(undo, localize('tooltip.undo'), 'top');
        tooltips.register(redo, localize('tooltip.redo'), 'top');
        tooltips.register(picker, localize('tooltip.picker'), 'top');
        tooltips.register(brush, localize('tooltip.brush'), 'top');
        tooltips.register(polygon, localize('tooltip.polygon'), 'top');
        tooltips.register(lasso, 'Lasso Select', 'top');
        tooltips.register(sphere, localize('tooltip.sphere'), 'top');
        tooltips.register(box, localize('tooltip.box'), 'top');
        // tooltips.register(crop, 'Crop');
        tooltips.register(translate, localize('tooltip.translate'), 'top');
        tooltips.register(rotate, localize('tooltip.rotate'), 'top');
        tooltips.register(scale, localize('tooltip.scale'), 'top');
        tooltips.register(coordSpace, localize('tooltip.local-space'), 'top');
        tooltips.register(origin, localize('tooltip.bound-center'), 'top');



        //! Store text buttons (Crop, Tilt, Sphere, Center, Cam, Remove, Finish) - excluding toggle button
        this.textButtons = [
            CropButton,
            sphere,
            smallSphere,
            centerFitButton,
            centerFitButton2,
            customCamera1Button,
            customCamera2Button,
            customCamera3Button,
            removeBelowXZButton,
            removeBelowXZButton2,
            tiltButton,
            finishButton
        ];

        console.log('Text buttons count:', this.textButtons.length);
        this.textButtons.forEach(btn => console.log('Text button:', btn.text));

        // Add wider padding class to text buttons
        this.textButtons.forEach(btn => {
            btn.class.add('text-button-wide');
        });

        //! Store icon buttons (undo, redo, picker, lasso, polygon, brush, box, translate, rotate, scale, coordSpace, origin)
        this.iconButtons = [
            undo,
            redo,
            picker,
            lasso,
            polygon,
            brush,
            box,
            translate,
            rotate,
            scale,
            coordSpace,
            origin
        ];

        console.log('Icon buttons count:', this.iconButtons.length);

        // Ensure toolbar starts with text buttons visible, icon buttons hidden
        console.log('Initial state - collapsed =', this.collapsed);
        
        // Debug: Check if all buttons are properly categorized
        const allButtons = [
            undo, redo, picker, lasso, polygon, brush, box, translate, rotate, scale, coordSpace, origin,
            CropButton, sphere, smallSphere, centerFitButton, centerFitButton2, customCamera1Button, 
            customCamera2Button, customCamera3Button, removeBelowXZButton, removeBelowXZButton2, tiltButton, finishButton
        ];
        
        console.log('Total buttons in toolbar:', allButtons.length);
        console.log('Text buttons in array:', this.textButtons.length);
        console.log('Icon buttons in array:', this.iconButtons.length);
        
        // Check for any buttons that might not be in either array
        const categorizedButtons = [...this.textButtons, ...this.iconButtons];
        const uncategorizedButtons = allButtons.filter(btn => !categorizedButtons.includes(btn));
        if (uncategorizedButtons.length > 0) {
            console.warn('Uncategorized buttons found:', uncategorizedButtons.length);
        }
        
        this.applyCollapseState();
        
        // Double-check initial state
        console.log('After applyCollapseState:');
        this.textButtons.forEach(btn => {
            console.log('Text button', btn.text, 'display =', btn.dom.style.display);
        });
        this.iconButtons.forEach(btn => {
            console.log('Icon button display =', btn.dom.style.display);
        });
    }

    //! Apply collapse to the toolbar
    applyCollapseState() {
        console.log('applyCollapseState called, collapsed =', this.collapsed);
        
        this.collapseButton.dom.innerHTML = '';
        const icon = createSvg(collapseSvg);
        icon.classList.add('menu-icon');
        icon.style.transform = this.collapsed ? 'rotate(180deg)' : '';
        this.collapseButton.dom.appendChild(icon);
        
        // Ensure toggle button is always visible
        this.collapseButton.hidden = false;
        
        // Switch between text buttons and icon buttons
        this.textButtons.forEach(btn => {
            if (this.collapsed) {
                btn.dom.style.setProperty('display', 'none', 'important'); // Hide text buttons when collapsed=true
            } else {
                btn.dom.style.setProperty('display', 'inline-flex', 'important'); // Show text buttons when collapsed=false
            }
            console.log('Text button', btn.text, 'display =', btn.dom.style.display);
        });
        
        this.iconButtons.forEach(btn => {
            if (!this.collapsed) {
                btn.dom.style.setProperty('display', 'none', 'important'); // Hide icon buttons when collapsed=false
            } else {
                btn.dom.style.setProperty('display', 'inline-flex', 'important'); // Show icon buttons when collapsed=true
            }
            console.log('Icon button display =', btn.dom.style.display);
        });
        
        // Handle separators - hide them when showing only text buttons
        Array.from(this.dom.children).forEach((child: HTMLElement) => {
            if (child.classList && child.classList.contains('bottom-toolbar-separator')) {
                child.style.display = this.collapsed ? '' : 'none';
            }
        });
    }
    toggleCollapse() {
        this.collapsed = !this.collapsed;
        this.applyCollapseState();
    }
    
}

export { BottomToolbar };
