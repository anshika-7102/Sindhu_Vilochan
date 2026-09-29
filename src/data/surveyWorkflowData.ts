export interface ReviewCandidate {
  id: string;
  displayId: string;
  name: string;
  candidateType: string;
  source: string;
  locationStatus: string;
  pixelScale: string;
  rawUrl: string;
  heatmapUrl: string;
  bboxUrl: string | null;
  shapeUrl?: string | null;
  shadowUrl?: string | null;
  preprocessedUrl?: string | null;
  boxLabel?: string;
  coordinates: string;
  depth: string;
  checklist: {
    distinctStructure: 'Yes' | 'No' | 'Unclear';
    objectGeometry: 'Yes' | 'No' | 'Unclear';
    acousticShadow?: 'Yes' | 'No' | 'Unclear';
    naturalSimilarity: 'Low' | 'Medium' | 'High';
  };
  decision?: 'confirmed' | 'natural' | 'false-positive' | 'further-review' | 'needs-review' | null;
  confirmedClass?: string;
  notes?: string;
}

export interface HotspotDetectionPreview {
  id: string;
  label: string;
  className: string;
  confidence: number;
  boxColor: 'red' | 'blue' | 'yellow';
  rawUrl: string;
  bboxUrl: string | null;
}

export interface HotspotPin {
  id: string;
  lat: number;
  lng: number;
  type: 'confirmed' | 'probable' | 'novel' | 'non-debris';
}

export interface HotspotItem {
  id: string;
  code: string;
  location: string;
  lat: number;
  lng: number;
  coordinates: { x: number; y: number }; // percentage on map fallback
  radius: number; // visual cluster radius
  detectionsCount: number;
  dominantTypes: string;
  priority: 'High' | 'Medium' | 'Low';
  pins: HotspotPin[];
  previews: HotspotDetectionPreview[];
}

export interface ReviewedDetectionRow {
  index: number;
  imageId: string;
  classType: string;
  confidence: number;
  status: 'Confirmed' | 'Marked' | 'Human Confirmed' | 'Natural Formation' | 'False Positive' | 'Under Review' | string;
  location: string;
  hotspot: string;
  priority: 'High' | 'Medium' | 'Low';
  reliability?: number;
}

// Human Review Candidate (Novel Anthropogenic Anomaly)
export const INITIAL_REVIEW_CANDIDATES: ReviewCandidate[] = [
  {
    id: 'cand-human',
    displayId: 'Image 3',
    name: 'human.png',
    candidateType: 'Anthropogenic Anomaly',
    source: 'PatchCore Unsupervised Engine',
    locationStatus: 'Geo-referenced',
    pixelScale: '0.05 m/pixel',
    rawUrl: '/raw/human.jpeg',
    heatmapUrl: '/PatchCore/human.png',
    bboxUrl: '/unknown/human.png',
    shapeUrl: '/unknown/human.png',
    shadowUrl: null,
    preprocessedUrl: '/pre-processed/human.png',
    boxLabel: 'NOVEL ANOMALY',
    coordinates: '12.3412° N, 72.9721° E',
    depth: '19.0 m',
    checklist: {
      distinctStructure: 'Yes',
      objectGeometry: 'Yes',
      naturalSimilarity: 'Low',
    },
    decision: null,
    notes: 'Out-of-distribution acoustic anomaly detected by PatchCore model. High localized density divergence compared to surrounding sandy seabed.',
  },
];

