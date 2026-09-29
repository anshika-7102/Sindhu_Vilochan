export interface NavItem {
  id: string;
  number: string;
  label: string;
  path: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'survey-ingestion', number: '01', label: 'Survey Ingestion', path: '/survey-ingestion', icon: 'Upload' },
  { id: 'sonar-analysis', number: '02', label: 'Sonar Analysis', path: '/sonar-analysis', icon: 'ScanLine' },
  { id: 'evidence-intelligence', number: '03', label: 'Evidence Intelligence', path: '/evidence-intelligence', icon: 'Search' },
  { id: 'human-review', number: '04', label: 'Human Review', path: '/human-review', icon: 'CheckSquare' },
  { id: 'debris-hotspots', number: '05', label: 'Debris Hotspots', path: '/debris-hotspots', icon: 'MapPin' },
  { id: 'reports', number: '06', label: 'Reports & Export', path: '/reports', icon: 'FileText' },
];

export interface EvidenceItem {
  id: string;
  evidenceId: string;
  location: string;
  coordinates: string;
  classification: string;
  confidence: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'needs-review';
  size: string;
  depth: string;
  detectedAt: string;
}

export const MOCK_EVIDENCE: EvidenceItem[] = [
  { id: '1', evidenceId: 'EV-2026-001', location: 'Sector A-12', coordinates: '15.42°N, 73.87°E', classification: 'Fishing Net', confidence: 92, status: 'pending', size: '3.2 m', depth: '24 m', detectedAt: '2026-09-14 08:42' },
  { id: '2', evidenceId: 'EV-2026-002', location: 'Sector A-14', coordinates: '15.45°N, 73.91°E', classification: 'Metal Debris', confidence: 87, status: 'confirmed', size: '1.8 m', depth: '31 m', detectedAt: '2026-09-14 08:45' },
  { id: '3', evidenceId: 'EV-2026-003', location: 'Sector B-07', coordinates: '15.38°N, 73.82°E', classification: 'Plastic Sheet', confidence: 78, status: 'needs-review', size: '5.1 m', depth: '18 m', detectedAt: '2026-09-14 09:01' },
  { id: '4', evidenceId: 'EV-2026-004', location: 'Sector B-09', coordinates: '15.40°N, 73.85°E', classification: 'Tire', confidence: 95, status: 'confirmed', size: '0.6 m', depth: '27 m', detectedAt: '2026-09-14 09:12' },
  { id: '5', evidenceId: 'EV-2026-005', location: 'Sector C-03', coordinates: '15.35°N, 73.78°E', classification: 'Cable Segment', confidence: 84, status: 'pending', size: '8.3 m', depth: '42 m', detectedAt: '2026-09-14 09:28' },
  { id: '6', evidenceId: 'EV-2026-006', location: 'Sector C-05', coordinates: '15.36°N, 73.80°E', classification: 'Container', confidence: 71, status: 'rejected', size: '2.4 m', depth: '35 m', detectedAt: '2026-09-14 09:35' },
  { id: '7', evidenceId: 'EV-2026-007', location: 'Sector D-11', coordinates: '15.48°N, 73.93°E', classification: 'Fishing Net', confidence: 89, status: 'pending', size: '4.0 m', depth: '22 m', detectedAt: '2026-09-14 09:51' },
  { id: '8', evidenceId: 'EV-2026-008', location: 'Sector D-14', coordinates: '15.50°N, 73.96°E', classification: 'Unknown Object', confidence: 63, status: 'needs-review', size: '1.2 m', depth: '38 m', detectedAt: '2026-09-14 10:04' },
];

export interface Hotspot {
  id: string;
  name: string;
  coordinates: string;
  priority: 'high' | 'medium' | 'low';
  debrisCount: number;
  area: string;
  topClassification: string;
  x: number;
  y: number;
}

export const MOCK_HOTSPOTS: Hotspot[] = [
  { id: 'h1', name: 'Hotspot Alpha', coordinates: '15.42°N, 73.87°E', priority: 'high', debrisCount: 14, area: '2.4 km²', topClassification: 'Fishing Nets', x: 28, y: 35 },
  { id: 'h2', name: 'Hotspot Beta', coordinates: '15.45°N, 73.91°E', priority: 'high', debrisCount: 9, area: '1.8 km²', topClassification: 'Metal Debris', x: 52, y: 28 },
  { id: 'h3', name: 'Hotspot Gamma', coordinates: '15.38°N, 73.82°E', priority: 'medium', debrisCount: 6, area: '1.1 km²', topClassification: 'Plastic Waste', x: 20, y: 58 },
  { id: 'h4', name: 'Hotspot Delta', coordinates: '15.50°N, 73.96°E', priority: 'medium', debrisCount: 5, area: '0.9 km²', topClassification: 'Mixed Debris', x: 72, y: 48 },
  { id: 'h5', name: 'Hotspot Epsilon', coordinates: '15.35°N, 73.78°E', priority: 'low', debrisCount: 3, area: '0.6 km²', topClassification: 'Cable Segments', x: 12, y: 72 },
  { id: 'h6', name: 'Hotspot Zeta', coordinates: '15.48°N, 73.93°E', priority: 'low', debrisCount: 2, area: '0.4 km²', topClassification: 'Containers', x: 62, y: 68 },
];

export interface UploadStatus {
  surveyPackage: boolean;
  xtfFile: boolean;
  validated: boolean;
  loaded: boolean;
}

export type FrameValidationStatus =
  | 'Valid'
  | 'Rejected (format)'
  | 'Rejected (corrupt/unreadable)'
  | 'Warning (low resolution)'
  | 'Duplicate — skipped';

export type SwathChannel = 'Port' | 'Starboard' | 'Dual-channel';

export interface SurveyMetadata {
  surveyId: string;
  corridor: string;
  frames: number;
  swath: string;
  sensor: string;
  origin: string;
  captureDate?: string;
  vessel?: string;
  operator?: string;
  region?: string;
  frequency?: string;
  isDemo?: boolean;
}

export const DEFAULT_MUMBAI_SURVEY: SurveyMetadata = {
  surveyId: 'SS-2026-0417',
  corridor: 'MUMBAI-OFFSHORE-CORRIDOR-2026 (Arabian Sea)',
  frames: 5,
  swath: '100 m',
  sensor: 'Klein 4900 (Dual-Freq 455/900 kHz)',
  origin: '18.9220°N, 72.8340°E',
  captureDate: '2026-09-14 08:30 UTC',
  vessel: 'RV Sagar Kanya • Hydrographic Division',
  operator: 'Cmdr. R. Sharma (IN-Naval Survey)',
  region: 'Arabian Sea Coastal Shelf',
  frequency: '900 kHz (High Resolution)',
  isDemo: true,
};

export interface IngestedImage {
  id: string;
  url: string;
  name: string;
  displayName?: string;
  size: string;
  sizeBytes?: number;
  dimensions?: { width: number; height: number };
  frameNumber: number;
  status: FrameValidationStatus;
  statusReason?: string;
  swathSide: SwathChannel;
  checksum: string;
  bitDepth?: string;
  coordinates?: string;
  progress?: number;
  // Per-image metadata extracted from metadata.csv
  imageMetadata?: Record<string, string>;
  depth?: string;
  altitude?: string;
  heading?: string;
  speed?: string;
  swathWidth?: string;
  timestamp?: string;
  sensor?: string;
  vessel?: string;
}

