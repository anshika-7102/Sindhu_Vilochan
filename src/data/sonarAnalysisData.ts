export interface DetectionItem {
  id: number;
  className: string;
  confidence: number;
  color: 'blue' | 'red' | 'green' | 'amber';
  isNovel?: boolean;
}

export interface ObservabilityMetrics {
  imageId: number;
  usableAreaPercent: number;
  nadirGapPercent: number;
  weakSignalPercent: number;
  acousticShadowPercent: number;
  qualityTier: 'HIGH' | 'MEDIUM' | 'DEGRADED';
  snrDb: number;
  surveyReliabilityScore: number;
  notes: string;
}

export interface SonarAnalysisAsset {
  id: string;
  name: string;
  displayName?: string;
  thumbnailUrl: string; // Strictly the raw unannotated image
  rawUrl: string;       // Clean raw image
  bboxUrl: string | null; // Authentic bbox file (/bbox/...)
  segmentationUrl: string | null; // Segmentation mask (/bbox+mask/...)
  heatmapUrl: string | null; // Heatmap / PatchCore activation (/PatchCore/...)
  preprocessedUrl?: string | null; // Pre-processed grayscale acoustic scan (/pre-processed/...)
  shapeUrl?: string | null; // Shape highlight contour mask (/shape/...)
  shadowUrl?: string | null; // Acoustic shadow contour mask (/shadow/...)
  contextUrl?: string | null; // Seafloor context crop (/context/...)
  patchcoreUrl?: string | null; // PatchCore anomaly heatmap (/PatchCore/...)
  enhancedUrl: string | null;
  detections: DetectionItem[];
  observability?: ObservabilityMetrics;
}

