import { 
    AppBase, 
    Asset, 
    GSplatData, 
    GSplatResource,
    Texture,
    FILTER_NEAREST,
    ADDRESS_CLAMP_TO_EDGE,
    PIXELFORMAT_R8,
    PIXELFORMAT_R16U,
    GSplat
} from 'playcanvas';
import { Quat } from 'playcanvas';

import { Events } from './events';
import { Splat } from './splat';

interface ModelLoadRequest {
    url?: string;
    contents?: ArrayBuffer;
    filename?: string;
    maxAnisotropy?: number;
    animationFrame?: boolean;       // animations disable morton re-ordering at load time for faster loading
}

// ideally this function would stream data directly into GSplatData buffers.
// unfortunately the .splat file format has no header specifying total number
// of splats so filesize must be known in order to allocate the correct amount
// of memory.
const deserializeFromSSplat = (data: ArrayBufferLike) => {
    const totalSplats = data.byteLength / 32;
    const dataView = new DataView(data);

    const storage_x = new Float32Array(totalSplats);
    const storage_y = new Float32Array(totalSplats);
    const storage_z = new Float32Array(totalSplats);
    const storage_opacity = new Float32Array(totalSplats);
    const storage_rot_0 = new Float32Array(totalSplats);
    const storage_rot_1 = new Float32Array(totalSplats);
    const storage_rot_2 = new Float32Array(totalSplats);
    const storage_rot_3 = new Float32Array(totalSplats);
    const storage_f_dc_0 = new Float32Array(totalSplats);
    const storage_f_dc_1 = new Float32Array(totalSplats);
    const storage_f_dc_2 = new Float32Array(totalSplats);
    const storage_scale_0 = new Float32Array(totalSplats);
    const storage_scale_1 = new Float32Array(totalSplats);
    const storage_scale_2 = new Float32Array(totalSplats);
    const storage_state = new Uint8Array(totalSplats);


    const SH_C0 = 0.28209479177387814;
    let off;

    for (let i = 0; i < totalSplats; i++) {
        off = i * 32;
        storage_x[i] = dataView.getFloat32(off + 0, true);
        storage_y[i] = dataView.getFloat32(off + 4, true);
        storage_z[i] = dataView.getFloat32(off + 8, true);

        storage_scale_0[i] = Math.log(dataView.getFloat32(off + 12, true));
        storage_scale_1[i] = Math.log(dataView.getFloat32(off + 16, true));
        storage_scale_2[i] = Math.log(dataView.getFloat32(off + 20, true));

        storage_f_dc_0[i] = (dataView.getUint8(off + 24) / 255 - 0.5) / SH_C0;
        storage_f_dc_1[i] = (dataView.getUint8(off + 25) / 255 - 0.5) / SH_C0;
        storage_f_dc_2[i] = (dataView.getUint8(off + 26) / 255 - 0.5) / SH_C0;

        storage_opacity[i] = -Math.log(255 / dataView.getUint8(off + 27) - 1);

        storage_rot_0[i] = (dataView.getUint8(off + 28) - 128) / 128;
        storage_rot_1[i] = (dataView.getUint8(off + 29) - 128) / 128;
        storage_rot_2[i] = (dataView.getUint8(off + 30) - 128) / 128;
        storage_rot_3[i] = (dataView.getUint8(off + 31) - 128) / 128;
    }

    return new GSplatData([{
        name: 'vertex',
        count: totalSplats,
        properties: [
            { type: 'float', name: 'x', storage: storage_x, byteSize: 4 },
            { type: 'float', name: 'y', storage: storage_y, byteSize: 4 },
            { type: 'float', name: 'z', storage: storage_z, byteSize: 4 },
            { type: 'float', name: 'opacity', storage: storage_opacity, byteSize: 4 },
            { type: 'float', name: 'rot_0', storage: storage_rot_0, byteSize: 4 },
            { type: 'float', name: 'rot_1', storage: storage_rot_1, byteSize: 4 },
            { type: 'float', name: 'rot_2', storage: storage_rot_2, byteSize: 4 },
            { type: 'float', name: 'rot_3', storage: storage_rot_3, byteSize: 4 },
            { type: 'float', name: 'f_dc_0', storage: storage_f_dc_0, byteSize: 4 },
            { type: 'float', name: 'f_dc_1', storage: storage_f_dc_1, byteSize: 4 },
            { type: 'float', name: 'f_dc_2', storage: storage_f_dc_2, byteSize: 4 },
            { type: 'float', name: 'scale_0', storage: storage_scale_0, byteSize: 4 },
            { type: 'float', name: 'scale_1', storage: storage_scale_1, byteSize: 4 },
            { type: 'float', name: 'scale_2', storage: storage_scale_2, byteSize: 4 },
            { type: 'float', name: 'state', storage: storage_state, byteSize: 4 }
        ]
    }]);
};