// 4 Hotspots as shown in Step 05 Debris Hotspots
export const SURVEY_HOTSPOTS: HotspotItem[] = [
  {
    id: 'h-1',
    code: 'H-1',
    location: '12.3456, 72.9876',
    lat: 12.3456,
    lng: 72.9876,
    coordinates: { x: 28, y: 32 },
    radius: 46,
    detectionsCount: 7,
    dominantTypes: 'Ghost net',
    priority: 'High',
    pins: [
      { id: 'pin-1', lat: 12.3462, lng: 72.9872, type: 'confirmed' },
      { id: 'pin-2', lat: 12.3452, lng: 72.9881, type: 'confirmed' },
      { id: 'pin-3', lat: 12.3448, lng: 72.9868, type: 'confirmed' },
      { id: 'pin-4', lat: 12.3465, lng: 72.9886, type: 'probable' },
      { id: 'pin-5', lat: 12.3441, lng: 72.9870, type: 'novel' },
      { id: 'pin-6', lat: 12.3459, lng: 72.9861, type: 'non-debris' },
    ],
    previews: [
      {
        id: 'p-1',
        label: 'Ghost net',
        className: 'Ghost net',
        confidence: 0.92,
        boxColor: 'red',
        rawUrl: '/raw/ghostnet.jpeg',
        bboxUrl: '/bbox/ghostnet.png',
      },
      {
        id: 'p-2',
        label: 'Crab-Pot',
        className: 'Crab-Pot ',
        confidence: 0.81,
        boxColor: 'blue',
        rawUrl: '/raw/crabpot.jpg',
        bboxUrl: '/bbox/crabpot.png',
      },
      {
        id: 'p-3',
        label: 'Anomaly',
        className: 'Anthropogenic Anomaly',
        confidence: 0.89,
        boxColor: 'red',
        rawUrl: '/raw/human.jpeg',
        bboxUrl: '/unknown/human.png',
      },
      {
        id: 'p-4',
        label: 'Pipe',
        className: 'Subsea Pipe',
        confidence: 0.76,
        boxColor: 'blue',
        rawUrl: '/raw/pipe.jpeg',
        bboxUrl: '/bbox/pipe.png',
      },
      {
        id: 'p-5',
        label: 'Plane',
        className: 'Aircraft Airframe',
        confidence: 0.94,
        boxColor: 'yellow',
        rawUrl: '/raw/plane.jpg',
        bboxUrl: '/bbox/plane.png',
      },
    ],
  },
  {
    id: 'h-2',
    code: 'H-2',
    location: '12.3412, 72.9721',
    lat: 12.3412,
    lng: 72.9721,
    coordinates: { x: 42, y: 68 },
    radius: 42,
    detectionsCount: 5,
    dominantTypes: 'Pipe, Unknown',
    priority: 'Medium',
    pins: [
      { id: 'pin-7', lat: 12.3418, lng: 72.9726, type: 'confirmed' },
      { id: 'pin-8', lat: 12.3407, lng: 72.9715, type: 'confirmed' },
      { id: 'pin-9', lat: 12.3421, lng: 72.9719, type: 'probable' },
      { id: 'pin-10', lat: 12.3409, lng: 72.9730, type: 'novel' },
    ],
    previews: [
      {
        id: 'p-6',
        label: 'Pipe',
        className: 'Pipe Conduit',
        confidence: 0.96,
        boxColor: 'blue',
        rawUrl: '/raw/pipe.jpeg',
        bboxUrl: '/bbox/pipe.png',
      },
      {
        id: 'p-7',
        label: 'Pipe 2',
        className: 'Pipe Joint',
        confidence: 0.95,
        boxColor: 'blue',
        rawUrl: '/raw/pipe1.jpeg',
        bboxUrl: '/bbox/pipe1.png',
      },
      {
        id: 'p-8',
        label: 'Anomaly',
        className: 'Anthropogenic Anomaly',
        confidence: 0.85,
        boxColor: 'red',
        rawUrl: '/raw/human.jpeg',
        bboxUrl: '/unknown/human.png',
      },
      {
        id: 'p-9',
        label: 'Plane',
        className: 'Fuselage',
        confidence: 0.97,
        boxColor: 'blue',
        rawUrl: '/raw/plane.jpg',
        bboxUrl: '/bbox/plane.png',
      },
      {
        id: 'p-10',
        label: 'Wing',
        className: 'Wing Airframe',
        confidence: 0.97,
        boxColor: 'yellow',
        rawUrl: '/raw/plane1.jpg',
        bboxUrl: '/bbox/plane1.png',
      },
    ],
  },
  {
    id: 'h-3',
    code: 'H-3',
    location: '12.3589, 72.9954',
    lat: 12.3589,
    lng: 72.9954,
    coordinates: { x: 74, y: 38 },
    radius: 40,
    detectionsCount: 4,
    dominantTypes: 'Tyre',
    priority: 'Low',
    pins: [
      { id: 'pin-11', lat: 12.3592, lng: 72.9951, type: 'confirmed' },
      { id: 'pin-12', lat: 12.3583, lng: 72.9959, type: 'probable' },
      { id: 'pin-13', lat: 12.3596, lng: 72.9946, type: 'novel' },
      { id: 'pin-14', lat: 12.3586, lng: 72.9957, type: 'non-debris' },
    ],
    previews: [
      {
        id: 'p-11',
        label: 'Crab-Pot',
        className: 'Crab Pot A',
        confidence: 0.95,
        boxColor: 'blue',
        rawUrl: '/raw/crabpot.jpg',
        bboxUrl: '/bbox/crabpot.png',
      },
      {
        id: 'p-12',
        label: 'Crab-Pot 2',
        className: 'Crab Pot B',
        confidence: 0.96,
        boxColor: 'blue',
        rawUrl: '/raw/crabpot.jpg',
        bboxUrl: '/bbox/crabpot.png',
      },
      {
        id: 'p-13',
        label: 'Shipwreck',
        className: 'Hull Section',
        confidence: 0.91,
        boxColor: 'blue',
        rawUrl: '/raw/shipwreck2.png',
        bboxUrl: '/bbox/shipwreck2.png',
      },
      {
        id: 'p-14',
        label: 'Pipe',
        className: 'Pipeline Segment',
        confidence: 0.88,
        boxColor: 'blue',
        rawUrl: '/raw/pipe1.jpeg',
        bboxUrl: '/bbox/pipe1.png',
      },
    ],
  },
  {
    id: 'h-4',
    code: 'H-4',
    location: '12.3301, 72.9810',
    lat: 12.3301,
    lng: 72.9810,
    coordinates: { x: 76, y: 72 },
    radius: 34,
    detectionsCount: 3,
    dominantTypes: 'Shipwreck, Ghost net',
    priority: 'Medium',
    pins: [
      { id: 'pin-15', lat: 12.3306, lng: 72.9814, type: 'confirmed' },
      { id: 'pin-16', lat: 12.3297, lng: 72.9806, type: 'novel' },
      { id: 'pin-17', lat: 12.3312, lng: 72.9819, type: 'confirmed' },
    ],
    previews: [
      {
        id: 'p-15',
        label: 'Anomaly',
        className: 'Anthropogenic Anomaly',
        confidence: 0.91,
        boxColor: 'red',
        rawUrl: '/raw/human.jpeg',
        bboxUrl: '/unknown/human.png',
      },
      {
        id: 'p-16',
        label: 'Shipwreck',
        className: 'Wreckage Keel',
        confidence: 0.96,
        boxColor: 'blue',
        rawUrl: '/raw/shipwreck.png',
        bboxUrl: '/bbox/shipwreck.png',
      },
      {
        id: 'p-17',
        label: 'Ghost net',
        className: 'Derelict Netting',
        confidence: 0.89,
        boxColor: 'yellow',
        rawUrl: '/raw/ghostnet.jpeg',
        bboxUrl: '/bbox/ghostnet.png',
      },
    ],
  },
];