export const OBSERVABILITY_METRICS_MAP: Record<string, ObservabilityMetrics> = {
  'artificial_reef.png': {
    imageId: 1,
    usableAreaPercent: 92.4,
    nadirGapPercent: 3.8,
    weakSignalPercent: 3.8,
    acousticShadowPercent: 1.2,
    qualityTier: 'HIGH',
    snrDb: 24.2,
    surveyReliabilityScore: 93,
    notes: 'Optimal baseline acoustic return; distinct structural backscatter with minimal attenuation.',
  },
  'crabpot.jpg': {
    imageId: 2,
    usableAreaPercent: 88.5,
    nadirGapPercent: 4.5,
    weakSignalPercent: 4.8,
    acousticShadowPercent: 2.2,
    qualityTier: 'HIGH',
    snrDb: 22.0,
    surveyReliabilityScore: 89,
    notes: 'Clear swath coverage; dual discrete trap acoustic reflections detected with prominent shadows.',
  },
  'shipwreck3.jpeg': {
    imageId: 3,
    usableAreaPercent: 87.1,
    nadirGapPercent: 4.9,
    weakSignalPercent: 5.4,
    acousticShadowPercent: 2.6,
    qualityTier: 'HIGH',
    snrDb: 21.4,
    surveyReliabilityScore: 88,
    notes: 'Stable backscatter response; localized structural acoustic occlusion behind hull fragment.',
  },
  'ghostnet.jpeg': {
    imageId: 4,
    usableAreaPercent: 86.8,
    nadirGapPercent: 4.8,
    weakSignalPercent: 6.2,
    acousticShadowPercent: 2.2,
    qualityTier: 'MEDIUM',
    snrDb: 19.8,
    surveyReliabilityScore: 87,
    notes: 'Fibrous diffuse scatter; shadow attenuation absent due to porous polymer mesh geometry.',
  },
  'human.jpeg': {
    imageId: 5,
    usableAreaPercent: 84.5,
    nadirGapPercent: 5.2,
    weakSignalPercent: 7.1,
    acousticShadowPercent: 3.2,
    qualityTier: 'MEDIUM',
    snrDb: 18.6,
    surveyReliabilityScore: 85,
    notes: 'Out-of-distribution anomaly area; acoustic density divergence flagged by PatchCore.',
  },
  'pipe.jpeg': {
    imageId: 6,
    usableAreaPercent: 91.2,
    nadirGapPercent: 3.9,
    weakSignalPercent: 3.5,
    acousticShadowPercent: 1.4,
    qualityTier: 'HIGH',
    snrDb: 23.5,
    surveyReliabilityScore: 92,
    notes: 'High backscatter linear conduit with continuous geometry-consistent acoustic shadow.',
  },
  'pipe1.jpeg': {
    imageId: 7,
    usableAreaPercent: 90.6,
    nadirGapPercent: 4.1,
    weakSignalPercent: 3.9,
    acousticShadowPercent: 1.4,
    qualityTier: 'HIGH',
    snrDb: 22.8,
    surveyReliabilityScore: 91,
    notes: 'Excellent acoustic clarity; raised joint casting sharp acoustic penumbra into starboard swath.',
  },
  'plane.jpg': {
    imageId: 8,
    usableAreaPercent: 93.1,
    nadirGapPercent: 3.5,
    weakSignalPercent: 2.4,
    acousticShadowPercent: 1.0,
    qualityTier: 'HIGH',
    snrDb: 25.1,
    surveyReliabilityScore: 94,
    notes: 'Crisp specular acoustic return from fuselage skin; extensive low-loss observable swath.',
  },
  'plane1.jpg': {
    imageId: 9,
    usableAreaPercent: 89.4,
    nadirGapPercent: 4.3,
    weakSignalPercent: 4.7,
    acousticShadowPercent: 1.6,
    qualityTier: 'HIGH',
    snrDb: 22.3,
    surveyReliabilityScore: 90,
    notes: 'Wing section resting on sand; trailing shadow correlates with sonar flight vector.',
  },
  'seabed.png': {
    imageId: 10,
    usableAreaPercent: 95.2,
    nadirGapPercent: 2.8,
    weakSignalPercent: 2.0,
    acousticShadowPercent: 0.0,
    qualityTier: 'HIGH',
    snrDb: 26.4,
    surveyReliabilityScore: 96,
    notes: 'Pristine sandy seabed reference baseline; uniform backscatter across entire range swath.',
  },
  'seabed1.jpg': {
    imageId: 11,
    usableAreaPercent: 94.0,
    nadirGapPercent: 3.2,
    weakSignalPercent: 2.8,
    acousticShadowPercent: 0.0,
    qualityTier: 'HIGH',
    snrDb: 25.0,
    surveyReliabilityScore: 95,
    notes: 'Normal bedrock ripple texture; clean acoustic SNR supporting reliable reference embedding.',
  },
  'seabed3.png': {
    imageId: 12,
    usableAreaPercent: 71.5,
    nadirGapPercent: 6.8,
    weakSignalPercent: 14.2,
    acousticShadowPercent: 7.5,
    qualityTier: 'DEGRADED',
    snrDb: 14.3,
    surveyReliabilityScore: 72,
    notes: 'Acoustic attenuation and thermocline interference observed; far-range roll-off requires cautious interpretation.',
  },
  'seabed4.png': {
    imageId: 13,
    usableAreaPercent: 91.8,
    nadirGapPercent: 4.0,
    weakSignalPercent: 4.2,
    acousticShadowPercent: 0.0,
    qualityTier: 'HIGH',
    snrDb: 23.9,
    surveyReliabilityScore: 92,
    notes: 'Stable reference seabed; normal sand waves without anthropogenic anomalies.',
  },
  'shipwreck.png': {
    imageId: 14,
    usableAreaPercent: 87.6,
    nadirGapPercent: 4.6,
    weakSignalPercent: 5.2,
    acousticShadowPercent: 2.6,
    qualityTier: 'HIGH',
    snrDb: 21.8,
    surveyReliabilityScore: 88,
    notes: 'Large high-relief wreck hull projecting major acoustic shadow into starboard swath.',
  },
  'shipwreck2.png': {
    imageId: 15,
    usableAreaPercent: 86.2,
    nadirGapPercent: 4.8,
    weakSignalPercent: 5.8,
    acousticShadowPercent: 3.2,
    qualityTier: 'HIGH',
    snrDb: 21.0,
    surveyReliabilityScore: 87,
    notes: 'Extensive wreckage field; significant acoustic blockage behind central superstructure.',
  },
};

/**
 * Extracts a normalized lowercase stem from a file path or filename.
 * E.g. '/raw/shipwreck3.jpeg' -> 'shipwreck3'
 *      'Artificial_Reef.png' -> 'artificial_reef'
 */