// handles loading gltf container assets
class AssetLoader {
    app: AppBase;
    events: Events;
    defaultAnisotropy: number;
    loadAllData = true;

    constructor(app: AppBase, events: Events, defaultAnisotropy?: number) {
        this.app = app;
        this.events = events;
        this.defaultAnisotropy = defaultAnisotropy || 1;
    }

    loadPly(loadRequest: ModelLoadRequest) {
        if (!loadRequest.animationFrame) {
            this.events.fire('startSpinner');
        }

        return new Promise<Splat>((resolve, reject) => {
            const asset = new Asset(
                loadRequest.filename || loadRequest.url,
                'gsplat',
                {
                    url: loadRequest.url,
                    filename: loadRequest.filename,
                    contents: loadRequest.contents
                },
                {
                    // decompress data on load
                    decompress: true,
                    // disable morton re-ordering when loading animation frames
                    reorder: !(loadRequest.animationFrame ?? false)
                }
            );

            asset.on('load', () => {
                // support loading 2d splats by adding scale_2 property with almost 0 scale
                const splatData = (asset.resource as GSplatResource).splatData as GSplatData;
                if (splatData.getProp('scale_0') && splatData.getProp('scale_1') && !splatData.getProp('scale_2')) {
                    const scale2 = new Float32Array(splatData.numSplats).fill(Math.log(1e-6));
                    splatData.addProp('scale_2', scale2);

                    // place the new scale_2 property just after scale_1
                    const props = splatData.getElement('vertex').properties;
                    props.splice(props.findIndex((prop: any) => prop.name === 'scale_1') + 1, 0, props.splice(props.length - 1, 1)[0]);
                }

                // check the PLY contains minimal set of we expect
                const required = [
                    'x', 'y', 'z',
                    'scale_0', 'scale_1', 'scale_2',
                    'rot_0', 'rot_1', 'rot_2', 'rot_3',
                    'f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity'
                ];
                const missing = required.filter(x => !splatData.getProp(x));
                if (missing.length > 0) {
                    reject(new Error(`This file does not contain gaussian splatting data. The following properties are missing: ${missing.join(', ')}`));
                } else {
                    //resolve(new Splat(asset));
                    const splat = new Splat(asset);
                    splat.entity.setLocalRotation(new Quat().setFromEulerAngles(0, 0, 180));   //! changed from 179.3 to 179.2
                    resolve(splat);
                }
            });

            asset.on('error', (err: string) => {
                reject(err);
            });

            this.app.assets.add(asset);
            this.app.assets.load(asset);
        }).finally(() => {
            if (!loadRequest.animationFrame) {
                this.events.fire('stopSpinner');
            }
        });
    }

    loadSplat(loadRequest: ModelLoadRequest) {
        this.events.fire('startSpinner');

        return new Promise<Splat>((resolve, reject) => {
            fetch(loadRequest.url || loadRequest.filename)
            .then((response) => {
                if (!response || !response.ok || !response.body) {
                    reject(new Error('Failed to fetch splat data'));
                } else {
                    return response.arrayBuffer();
                }
            })
            .then(arrayBuffer => deserializeFromSSplat(arrayBuffer))
            .then((gsplatData) => {
                const asset = new Asset(loadRequest.filename || loadRequest.url, 'gsplat', {
                    url: loadRequest.url,
                    filename: loadRequest.filename
                });
                asset.resource = new GSplatResource(this.app, gsplatData, []);
                //resolve(new Splat(asset));
                const splat = new Splat(asset);
                splat.entity.setLocalRotation(new Quat().setFromEulerAngles(0, 0, 180));    //! changed from 179.3 to 179.2
                resolve(splat);
            })
            .catch((err) => {
                console.error(err);
                reject(new Error('Failed to load splat data'));
            });
        }).finally(() => {
            this.events.fire('stopSpinner');
        });
    }

