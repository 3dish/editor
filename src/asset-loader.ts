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
            width = 0.3,
            height = 0.3,
            resolution = 60,
            y = 0,
            filename = 'grey_shadow.ply'
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

        // Spherical harmonics coefficient for grey shadow color
        const SH_C0 = 0.28209479177387814;
        const greySH = -0.2 / SH_C0; // This will result in grey shadow color (lighter than black)

        // Fill arrays with splat data - arrange in proper circular pattern
        let idx = 0;
        const centerX = 0;
        const centerZ = 0;
        const maxRadius = Math.min(width, height) / 2; // Use the smaller dimension as radius
        
        // Create circular arrangement using polar coordinates
        const splatSpacing = Math.min(stepX, stepZ); // Use smaller spacing for denser packing
        const radialSteps = Math.floor(maxRadius / splatSpacing);
        
        for (let r = 0; r <= radialSteps; r++) {
            const radius = (r / radialSteps) * maxRadius;
            
            if (radius === 0) {
                // Center point
                storage_x[idx] = centerX;
                storage_y[idx] = y;
                storage_z[idx] = centerZ;
                
                // Calculate shadow intensity (center = darkest)
                const shadowIntensity = 1.0; // Full intensity at center
                
                // Dark shadow color
                const darkShadowSH = -0.5 / SH_C0; // Dark shadow color
                const whiteSH = 0.5 / SH_C0; // White color
                const gradientGreySH = darkShadowSH * shadowIntensity + whiteSH * (1 - shadowIntensity);
                
                storage_f_dc_0[idx] = gradientGreySH; // R
                storage_f_dc_1[idx] = gradientGreySH; // G
                storage_f_dc_2[idx] = gradientGreySH; // B
                
                // Rotation (identity quaternion)
                storage_rot_0[idx] = 0; // x
                storage_rot_1[idx] = 0; // y
                storage_rot_2[idx] = 0; // z
                storage_rot_3[idx] = 1; // w
                
                // Scale (log scale, small flat splats)
                storage_scale_0[idx] = Math.log(splatSpacing * 0.8); // X scale
                storage_scale_1[idx] = Math.log(1e-6);      // Y scale (very thin)
                storage_scale_2[idx] = Math.log(splatSpacing * 0.8); // Z scale
                
                // Opacity (fully opaque)
                storage_opacity[idx] = 5.0; // High positive value for full opacity
                
                idx++;
            } else {
                // Calculate number of splats for this radius (circumference)
                const circumference = 2 * Math.PI * radius;
                const splatsAtRadius = Math.max(1, Math.floor(circumference / splatSpacing));
                
                for (let i = 0; i < splatsAtRadius; i++) {
                    const angle = (i / splatsAtRadius) * 2 * Math.PI;
                    const x = centerX + radius * Math.cos(angle);
                    const z = centerZ + radius * Math.sin(angle);
                
                    storage_x[idx] = x;
                    storage_y[idx] = y;
                    storage_z[idx] = z;

                    // Rotation (identity quaternion)
                    storage_rot_0[idx] = 0; // x
                    storage_rot_1[idx] = 0; // y
                    storage_rot_2[idx] = 0; // z
                    storage_rot_3[idx] = 1; // w

                    // Calculate shadow intensity based on distance from center
                    const normalizedDistance = radius / maxRadius; // 0 to 1
                    
                    // Create smoother, lighter transition to white at edges
                    // Use a much gentler curve for smoother fade
                    const shadowIntensity = Math.pow(1 - normalizedDistance, 0.2); // Very gentle curve for smooth transition
                    
                    // Interpolate between dark shadow (center) and white (edges)
                    const darkShadowSH = -0.3 / SH_C0; // Dark shadow color
                    const whiteSH = 0.5 / SH_C0; // White color
                    const gradientGreySH = darkShadowSH * shadowIntensity + whiteSH * (1 - shadowIntensity);

                    storage_f_dc_0[idx] = gradientGreySH; // R
                    storage_f_dc_1[idx] = gradientGreySH; // G
                    storage_f_dc_2[idx] = gradientGreySH; // B

                    // Scale (log scale, small flat splats)
                    storage_scale_0[idx] = Math.log(splatSpacing * 0.8); // X scale
                    storage_scale_1[idx] = Math.log(1e-6);      // Y scale (very thin)
                    storage_scale_2[idx] = Math.log(splatSpacing * 0.8); // Z scale

                    // Opacity (fully opaque)
                    storage_opacity[idx] = 5.0; // High positive value for full opacity

                    idx++;
                }
            }
        }
        
        // Update total splats count to actual number created (circular area)
        const actualSplatsCount = idx;

        // Create GSplatData
        const gsplatData = new GSplatData([{
            name: 'vertex',
            count: actualSplatsCount,
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