export function getAssetStem(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() || fileName;
  return base.replace(/\.[^/.]+$/, '').toLowerCase().trim();
}

/**
 * Canonical 15 authentic survey assets, sorted in the priority sequence:
 * 1. Shipwreck
 * 2. Ghost Net
 * 3. Human Anomaly
 * 4. Natural Reef
 * 5. Remaining survey assets
 *
 * Each asset has strictly 1-to-1 exact mapping across:
 * - rawUrl: /raw/<stem>.<ext>
 * - enhancedUrl / preprocessedUrl: /pre-processed/<stem>.png
 * - bboxUrl: /bbox/<stem>.png or /unknown/<stem>.png
 * - segmentationUrl: /bbox+mask/<stem>.png
 * - heatmapUrl / patchcoreUrl: /PatchCore/<stem>.<ext>
 *
 * YOLO Confidence values are verified directly from the annotations on bbox+mask images.
 */
export const ALL_SONAR_ANALYSIS_ASSETS: SonarAnalysisAsset[] = [
  // 1. Shipwreck (Canonical) - Confidence 0.97 directly from bbox+mask/shipwreck.png
  {
    id: 'frame-shipwreck',
    name: 'shipwreck.png',
    displayName: 'Image 1',
    thumbnailUrl: '/raw/shipwreck.png',
    rawUrl: '/raw/shipwreck.png',
    bboxUrl: '/bbox/shipwreck.png',
    segmentationUrl: '/bbox+mask/shipwreck.png',
    heatmapUrl: '/PatchCore/shipwreck.png',
    preprocessedUrl: '/pre-processed/shipwreck.png',
    shapeUrl: '/shape/shipwreck.png',
    shadowUrl: '/shadow/shipwreck.png',
    contextUrl: '/context/shipwreck.png',
    patchcoreUrl: '/PatchCore/shipwreck.png',
    enhancedUrl: '/pre-processed/shipwreck.png',
    detections: [
      { id: 1, className: 'Shipwreck', confidence: 0.97, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['shipwreck.png'],
  },

  // 2. Ghost Net - Confidence 0.98 directly from bbox+mask/ghostnet.png
  {
    id: 'frame-ghostnet',
    name: 'ghostnet.jpeg',
    displayName: 'Image 2',
    thumbnailUrl: '/raw/ghostnet.jpeg',
    rawUrl: '/raw/ghostnet.jpeg',
    bboxUrl: '/bbox/ghostnet.png',
    segmentationUrl: '/bbox+mask/ghostnet.png',
    heatmapUrl: '/PatchCore/ghostnet.png',
    preprocessedUrl: '/pre-processed/ghostnet.png',
    shapeUrl: '/shape/ghostnet.png',
    shadowUrl: null, // Ghost nets do not cast acoustic shadows (Shadow weight = 0)
    contextUrl: '/context/ghostnet.png',
    patchcoreUrl: '/PatchCore/ghostnet.png',
    enhancedUrl: '/pre-processed/ghostnet.png',
    detections: [
      { id: 1, className: 'Ghost Net', confidence: 0.98, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['ghostnet.jpeg'],
  },

  // 3. Human (Anthropogenic Anomaly) - PatchCore Anomaly Candidate (Unknown ROI)
  {
    id: 'frame-human',
    name: 'human.jpeg',
    displayName: 'Image 3',
    thumbnailUrl: '/raw/human.jpeg',
    rawUrl: '/raw/human.jpeg',
    bboxUrl: '/unknown/human.png',
    segmentationUrl: null, // Novel candidate detected by PatchCore unsupervised branch, not YOLO
    heatmapUrl: '/PatchCore/human.png',
    preprocessedUrl: '/pre-processed/human.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: '/PatchCore/human.png',
    enhancedUrl: '/pre-processed/human.png',
    detections: [
      { id: 1, className: 'Unknown Anomaly', confidence: 0.91, color: 'red', isNovel: true },
    ],
    observability: OBSERVABILITY_METRICS_MAP['human.jpeg'],
  },

  // 4. Natural Reef - Baseline seafloor (No YOLO detection, empty detections)
  {
    id: 'frame-reef',
    name: 'Artificial_Reef.png',
    displayName: 'Image 4',
    thumbnailUrl: '/raw/Artificial_Reef.png',
    rawUrl: '/raw/Artificial_Reef.png',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/Artificial_Reef.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/Artificial_Reef.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['artificial_reef.png'],
  },

  // 5. Pipe (Subsea Pipeline) - Confidence 0.96 directly from bbox+mask/pipe.png
  {
    id: 'frame-pipe',
    name: 'pipe.jpeg',
    displayName: 'Image 5',
    thumbnailUrl: '/raw/pipe.jpeg',
    rawUrl: '/raw/pipe.jpeg',
    bboxUrl: '/bbox/pipe.png',
    segmentationUrl: '/bbox+mask/pipe.png',
    heatmapUrl: '/PatchCore/pipe.png',
    preprocessedUrl: '/pre-processed/pipe.png',
    shapeUrl: '/shape/pipe.png',
    shadowUrl: '/shadow/pipe.png',
    contextUrl: '/context/pipe.png',
    patchcoreUrl: '/PatchCore/pipe.png',
    enhancedUrl: '/pre-processed/pipe.png',
    detections: [
      { id: 1, className: 'Pipe', confidence: 0.96, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['pipe.jpeg'],
  },

  // 6. Pipe 1 (Subsea Pipeline) - Confidence 0.97 directly from bbox+mask/pipe1.png
  {
    id: 'frame-pipe1',
    name: 'pipe1.jpeg',
    displayName: 'Image 6',
    thumbnailUrl: '/raw/pipe1.jpeg',
    rawUrl: '/raw/pipe1.jpeg',
    bboxUrl: '/bbox/pipe1.png',
    segmentationUrl: '/bbox+mask/pipe1.png',
    heatmapUrl: '/PatchCore/pipe1.png',
    preprocessedUrl: '/pre-processed/pipe1.png',
    shapeUrl: '/shape/pipe1.png',
    shadowUrl: '/shadow/pipe1.png',
    contextUrl: '/context/pipe1.png',
    patchcoreUrl: '/PatchCore/pipe1.png',
    enhancedUrl: '/pre-processed/pipe1.png',
    detections: [
      { id: 1, className: 'Pipe', confidence: 0.97, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['pipe1.jpeg'],
  },

  // 7. Plane (Aircraft Wreckage) - Confidence 0.98 directly from bbox+mask/plane.png
  {
    id: 'frame-plane',
    name: 'plane.jpg',
    displayName: 'Image 7',
    thumbnailUrl: '/raw/plane.jpg',
    rawUrl: '/raw/plane.jpg',
    bboxUrl: '/bbox/plane.png',
    segmentationUrl: '/bbox+mask/plane.png',
    heatmapUrl: '/PatchCore/plane.png',
    preprocessedUrl: '/pre-processed/plane.png',
    shapeUrl: '/shape/plane.png',
    shadowUrl: '/shadow/plane.png',
    contextUrl: '/context/plane.png',
    patchcoreUrl: '/PatchCore/plane.png',
    enhancedUrl: '/pre-processed/plane.png',
    detections: [
      { id: 1, className: 'Plane', confidence: 0.98, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['plane.jpg'],
  },

  // 8. Plane 1 (Aircraft Wing section) - Confidence 0.95 directly from bbox+mask/plane1.png
  {
    id: 'frame-plane1',
    name: 'plane1.jpg',
    displayName: 'Image 8',
    thumbnailUrl: '/raw/plane1.jpg',
    rawUrl: '/raw/plane1.jpg',
    bboxUrl: '/bbox/plane1.png',
    segmentationUrl: '/bbox+mask/plane1.png',
    heatmapUrl: '/PatchCore/plane1.jpeg',
    preprocessedUrl: '/pre-processed/plane1.png',
    shapeUrl: '/shape/plane1.png',
    shadowUrl: '/shadow/plane1.png',
    contextUrl: '/context/plane1.png',
    patchcoreUrl: '/PatchCore/plane1.jpeg',
    enhancedUrl: '/pre-processed/plane1.png',
    detections: [
      { id: 1, className: 'Plane', confidence: 0.95, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['plane1.jpg'],
  },

  // 9. Crab-Pot (Traps) - Confidences 0.96 & 0.95 directly from bbox+mask/crabpot.png
  {
    id: 'frame-crabpot',
    name: 'crabpot.jpg',
    displayName: 'Image 9',
    thumbnailUrl: '/raw/crabpot.jpg',
    rawUrl: '/raw/crabpot.jpg',
    bboxUrl: '/bbox/crabpot.png',
    segmentationUrl: '/bbox+mask/crabpot.png',
    heatmapUrl: '/PatchCore/crabpot.png',
    preprocessedUrl: '/pre-processed/crabpot.png',
    shapeUrl: '/shape/crabpot.png',
    shadowUrl: '/shadow/crabpot.png',
    contextUrl: '/context/crabpot.png',
    patchcoreUrl: '/PatchCore/crabpot.png',
    enhancedUrl: '/pre-processed/crabpot.png',
    detections: [
      { id: 1, className: 'Crab Pot', confidence: 0.96, color: 'blue' },
      { id: 2, className: 'Crab Pot', confidence: 0.95, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['crabpot.jpg'],
  },

  // 10. Shipwreck 2 - Confidence 0.97 directly from bbox+mask/shipwreck2.png
  {
    id: 'frame-shipwreck2',
    name: 'shipwreck2.png',
    displayName: 'Image 10',
    thumbnailUrl: '/raw/shipwreck2.png',
    rawUrl: '/raw/shipwreck2.png',
    bboxUrl: '/bbox/shipwreck2.png',
    segmentationUrl: '/bbox+mask/shipwreck2.png',
    heatmapUrl: '/PatchCore/shipwreck2.png',
    preprocessedUrl: '/pre-processed/shipwreck2.png',
    shapeUrl: '/shape/shipwreck2.png',
    shadowUrl: '/shadow/shipwreck2.png',
    contextUrl: '/context/shipwreck2.png',
    patchcoreUrl: '/PatchCore/shipwreck2.png',
    enhancedUrl: '/pre-processed/shipwreck2.png',
    detections: [
      { id: 1, className: 'Shipwreck', confidence: 0.97, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['shipwreck2.png'],
  },

  // 11. Shipwreck 3 - Confidence 0.96 directly from bbox+mask/shipwreck3.png
  {
    id: 'frame-shipwreck3',
    name: 'shipwreck3.jpeg',
    displayName: 'Image 11',
    thumbnailUrl: '/raw/shipwreck3.jpeg',
    rawUrl: '/raw/shipwreck3.jpeg',
    bboxUrl: '/bbox/shipwreck3.png',
    segmentationUrl: '/bbox+mask/shipwreck3.png',
    heatmapUrl: '/PatchCore/shipwreck3.png',
    preprocessedUrl: '/pre-processed/shipwreck3.png',
    shapeUrl: '/shape/shipwreck3.png',
    shadowUrl: '/shadow/shipwreck3.png',
    contextUrl: '/context/shipwreck.png',
    patchcoreUrl: '/PatchCore/shipwreck3.png',
    enhancedUrl: '/pre-processed/shipwreck3.png',
    detections: [
      { id: 1, className: 'Shipwreck', confidence: 0.96, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['shipwreck3.jpeg'],
  },

  // 12. Seabed (Baseline scan 1)
  {
    id: 'frame-seabed',
    name: 'seabed.png',
    displayName: 'Image 12',
    thumbnailUrl: '/raw/seabed.png',
    rawUrl: '/raw/seabed.png',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/seabed.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/seabed.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['seabed.png'],
  },

  // 13. Seabed 1 (Baseline scan 2)
  {
    id: 'frame-seabed1',
    name: 'seabed1.jpg',
    displayName: 'Image 13',
    thumbnailUrl: '/raw/seabed1.jpg',
    rawUrl: '/raw/seabed1.jpg',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/seabed1.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/seabed1.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['seabed1.jpg'],
  },

  // 14. Seabed 3 (Baseline scan 3)
  {
    id: 'frame-seabed3',
    name: 'seabed3.png',
    displayName: 'Image 14',
    thumbnailUrl: '/raw/seabed3.png',
    rawUrl: '/raw/seabed3.png',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/seabed3.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/seabed3.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['seabed3.png'],
  },

  // 15. Seabed 4 (Baseline scan 4)
  {
    id: 'frame-seabed4',
    name: 'seabed4.png',
    displayName: 'Image 15',
    thumbnailUrl: '/raw/seabed4.png',
    rawUrl: '/raw/seabed4.png',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/seabed4.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/seabed4.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['seabed4.png'],
  },
];

/**
 * Exact 1-to-1 Stem Map ensuring that:
 * - 'shipwreck' NEVER conflicts with 'shipwreck2' or 'shipwreck3'
 * - 'pipe' NEVER conflicts with 'pipe1'
 * - 'plane' NEVER conflicts with 'plane1'
 * - 'seabed' NEVER conflicts with 'seabed1', 'seabed3', or 'seabed4'
 */
export const STEM_TO_ASSET_MAP: Record<string, SonarAnalysisAsset> = {
  'shipwreck': ALL_SONAR_ANALYSIS_ASSETS[0],
  'ghostnet': ALL_SONAR_ANALYSIS_ASSETS[1],
  'human': ALL_SONAR_ANALYSIS_ASSETS[2],
  'artificial_reef': ALL_SONAR_ANALYSIS_ASSETS[3],
  'pipe': ALL_SONAR_ANALYSIS_ASSETS[4],
  'pipe1': ALL_SONAR_ANALYSIS_ASSETS[5],
  'plane': ALL_SONAR_ANALYSIS_ASSETS[6],
  'plane1': ALL_SONAR_ANALYSIS_ASSETS[7],
  'crabpot': ALL_SONAR_ANALYSIS_ASSETS[8],
  'shipwreck2': ALL_SONAR_ANALYSIS_ASSETS[9],
  'shipwreck3': ALL_SONAR_ANALYSIS_ASSETS[10],
  'seabed': ALL_SONAR_ANALYSIS_ASSETS[11],
  'seabed1': ALL_SONAR_ANALYSIS_ASSETS[12],
  'seabed3': ALL_SONAR_ANALYSIS_ASSETS[13],
  'seabed4': ALL_SONAR_ANALYSIS_ASSETS[14],
};

export const DEFAULT_SONAR_ANALYSIS_ASSETS = ALL_SONAR_ANALYSIS_ASSETS;

/**
 * Deterministically resolves a sonar asset by matching its exact stem name.
 * Prevents erroneous cross-mapping between different versions of the same debris class.
 */
export function resolveSonarAsset(
  fileName: string,
  index: number,
  originalUploadedUrl?: string
): SonarAnalysisAsset {
  const stem = getAssetStem(fileName);
  const match = STEM_TO_ASSET_MAP[stem] || ALL_SONAR_ANALYSIS_ASSETS[index % ALL_SONAR_ANALYSIS_ASSETS.length];

  const obs =
    OBSERVABILITY_METRICS_MAP[fileName.toLowerCase()] ||
    (match ? match.observability : undefined) || {
      imageId: index + 1,
      usableAreaPercent: 88.0,
      nadirGapPercent: 4.5,
      weakSignalPercent: 5.0,
      acousticShadowPercent: 2.5,
      qualityTier: 'HIGH',
      snrDb: 22.0,
      surveyReliabilityScore: 88,
      notes: 'Standard hydrographic acoustic scan; baseline backscatter profile.',
    };

  if (match) {
    return {
      ...match,
      id: `asset-${index}`,
      name: fileName,
      displayName: `Image ${index + 1}`,
      // If the caller provided a custom uploaded url, keep it for raw, otherwise use authentic rawUrl
      rawUrl: originalUploadedUrl || match.rawUrl,
      thumbnailUrl: originalUploadedUrl || match.thumbnailUrl,
      observability: obs,
    };
  }

  // Fallback for unrecognised files
  return {
    id: `asset-${index}`,
    name: fileName,
    displayName: `Image ${index + 1}`,
    rawUrl: originalUploadedUrl || '/raw/pipe.jpeg',
    thumbnailUrl: originalUploadedUrl || '/raw/pipe.jpeg',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: null,
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: null,
    detections: [],
    observability: obs,
  };
}