    loadModel(loadRequest: ModelLoadRequest) {
        const filename = (loadRequest.filename || loadRequest.url).toLowerCase();
        if (filename.endsWith('.ply') || filename === 'meta.json') {
            return this.loadPly(loadRequest);
        } else if (filename.endsWith('.splat')) {
            return this.loadSplat(loadRequest);
        }
    }

    // Add black plane splats to an existing splat
    addBlackPlaneToSplat(splat: Splat, options: {
        width?: number;
        height?: number;
        resolution?: number;
        y?: number;
    } = {}) {
        const {
            width = 2.0,
            height = 2.0,
            resolution = 20,
            y = 0
        } = options;

        // Calculate number of new splats needed
        const splatsPerRow = resolution;
        const splatsPerCol = resolution;
        const newSplatsCount = splatsPerRow * splatsPerCol;

        const splatData = splat.splatData;
        const currentSplatsCount = splatData.numSplats;
        const totalSplatsCount = currentSplatsCount + newSplatsCount;

        // Get existing property arrays
        const existingProps = splatData.getElement('vertex').properties;
        const requiredProps = ['x', 'y', 'z', 'opacity', 'rot_0', 'rot_1', 'rot_2', 'rot_3', 
                              'f_dc_0', 'f_dc_1', 'f_dc_2', 'scale_0', 'scale_1', 'scale_2', 'state'];

        // Create new larger arrays and copy existing data
        const newStorageArrays: { [key: string]: Float32Array | Uint8Array } = {};

        requiredProps.forEach(propName => {
            const existingProp = existingProps.find((p: any) => p.name === propName);
            if (existingProp) {
                // Create new larger array
                const ArrayType = existingProp.storage.constructor as any;
                const newArray = new ArrayType(totalSplatsCount);
                
                // Copy existing data
                newArray.set(existingProp.storage);
                
                newStorageArrays[propName] = newArray;
            }
        });

        // Calculate step sizes for black plane
        const stepX = width / (splatsPerRow - 1);
        const stepZ = height / (splatsPerCol - 1);
        const startX = -width / 2;
        const startZ = -height / 2;

        // Spherical harmonics coefficient for black color
        const SH_C0 = 0.28209479177387814;
        const blackSH = -0.5 / SH_C0; // This will result in black color

        // Fill new arrays with black plane data
        let newIdx = currentSplatsCount;
        for (let row = 0; row < splatsPerCol; row++) {
            for (let col = 0; col < splatsPerRow; col++) {
                // Position
                (newStorageArrays['x'] as Float32Array)[newIdx] = startX + col * stepX;
                (newStorageArrays['y'] as Float32Array)[newIdx] = y;
                (newStorageArrays['z'] as Float32Array)[newIdx] = startZ + row * stepZ;

                // Rotation (identity quaternion)
                (newStorageArrays['rot_0'] as Float32Array)[newIdx] = 0; // x
                (newStorageArrays['rot_1'] as Float32Array)[newIdx] = 0; // y
                (newStorageArrays['rot_2'] as Float32Array)[newIdx] = 0; // z
                (newStorageArrays['rot_3'] as Float32Array)[newIdx] = 1; // w

                // Black color (spherical harmonics coefficients)
                (newStorageArrays['f_dc_0'] as Float32Array)[newIdx] = blackSH; // R
                (newStorageArrays['f_dc_1'] as Float32Array)[newIdx] = blackSH; // G
                (newStorageArrays['f_dc_2'] as Float32Array)[newIdx] = blackSH; // B

                // Scale (log scale, small flat splats)
                const splatSize = Math.min(stepX, stepZ) * 0.8; // Slightly smaller than grid spacing
                (newStorageArrays['scale_0'] as Float32Array)[newIdx] = Math.log(splatSize); // X scale
                (newStorageArrays['scale_1'] as Float32Array)[newIdx] = Math.log(1e-6);      // Y scale (very thin)
                (newStorageArrays['scale_2'] as Float32Array)[newIdx] = Math.log(splatSize); // Z scale

                // Opacity (fully opaque)
                (newStorageArrays['opacity'] as Float32Array)[newIdx] = 5.0; // High positive value for full opacity

                // State (unselected, visible)
                (newStorageArrays['state'] as Uint8Array)[newIdx] = 0;

                newIdx++;
            }
        }

        // Update the splat data properties with new arrays
        existingProps.forEach((prop: any) => {
            if (newStorageArrays[prop.name]) {
                prop.storage = newStorageArrays[prop.name];
            }
        });

        // Update the splat data count
        splatData.getElement('vertex').count = totalSplatsCount;
        (splatData as any)._numSplats = totalSplatsCount;
        splat.numSplats = totalSplatsCount;

        // Update transform arrays (they need to be resized too)
        const transformProp = existingProps.find((p: any) => p.name === 'transform');
        if (transformProp) {
            const newTransformArray = new Uint16Array(totalSplatsCount);
            newTransformArray.set(transformProp.storage);
            transformProp.storage = newTransformArray;
        }

        // Recreate textures with new size
        this.updateSplatTextures(splat);

        // Update sorting and bounds
        splat.updateSorting();
        splat.makeLocalBoundDirty();

        return newSplatsCount;
    }

