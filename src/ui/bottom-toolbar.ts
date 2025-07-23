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
    private collapsed = true;                 //!added for collapse/expand button
    private collapseButton: Button;            //!added for collapse/expand button                                   
    private alwaysVisibleButtons: Button[];    //!added for collapse/expand button
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
            text: 'Sphere1'
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

        // Move sphere button here, just before Center1
        this.append(sphere);

        //! Add Small Sphere button UI
        const smallSphere = new Button({
            id: 'bottom-toolbar-small-sphere',
            class: 'bottom-toolbar-button',
            text: 'Sphere2'
        });
        // smallSphere.dom.appendChild(createSvg(sphereSvg)); // Removed icon
        this.append(smallSphere);
        tooltips.register(smallSphere, 'Small Sphere Select');
        smallSphere.dom.addEventListener('click', () => events.fire('tool.smallSphereSelection'));

        //! First Center button
        const centerFitButton = new Button({
            id: 'bottom-toolbar-center-fit',
            class: 'bottom-toolbar-button',
            text: 'Center1'
        });
        centerFitButton.dom.classList.add('toolbar-center-btn');
        this.append(centerFitButton);
        tooltips.register(centerFitButton, localize('center-fit.tooltip'));
        centerFitButton.on('click', () => {
            events.fire('centerFit.selectedSplat');
        });

        //! Second Center button
        const centerFitButton2 = new Button({
            id: 'bottom-toolbar-center-fit',
            class: 'bottom-toolbar-button',
            text: 'Center2'
        });
        centerFitButton2.dom.classList.add('toolbar-center-btn');
        this.append(centerFitButton2);
        tooltips.register(centerFitButton2, localize('center-fit.tooltip'));
        centerFitButton2.on('click', () => {
            events.fire('centerFit.selectedSplat2');
        });
        

        //! Custom Camera Position buttons
        //! Camera 1 ----
        const customCamera1Button = new Button({
            id: 'bottom-toolbar-custom-camera',
            class: 'bottom-toolbar-button',
            text: 'Cam1'
        });
        customCamera1Button.dom.classList.add('toolbar-camera-btn');
        this.append(customCamera1Button);
        tooltips.register(customCamera1Button, 'Set Camera');
        customCamera1Button.on('click', () => {
            events.fire('camera.setCustomPosition');
        });

        //! Camera 2 ----
        const customCamera2Button = new Button({
            id: 'bottom-toolbar-custom-camera',
            class: 'bottom-toolbar-button',
            text: 'Cam2'
        });
        customCamera2Button.dom.classList.add('toolbar-camera-btn');
        this.append(customCamera2Button);
        tooltips.register(customCamera2Button, 'Set Camera');
        customCamera2Button.on('click', () => {
            events.fire('camera.setCustomPosition2');
        });

        //! Camera 3 ----
        const customCamera3Button = new Button({
            id: 'bottom-toolbar-custom-camera',
            class: 'bottom-toolbar-button',
            text: 'Cam3'
        });
        customCamera3Button.dom.classList.add('toolbar-camera-btn');
        this.append(customCamera3Button);
        tooltips.register(customCamera3Button, 'Set Camera');
        customCamera3Button.on('click', () => {
            events.fire('camera.setCustomPosition3');
        });



        //! Remove Button: Removes all splats under the xz plane (y < 0)---------------------------------------
        const removeBelowXZButton = new Button({
            id: 'bottom-toolbar-remove-below-xz',
            class: 'bottom-toolbar-button',
            text: 'Remove'
        });
        removeBelowXZButton.dom.classList.add('toolbar-remove-btn');
        this.append(removeBelowXZButton);
        tooltips.register(removeBelowXZButton, 'Remove all splats below the XZ plane (y < 0)');
        removeBelowXZButton.on('click', () => {
            events.fire('splats.selectBelowXZ');
        });


        // Rings Button to remove rings below certain y value
        // const ringsButton = new Button({
        //     id: 'bottom-toolbar-rings',
        //     class: 'bottom-toolbar-button',
        //     text: 'Rings'
        // });
        // ringsButton.dom.classList.add('toolbar-rings-btn');
        // this.append(ringsButton);
        // tooltips.register(ringsButton, 'Show/Hide Rings');


        // let repeatCount = 10; // Or any number you find sufficient

        // function repeatSelectDelete(times) {
        //     if (times <= 0) return;
        //     events.fire('select.rect', 'set', {
        //         start: { x: 0, y: 0.65 },
        //         end: { x: 1, y: 1 }
        //     });
        //     setTimeout(() => {
        //         events.fire('select.delete');
        //         setTimeout(() => {
        //             repeatSelectDelete(times - 1);
        //         }, 20); // Delay to allow deletion to process
        //     }, 20); // Delay to allow selection to register
        // }

        // // Usage in your button:
        // ringsButton.on('click', () => {
        //     events.fire('camera.toggleMode');
        //     events.fire('camera.setOverlay', true);
        //     events.fire('camera.setPose', {
        //         position: { x: 0, y: .1, z: 2 },
        //         target: { x: 0, y: .1, z: 0 }
        //     });
        //     events.fire('camera.align', 'pz');
        //     setTimeout(() => {
        //         repeatSelectDelete(10); // Repeat 10 times
        //         events.fire('camera.toggleMode');
        //         events.fire('camera.toggleOverlay')
        //     }, 50); // Delay to allow camera to update
        // });

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
        tooltips.register(undo, localize('tooltip.undo'));
        tooltips.register(redo, localize('tooltip.redo'));
        tooltips.register(picker, localize('tooltip.picker'));
        tooltips.register(brush, localize('tooltip.brush'));
        tooltips.register(polygon, localize('tooltip.polygon'));
        tooltips.register(lasso, 'Lasso Select');
        tooltips.register(sphere, localize('tooltip.sphere'));
        tooltips.register(box, localize('tooltip.box'));
        // tooltips.register(crop, 'Crop');
        tooltips.register(translate, localize('tooltip.translate'));
        tooltips.register(rotate, localize('tooltip.rotate'));
        tooltips.register(scale, localize('tooltip.scale'));
        tooltips.register(coordSpace, localize('tooltip.local-space'));
        tooltips.register(origin, localize('tooltip.bound-center'));



        //! Store always-visible buttons for collapse logic
        this.alwaysVisibleButtons = [
            this.collapseButton,
            sphere,
            smallSphere,
            centerFitButton,
            centerFitButton2,
            customCamera1Button,
            customCamera2Button,
            customCamera3Button,
            removeBelowXZButton
        ];
        // Add always-visible class for CSS
        for (const btn of this.alwaysVisibleButtons) {
            btn.class.add('always-visible');
        }

        // Ensure toolbar starts collapsed
        this.applyCollapseState();
    }

    //! Apply collapse to the toolbar
    applyCollapseState() {
        this.dom.classList.toggle('collapsed', this.collapsed);
        this.collapseButton.dom.innerHTML = '';
        const icon = createSvg(collapseSvg);
        icon.classList.add('menu-icon');
        icon.style.transform = this.collapsed ? 'rotate(180deg)' : '';
        this.collapseButton.dom.appendChild(icon);
        Array.from(this.dom.children).forEach((child: HTMLElement) => {
            const btn = (child as any).ui;
            if (btn instanceof Button && !this.alwaysVisibleButtons.includes(btn)) {
                btn.hidden = this.collapsed;
            }
            if (child.classList && child.classList.contains('bottom-toolbar-separator')) {
                child.style.display = this.collapsed ? 'none' : '';
            }
        });
    }
    toggleCollapse() {
        this.collapsed = !this.collapsed;
        this.applyCollapseState();
    }
    
}

export { BottomToolbar };
