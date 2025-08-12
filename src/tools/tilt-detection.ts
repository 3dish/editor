import { Events } from '../events';
import { DataProcessor } from '../data-processor';
import { Splat } from '../splat';
import { State } from '../splat-state';
import { Vec3, Quat } from 'playcanvas';

interface WoodSplat {
    x: number;
    y: number;
    z: number;
}

interface TiltResult {
    tiltAngle: number;
    tiltDirection: number;
    averageTilt: number;
    confidence: number;
}

class TiltDetectionTool {
    private events: Events;
    private dataProcessor: DataProcessor;
    private scene: any;

    constructor(events: Events, dataProcessor: DataProcessor, scene?: any) {
        this.events = events;
        this.dataProcessor = dataProcessor;
        this.scene = scene;
    }

    activate() {
        const splat = this.events.invoke('selection') as Splat;
        if (!splat) {
            console.warn('No splat selected for tilt detection');
            return;
        }
        this.detectAndCorrectTilt(splat);
    }

    deactivate() {
        // Cleanup if needed
    }

    private detectAndCorrectTilt(splat: Splat) {
        try {
            console.log('=== TILT DETECTION START ===');
            
            let iterations = 0;
            const maxIterations = 200; // Prevent infinite loops
            
            while (iterations < maxIterations) {
                // Step 1: Collect wood splats
                const woodSplats = this.collectWoodSplats(splat);
                console.log(`Iteration ${iterations + 1}: Collected ${woodSplats.length} wood splats`);
                
                if (woodSplats.length < 10) {
                    console.warn('Not enough wood splats for tilt detection');
                    return;
                }

                // Step 2: Calculate statistical tilt
                const tiltResult = this.calculateStatisticalTilt(woodSplats);
                console.log(`Iteration ${iterations + 1} - Tilt analysis:`, {
                    angle: tiltResult.tiltAngle.toFixed(2) + '°',
                    direction: tiltResult.tiltDirection.toFixed(2) + '°',
                    averageTilt: tiltResult.averageTilt.toFixed(4),
                    confidence: (tiltResult.confidence * 100).toFixed(1) + '%'
                });

                // Step 3: Check if angle is 0 degrees (or very close)
                if (tiltResult.tiltAngle < 0.001) { // Stop when tilt is essentially 0 degrees
                    console.log('Tilt correction complete! Final tilt angle:', tiltResult.tiltAngle.toFixed(2) + '°');
                    break;
                }

                // Step 4: Apply correction
                console.log('Applying tilt correction...');
                this.applyTiltCorrection(splat, tiltResult);
                
                iterations++;
            }

            if (iterations >= maxIterations) {
                console.log('Reached maximum iterations, stopping tilt correction');
            }

            console.log('=== TILT DETECTION COMPLETE ===');
        } catch (error) {
            console.error('Tilt detection failed:', error);
        }
    }

    private collectWoodSplats(splat: Splat): WoodSplat[] {
        const positions = this.dataProcessor.calcPositions(splat);
        const woodSplats: WoodSplat[] = [];
        const state = splat.splatData.getProp('state') as Uint8Array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const splatIndex = i / 3;
            if (state[splatIndex] & (State.deleted | State.hidden)) {
                continue;
            }
            
            const tempVec = new Vec3();
            if (splat.calcSplatWorldPosition(splatIndex, tempVec)) {
                if (tempVec.y <= 0.01) { // Wood splats
                    woodSplats.push({
                        x: tempVec.x,
                        y: tempVec.y,
                        z: tempVec.z
                    });
                }
            }
        }
        
        return woodSplats;
    }

    private calculateStatisticalTilt(woodSplats: WoodSplat[]): TiltResult {
        // Step 1: Group splats by X position (bins)
        const xBins: { [key: string]: number[] } = {};
        const binSize = 0.2; // 20cm bins
        
        for (const splat of woodSplats) {
            const xBin = Math.floor(splat.x / binSize) * binSize;
            const binKey = xBin.toFixed(1);
            if (!xBins[binKey]) xBins[binKey] = [];
            xBins[binKey].push(splat.y);
        }

        // Step 2: Calculate average Y for each X bin
        const averageYByX: { [key: string]: number } = {};
        const validBins: { x: number, y: number }[] = [];
        
        for (const [xBinStr, yValues] of Object.entries(xBins)) {
            if (yValues.length >= 3) { // Only use bins with enough data
                const x = parseFloat(xBinStr);
                const avgY = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
                averageYByX[xBinStr] = avgY;
                validBins.push({ x, y: avgY });
            }
        }

        console.log('Valid X bins:', validBins.length);
        console.log('Sample averages:', validBins.slice(0, 5));

        if (validBins.length < 3) {
            return { tiltAngle: 0, tiltDirection: 0, averageTilt: 0, confidence: 0 };
        }

        // Step 3: Calculate linear regression (Y = mX + b)
        const regression = this.calculateLinearRegression(validBins);
        
        // Step 4: Calculate tilt angle from slope
        const tiltAngle = Math.atan(Math.abs(regression.slope)) * (180 / Math.PI);
        const tiltDirection = regression.slope > 0 ? 90 : -90; // Simplified direction
        
        // Step 5: Calculate confidence based on R-squared
        const confidence = regression.rSquared;

        return {
            tiltAngle,
            tiltDirection,
            averageTilt: regression.slope,
            confidence
        };
    }

    private calculateLinearRegression(points: { x: number, y: number }[]): { slope: number, intercept: number, rSquared: number } {
        const n = points.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        
        for (const point of points) {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumX2 += point.x * point.x;
            sumY2 += point.y * point.y;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared
        const meanY = sumY / n;
        let ssRes = 0, ssTot = 0;
        for (const point of points) {
            const predictedY = slope * point.x + intercept;
            ssRes += Math.pow(point.y - predictedY, 2);
            ssTot += Math.pow(point.y - meanY, 2);
        }
        const rSquared = 1 - (ssRes / ssTot);
        
        return { slope, intercept, rSquared };
    }

    private applyTiltCorrection(splat: Splat, tiltResult: TiltResult) {
        console.log('Applying tilt correction:', {
            angle: tiltResult.tiltAngle.toFixed(2) + '°',
            direction: tiltResult.tiltDirection.toFixed(2) + '°'
        });
        
        // Calculate the rotation needed to correct the tilt
        const tiltAngleRadians = tiltResult.tiltAngle * (Math.PI / 180);
        const rotationAxis = new Vec3(0, 0, 1); // Rotate around Z-axis to correct X-tilt
        
        // Apply a larger correction - multiply by a factor to ensure full correction
        const correctionFactor = 1.5; // Apply 1.5x the detected tilt
        const rotationAmount = tiltAngleRadians * correctionFactor;
        
        // Create rotation quaternion
        const rotationQuat = new Quat();
        rotationQuat.setFromAxisAngle(rotationAxis, -rotationAmount); // Negative to correct the tilt
        
        // Get current rotation and apply correction
        const currentRotation = splat.entity.getLocalRotation();
        const correctedRotation = new Quat();
        correctedRotation.mul2(currentRotation, rotationQuat);
        
        // Apply the corrected rotation
        splat.entity.setLocalRotation(correctedRotation);
        
        console.log('Tilt correction applied successfully with factor:', correctionFactor);
    }
}

export { TiltDetectionTool };