    // Helper function to update splat textures after data changes
    updateSplatTextures(splat: Splat) {
        const splatData = splat.splatData;
        const instance = splat.entity.gsplat.instance;
        const { width, height } = (instance.splat as GSplat).colorTexture;
        
        // Calculate new texture dimensions based on splat count
        const newSplatCount = splatData.numSplats;
        const newWidth = Math.ceil(Math.sqrt(newSplatCount));
        const newHeight = Math.ceil(newSplatCount / newWidth);

        // Destroy old textures
        if (splat.stateTexture) {
            splat.stateTexture.destroy();
        }
        if (splat.transformTexture) {
            splat.transformTexture.destroy();
        }

        // Create new textures with updated size
        const createTexture = (name: string, format: number) => {
            return new Texture((splat.asset.resource as GSplatResource).app.graphicsDevice, {
                name: name,
                width: newWidth,
                height: newHeight,
                format: format,
                mipmaps: false,
                minFilter: FILTER_NEAREST,
                magFilter: FILTER_NEAREST,
                addressU: ADDRESS_CLAMP_TO_EDGE,
                addressV: ADDRESS_CLAMP_TO_EDGE
            });
        };

        splat.stateTexture = createTexture('splatState', PIXELFORMAT_R8);
        splat.transformTexture = createTexture('splatTransform', PIXELFORMAT_R16U);

        // Update state texture with current state data
        splat.updateState();

        // Rebuild material to use new textures
        const bands = splat.scene?.events?.invoke('view.bands') || 3;
        splat.rebuildMaterial(bands);
    }