// Reviewed detections list synthesized from Layers 01 to 04
export const REVIEWED_DETECTIONS_TABLE: ReviewedDetectionRow[] = [
  {
    index: 1,
    imageId: 'DET-001',
    classType: 'Pipe',
    confidence: 0.96,
    reliability: 94,
    status: 'Confirmed',
    location: '12.3456, 72.9876',
    hotspot: 'H-1',
    priority: 'High',
  },
  {
    index: 2,
    imageId: 'DET-002',
    classType: 'Ghost Net',
    confidence: 0.98,
    reliability: 89,
    status: 'Confirmed',
    location: '12.3462, 72.9872',
    hotspot: 'H-1',
    priority: 'High',
  },
  {
    index: 3,
    imageId: 'DET-003',
    classType: 'Shipwreck',
    confidence: 0.97,
    reliability: 96,
    status: 'Confirmed',
    location: '12.3468, 72.9880',
    hotspot: 'H-1',
    priority: 'High',
  },
  {
    index: 4,
    imageId: 'DET-004',
    classType: 'Crab Pot',
    confidence: 0.96,
    reliability: 83,
    status: 'Confirmed',
    location: '12.3452, 72.9881',
    hotspot: 'H-1',
    priority: 'High',
  },
  {
    index: 5,
    imageId: 'DET-005',
    classType: 'Anthropogenic Anomaly',
    confidence: 0.91,
    reliability: 76,
    status: 'Confirmed',
    location: '12.3441, 72.9870',
    hotspot: 'H-1',
    priority: 'High',
  },
  {
    index: 6,
    imageId: 'DET-006',
    classType: 'Pipe',
    confidence: 0.97,
    reliability: 94,
    status: 'Confirmed',
    location: '12.3418, 72.9726',
    hotspot: 'H-2',
    priority: 'High',
  },
  {
    index: 7,
    imageId: 'DET-007',
    classType: 'Shipwreck',
    confidence: 0.97,
    reliability: 92,
    status: 'Confirmed',
    location: '12.3420, 72.9735',
    hotspot: 'H-2',
    priority: 'High',
  },
  {
    index: 8,
    imageId: 'DET-008',
    classType: 'Plane',
    confidence: 0.98,
    reliability: 97,
    status: 'Confirmed',
    location: '12.3407, 72.9715',
    hotspot: 'H-2',
    priority: 'High',
  },
  {
    index: 9,
    imageId: 'DET-009',
    classType: 'Crab Pot',
    confidence: 0.95,
    reliability: 91,
    status: 'Confirmed',
    location: '12.3589, 72.9954',
    hotspot: 'H-3',
    priority: 'Low',
  },
  {
    index: 10,
    imageId: 'DET-010',
    classType: 'Shipwreck',
    confidence: 0.96,
    reliability: 88,
    status: 'Confirmed',
    location: '12.3592, 72.9951',
    hotspot: 'H-3',
    priority: 'Low',
  },
  {
    index: 11,
    imageId: 'DET-011',
    classType: 'Plane',
    confidence: 0.95,
    reliability: 93,
    status: 'Confirmed',
    location: '12.3301, 72.9810',
    hotspot: 'H-4',
    priority: 'Medium',
  },
];
