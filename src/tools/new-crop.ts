import { Events } from '../events';
import { DataProcessor } from '../data-processor';
import { Splat } from '../splat';
import { SelectOp } from '../edit-ops';
import { State } from '../splat-state';
import { Vec3 } from 'playcanvas';

class NewCropTool {
    private events: Events;
    private dataProcessor: DataProcessor;
    private scene: any;
    private currentSphereShape: any = null;

    constructor(events: Events, dataProcessor: DataProcessor, scene?: any) {
        this.events = events;
        this.dataProcessor = dataProcessor;
        this.scene = scene;
    }

    activate() {
        const splat = this.events.invoke('selection') as Splat;
        if (!splat) {
            console.warn('No splat selected for new crop');
            return;
        }
        this.performNewCrop(splat);
    }

    deactivate() {
        if (this.currentSphereShape && this.scene) {
            this.scene.remove(this.currentSphereShape);
            this.currentSphereShape = null;
        }
    }

    private performNewCrop(splat: Splat) {
        try {
            console.log('Starting optimized crop approach');
            
            const positions = this.dataProcessor.calcPositions(splat);
            console.log('Total splats:', positions.length / 3);
            
            this.findDishAndCreateSphere(splat, positions);
            
        } catch (error) {
            console.error('New crop failed:', error);
        }
    }

    private findDishAndCreateSphere(splat: Splat, positions: Float32Array) {
        // Collect dish splat positions in a single pass
        const dishSplats: { x: number, z: number }[] = [];
        const state = splat.splatData.getProp('state') as Uint8Array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const splatIndex = i / 3;
            
            // Skip deleted or hidden splats
            if (state[splatIndex] & (State.deleted | State.hidden)) {
                continue;
            }
            
            const tempVec = new Vec3();
            if (splat.calcSplatWorldPosition(splatIndex, tempVec)) {
                if (tempVec.y > 0.04) { // Dish splats only
                    dishSplats.push({ x: tempVec.x, z: tempVec.z }); // Only store X,Z for distance calculations
                }
            }
        }
        
        console.log('Found', dishSplats.length, 'dish splats');
        
        // Find furthest splats and create sphere
        const result = this.findFurthestSplats(dishSplats);
        if (result) {
            const radiusWithMargin = result.radius * 1.1;
            this.createSphereSelection(radiusWithMargin, result.centerX, 0.04, result.centerZ);
        }
    }

    private createSphereSelection(radius: number, centerX: number, centerY: number, centerZ: number) {
        console.log('Creating sphere selection:', { radius: radius.toFixed(3), center: { x: centerX.toFixed(3), y: centerY, z: centerZ.toFixed(3) } });
        
        import('../sphere-shape').then(({ SphereShape }) => {
            if (this.currentSphereShape && this.scene) {
                this.scene.remove(this.currentSphereShape);
                this.currentSphereShape = null;
            }
            
            const sphereShape = new SphereShape();
            sphereShape.radius = radius;
            sphereShape.pivot.setPosition(centerX, centerY, centerZ);
            
            if (this.scene) {
                this.scene.add(sphereShape);
                this.currentSphereShape = sphereShape;
            }
            
            this.events.fire('select.bySphere', 'set', [centerX, centerY, centerZ, radius]);
        });
    }

    private findFurthestSplats(dishSplats: { x: number, z: number }[]) {
        if (dishSplats.length < 2) {
            console.warn('Not enough dish splats');
            return null;
        }
        
        let maxDistance = 0;
        let splat1: { x: number, z: number } | null = null;
        let splat2: { x: number, z: number } | null = null;
        
        // Find furthest pair
        for (let i = 0; i < dishSplats.length; i++) {
            for (let j = i + 1; j < dishSplats.length; j++) {
                const dx = dishSplats[i].x - dishSplats[j].x;
                const dz = dishSplats[i].z - dishSplats[j].z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance > maxDistance) {
                    maxDistance = distance;
                    splat1 = dishSplats[i];
                    splat2 = dishSplats[j];
                }
            }
        }
        
        if (splat1 && splat2) {
            const radius = maxDistance / 2;
            const centerX = (splat1.x + splat2.x) / 2;
            const centerZ = (splat1.z + splat2.z) / 2;
            
            console.log('Furthest splats distance:', maxDistance.toFixed(3));
            console.log('Dish radius:', radius.toFixed(3));
            
            return { radius, centerX, centerZ };
        }
        
        return null;
    }
}

export { NewCropTool }; 