    // Create a black plane made of individual splats (original function kept for backward compatibility)
    createBlackPlane(options: {
        width?: number;
        height?: number;
        resolution?: number;
        y?: number;
        filename?: string;
    } = {}) {
        const {
            width = 2.0,
            height = 2.0,
            resolution = 20,
            y = 0,
            filename = 'black_plane.ply'
        } = options;

        // Calculate number of splats needed
        const splatsPerRow = resolution;
        const splatsPerCol = resolution;
        const totalSplats = splatsPerRow * splatsPerCol;

        // Create storage arrays for splat properties
        const storage_x = new Float32Array(totalSplats);
        const storage_y = new Float32Array(totalSplats);
        const storage_z = new Float32Array(totalSplats);
        const storage_opacity = new Float32Array(totalSplats);
        const storage_rot_0 = new Float32Array(totalSplats);
        const storage_rot_1 = new Float32Array(totalSplats);
        const storage_rot_2 = new Float32Array(totalSplats);
        const storage_rot_3 = new Float32Array(totalSplats);
        const storage_f_dc_0 = new Float32Array(totalSplats);
        const storage_f_dc_1 = new Float32Array(totalSplats);
        const storage_f_dc_2 = new Float32Array(totalSplats);
        const storage_scale_0 = new Float32Array(totalSplats);
        const storage_scale_1 = new Float32Array(totalSplats);
        const storage_scale_2 = new Float32Array(totalSplats);

        // Calculate step sizes
        const stepX = width / (splatsPerRow - 1);
        const stepZ = height / (splatsPerCol - 1);
        const startX = -width / 2;
        const startZ = -height / 2;

        // Spherical harmonics coefficient for black color
        const SH_C0 = 0.28209479177387814;
        const blackSH = -0.5 / SH_C0; // This will result in black color

        // Fill arrays with splat data
        let idx = 0;
        for (let row = 0; row < splatsPerCol; row++) {
            for (let col = 0; col < splatsPerRow; col++) {
                // Position
                storage_x[idx] = startX + col * stepX;
                storage_y[idx] = y;
                storage_z[idx] = startZ + row * stepZ;

                // Rotation (identity quaternion)
                storage_rot_0[idx] = 0; // x
                storage_rot_1[idx] = 0; // y
                storage_rot_2[idx] = 0; // z
                storage_rot_3[idx] = 1; // w

                // Black color (spherical harmonics coefficients)
                storage_f_dc_0[idx] = blackSH; // R
                storage_f_dc_1[idx] = blackSH; // G
                storage_f_dc_2[idx] = blackSH; // B

                // Scale (log scale, small flat splats)
                const splatSize = Math.min(stepX, stepZ) * 0.8; // Slightly smaller than grid spacing
                storage_scale_0[idx] = Math.log(splatSize); // X scale
                storage_scale_1[idx] = Math.log(1e-6);      // Y scale (very thin)
                storage_scale_2[idx] = Math.log(splatSize); // Z scale

                // Opacity (fully opaque)
                storage_opacity[idx] = 5.0; // High positive value for full opacity

                idx++;
            }
        }

        // Create GSplatData
        const gsplatData = new GSplatData([{
            name: 'vertex',
            count: totalSplats,
            properties: [
                { type: 'float', name: 'x', storage: storage_x, byteSize: 4 },
                { type: 'float', name: 'y', storage: storage_y, byteSize: 4 },
                { type: 'float', name: 'z', storage: storage_z, byteSize: 4 },
                { type: 'float', name: 'opacity', storage: storage_opacity, byteSize: 4 },
                { type: 'float', name: 'rot_0', storage: storage_rot_0, byteSize: 4 },
                { type: 'float', name: 'rot_1', storage: storage_rot_1, byteSize: 4 },
                { type: 'float', name: 'rot_2', storage: storage_rot_2, byteSize: 4 },
                { type: 'float', name: 'rot_3', storage: storage_rot_3, byteSize: 4 },
                { type: 'float', name: 'f_dc_0', storage: storage_f_dc_0, byteSize: 4 },
                { type: 'float', name: 'f_dc_1', storage: storage_f_dc_1, byteSize: 4 },
                { type: 'float', name: 'f_dc_2', storage: storage_f_dc_2, byteSize: 4 },
                { type: 'float', name: 'scale_0', storage: storage_scale_0, byteSize: 4 },
                { type: 'float', name: 'scale_1', storage: storage_scale_1, byteSize: 4 },
                { type: 'float', name: 'scale_2', storage: storage_scale_2, byteSize: 4 }
            ]
        }]);

        return new Promise<Splat>((resolve) => {
            // Create asset
            const asset = new Asset(filename, 'gsplat', { filename });
            asset.resource = new GSplatResource(this.app, gsplatData, []);
            
            // Create splat
            const splat = new Splat(asset);
            resolve(splat);
        });
    }
}

export { AssetLoader };
