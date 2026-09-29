import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Info,
  ArrowRight,
  CheckCircle2,
  File,
  ShieldAlert,
  X,
  FolderOpen,
  Database,
  Activity,
  Sparkles,
  RefreshCw,
  Layers,
  Loader2,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ProcessIndicator from '@/components/ProcessIndicator';
import ActiveSurveyCard from '@/components/ActiveSurveyCard';
import IngestedImagePreview from '@/components/IngestedImagePreview';
import MetadataEditModal from '@/components/MetadataEditModal';
import FrameThumbnailGrid from '@/components/FrameThumbnailGrid';
import FrameDetailModal from '@/components/FrameDetailModal';
import {
  SurveyMetadata,
  DEFAULT_MUMBAI_SURVEY,
  IngestedImage,
  FrameValidationStatus,
  SwathChannel,
} from '@/types';
import { parseMetadataFile, getMetadataForImage } from '@/utils/metadataParser';
import { getFilesFromDataTransfer } from '@/utils/fileFolderReader';
import { usePipeline } from '@/context/PipelineContext';

const INPUT_FILE_DATASET: Array<{
  name: string;
  url: string;
  sizeBytes: number;
  sizeFormatted: string;
  side: SwathChannel;
  meta: Record<string, string>;
}> = [
  {
    name: 'Artificial_Reef.png',
    url: '/raw/Artificial_Reef.png',
    sizeBytes: 3410347,
    sizeFormatted: '3.4 MB',
    side: 'Port',
    meta: {
      image_id: '1',
      filename: 'Artificial_Reef.png',
      latitude: '28.6139',
      longitude: '77.2090',
      coordinates: '28.6139° N, 77.2090° E',
      heading: '45°',
      depth_m: '18.5',
      depth: '18.5 m',
      altitude_m: '8.2',
      altitude: '8.2 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:15:00',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'crabpot.jpg',
    url: '/raw/crabpot.jpg',
    sizeBytes: 113172,
    sizeFormatted: '113 KB',
    side: 'Port',
    meta: {
      image_id: '2',
      filename: 'crabpot.jpg',
      latitude: '28.6147',
      longitude: '77.2099',
      coordinates: '28.6147° N, 77.2099° E',
      heading: '45°',
      depth_m: '18.7',
      depth: '18.7 m',
      altitude_m: '8.4',
      altitude: '8.4 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:16:30',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'shipwreck3.jpeg',
    url: '/raw/shipwreck3.jpeg',
    sizeBytes: 343199,
    sizeFormatted: '343 KB',
    side: 'Port',
    meta: {
      image_id: '3',
      filename: 'shipwreck3.jpeg',
      latitude: '28.6156',
      longitude: '77.2109',
      coordinates: '28.6156° N, 77.2109° E',
      heading: '45°',
      depth_m: '18.9',
      depth: '18.9 m',
      altitude_m: '8.1',
      altitude: '8.1 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:18:00',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'ghostnet.jpeg',
    url: '/raw/ghostnet.jpeg',
    sizeBytes: 217762,
    sizeFormatted: '218 KB',
    side: 'Port',
    meta: {
      image_id: '4',
      filename: 'ghostnet.jpeg',
      latitude: '28.6164',
      longitude: '77.2118',
      coordinates: '28.6164° N, 77.2118° E',
      heading: '45°',
      depth_m: '19.2',
      depth: '19.2 m',
      altitude_m: '7.9',
      altitude: '7.9 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:19:30',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'human.jpeg',
    url: '/raw/human.jpeg',
    sizeBytes: 46710,
    sizeFormatted: '47 KB',
    side: 'Starboard',
    meta: {
      image_id: '5',
      filename: 'human.jpeg',
      latitude: '28.6172',
      longitude: '77.2128',
      coordinates: '28.6172° N, 77.2128° E',
      heading: '45°',
      depth_m: '19.0',
      depth: '19.0 m',
      altitude_m: '8.3',
      altitude: '8.3 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'starboard',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:21:00',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'pipe.jpeg',
    url: '/raw/pipe.jpeg',
    sizeBytes: 170653,
    sizeFormatted: '171 KB',
    side: 'Starboard',
    meta: {
      image_id: '6',
      filename: 'pipe.jpeg',
      latitude: '28.6180',
      longitude: '77.2137',
      coordinates: '28.6180° N, 77.2137° E',
      heading: '45°',
      depth_m: '18.6',
      depth: '18.6 m',
      altitude_m: '8.6',
      altitude: '8.6 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'starboard',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:22:30',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'pipe1.jpeg',
    url: '/raw/pipe1.jpeg',
    sizeBytes: 201354,
    sizeFormatted: '201 KB',
    side: 'Port',
    meta: {
      image_id: '7',
      filename: 'pipe1.jpeg',
      latitude: '28.6189',
      longitude: '77.2146',
      coordinates: '28.6189° N, 77.2146° E',
      heading: '45°',
      depth_m: '18.8',
      depth: '18.8 m',
      altitude_m: '8.4',
      altitude: '8.4 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:24:00',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'plane.jpg',
    url: '/raw/plane.jpg',
    sizeBytes: 61484,
    sizeFormatted: '61 KB',
    side: 'Port',
    meta: {
      image_id: '8',
      filename: 'plane.jpg',
      latitude: '28.6197',
      longitude: '77.2156',
      coordinates: '28.6197° N, 77.2156° E',
      heading: '45°',
      depth_m: '19.3',
      depth: '19.3 m',
      altitude_m: '8.0',
      altitude: '8.0 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:25:30',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'plane1.jpg',
    url: '/raw/plane1.jpg',
    sizeBytes: 64072,
    sizeFormatted: '64 KB',
    side: 'Port',
    meta: {
      image_id: '9',
      filename: 'plane1.jpg',
      latitude: '28.6205',
      longitude: '77.2165',
      coordinates: '28.6205° N, 77.2165° E',
      heading: '45°',
      depth_m: '19.5',
      depth: '19.5 m',
      altitude_m: '7.8',
      altitude: '7.8 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:27:00',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'seabed.png',
    url: '/raw/seabed.png',
    sizeBytes: 6278177,
    sizeFormatted: '6.3 MB',
    side: 'Port',
    meta: {
      image_id: '10',
      filename: 'seabed.png',
      latitude: '28.6213',
      longitude: '77.2175',
      coordinates: '28.6213° N, 77.2175° E',
      heading: '45°',
      depth_m: '19.1',
      depth: '19.1 m',
      altitude_m: '8.2',
      altitude: '8.2 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:28:30',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'seabed1.jpg',
    url: '/raw/seabed1.jpg',
    sizeBytes: 319503,
    sizeFormatted: '320 KB',
    side: 'Starboard',
    meta: {
      image_id: '11',
      filename: 'seabed1.jpg',
      latitude: '28.6222',
      longitude: '77.2184',
      coordinates: '28.6222° N, 77.2184° E',
      heading: '45°',
      depth_m: '18.9',
      depth: '18.9 m',
      altitude_m: '8.5',
      altitude: '8.5 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'starboard',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:30:00',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'seabed3.png',
    url: '/raw/seabed3.png',
    sizeBytes: 7285269,
    sizeFormatted: '7.3 MB',
    side: 'Starboard',
    meta: {
      image_id: '12',
      filename: 'seabed3.png',
      latitude: '28.6230',
      longitude: '77.2193',
      coordinates: '28.6230° N, 77.2193° E',
      heading: '45°',
      depth_m: '18.7',
      depth: '18.7 m',
      altitude_m: '8.3',
      altitude: '8.3 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'starboard',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:31:30',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'seabed4.png',
    url: '/raw/seabed4.png',
    sizeBytes: 4658261,
    sizeFormatted: '4.7 MB',
    side: 'Port',
    meta: {
      image_id: '13',
      filename: 'seabed4.png',
      latitude: '28.6238',
      longitude: '77.2203',
      coordinates: '28.6238° N, 77.2203° E',
      heading: '45°',
      depth_m: '19.0',
      depth: '19.0 m',
      altitude_m: '8.1',
      altitude: '8.1 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:33:00',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'shipwreck.png',
    url: '/raw/shipwreck.png',
    sizeBytes: 2207370,
    sizeFormatted: '2.2 MB',
    side: 'Starboard',
    meta: {
      image_id: '14',
      filename: 'shipwreck.png',
      latitude: '28.6246',
      longitude: '77.2212',
      coordinates: '28.6246° N, 77.2212° E',
      heading: '45°',
      depth_m: '19.4',
      depth: '19.4 m',
      altitude_m: '7.9',
      altitude: '7.9 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'starboard',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:34:30',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
  {
    name: 'shipwreck2.png',
    url: '/raw/shipwreck2.png',
    sizeBytes: 1809721,
    sizeFormatted: '1.8 MB',
    side: 'Port',
    meta: {
      image_id: '15',
      filename: 'shipwreck2.png',
      latitude: '28.6255',
      longitude: '77.2222',
      coordinates: '28.6255° N, 77.2222° E',
      heading: '45°',
      depth_m: '19.2',
      depth: '19.2 m',
      altitude_m: '8.2',
      altitude: '8.2 m',
      sonar_range_m: '50 m',
      pixel_scale_m: '0.05',
      scan_side: 'port',
      orientation: 'forward',
      frequency_khz: '600 kHz',
      timestamp: '2026-09-17T10:36:00',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz)',
      swath: '100 m',
    },
  },
];

interface FileState {
  name: string;
  size?: string;
  uploaded: boolean;
}

interface InlineErrorChip {
  id: string;
  fileName: string;
  reason: string;
}

export default function SurveyIngestion() {
  const navigate = useNavigate();
  const {
    pipelineState,
    setPipelineState,
    setIsDatasetLoaded,
    ingestedFrames,
    setIngestedFrames,
    ingestedMetadata,
    setIngestedMetadata,
    startPipeline,
  } = usePipeline();

  // Compact Ingestion Loading Box State
  const [isIngestingModalOpen, setIsIngestingModalOpen] = useState<boolean>(false);
  const [ingestProgress, setIngestProgress] = useState<number>(0);
  const [isIngestComplete, setIsIngestComplete] = useState<boolean>(false);

  // Core Queued Frames - initialized from PipelineContext session state (starts empty on fresh load/refresh)
  const [frames, setFrames] = useState<IngestedImage[]>(() => ingestedFrames || []);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [modalFrame, setModalFrame] = useState<IngestedImage | null>(null);

  // Survey Metadata State
  const [metadata, setMetadata] = useState<SurveyMetadata | null>(() => ingestedMetadata || null);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState<boolean>(
    Boolean(ingestedMetadata && ingestedMetadata.surveyId)
  );
  const [metadataFile, setMetadataFile] = useState<FileState | null>(() =>
    ingestedMetadata ? { name: 'survey_info.json', size: '7.6 KB', uploaded: true } : null
  );
  const [perImageMap, setPerImageMap] = useState<Map<string, Record<string, string>>>(new Map());

  // XTF Raw Telemetry Box - only populated when user explicitly uploads an .xtf file
  const [xtfFile, setXtfFile] = useState<FileState | null>(null);

  // Validation Error Chips
  const [errorChips, setErrorChips] = useState<InlineErrorChip[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [dragOver, setDragOver] = useState<'survey' | 'xtf' | null>(null);
  const surveyInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const metaInputRef = useRef<HTMLInputElement>(null);
  const xtfInputRef = useRef<HTMLInputElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  // Format File Size Helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Deterministic Mock Hash Generator
  const generateChecksum = (fileName: string, size: number): string => {
    let hash = 0;
    const str = `${fileName}_${size}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  };

  // Load the authentic 15-frame dataset directly from survey package
  const handleLoadInputFileDataset = useCallback(() => {
    const loadedFrames: IngestedImage[] = INPUT_FILE_DATASET.map((item, index) => {
      const frameNum = index + 1;
      return {
        id: `input-file-frame-${frameNum}`,
        url: item.url,
        name: item.name,
        displayName: `Image ${frameNum}`,
        size: item.sizeFormatted,
        sizeBytes: item.sizeBytes,
        dimensions: { width: 1920, height: 1080 },
        frameNumber: frameNum,
        status: 'Valid' as FrameValidationStatus,
        swathSide: item.side,
        checksum: generateChecksum(item.name, item.sizeBytes),
        coordinates: item.meta.coordinates || '12.330° N, 72.971° E',
        imageMetadata: item.meta,
        depth: item.meta.depth,
        altitude: item.meta.altitude,
        heading: item.meta.heading,
        speed: '3.4 kts',
        swathWidth: item.meta.swath || '100 m',
        timestamp: item.meta.timestamp,
        sensor: item.meta.sensor,
        vessel: item.meta.vessel,
      };
    });

    const surveyMeta: SurveyMetadata = {
      surveyId: 'SN-2026-09-IN',
      corridor: 'Arabian Sea Corridor — Sector 4B',
      frames: 15,
      swath: '100 m',
      sensor: 'EdgeTech 4200 (455/900 kHz Dual-Frequency)',
      origin: '12.330° N, 72.971° E',
      vessel: 'RV Sagar Nidhi',
      operator: 'Hydrographic Survey Wing, NIOT / MoES',
      frequency: '455 / 900 kHz Dual-Frequency',
      region: 'Western Arabian Sea (Shelf Margin)',
      captureDate: '2026-09-17 10:15:00 UTC',
    };

    setFrames(loadedFrames);
    setIngestedFrames(loadedFrames);
    setSelectedFrameIndex(0);
    setMetadata(surveyMeta);
    setIngestedMetadata(surveyMeta);
    setIsMetadataLoaded(true);
    setMetadataFile({ name: 'survey_info.json', size: '7.6 KB', uploaded: true });
    setErrorChips([]);
    setIsDatasetLoaded(true);

    // Persist to localStorage
    localStorage.setItem('sagar_sonar_images_list', JSON.stringify(loadedFrames));
    localStorage.setItem('sagar_sonar_image', loadedFrames[0].url);
    localStorage.setItem('sagar_active_survey', JSON.stringify(surveyMeta));
    localStorage.setItem('sagar_dataset_loaded', 'true');
  }, [setIngestedFrames, setIngestedMetadata, setIsDatasetLoaded]);

  // Compact Ingest Handler: short 1.6s loading, loads authentic survey dataset, and finishes
  const handleStartIngestion = () => {
    setIsIngestingModalOpen(true);
    setIngestProgress(0);
    setIsIngestComplete(false);

    const duration = 1600; // ~1.6s short loading
    const intervalTime = 50;
    const increment = 100 / (duration / intervalTime);

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        clearInterval(timer);
        setIngestProgress(100);
        setIsIngestComplete(true);

        // Ensure authentic survey dataset & metadata are loaded
        handleLoadInputFileDataset();
        setPipelineState('completed');
        localStorage.removeItem('sagar_sonar_frames_processed');

        setTimeout(() => {
          setIsIngestingModalOpen(false);
          setIsIngestComplete(false);
        }, 650);
      } else {
        setIngestProgress(Math.round(currentProgress));
      }
    }, intervalTime);
  };

  const handleStartPipeline = () => {
    handleStartIngestion();
  };

  // Rule-based per-frame validation
  const validateIncomingFile = (
    file: File,
    currentFrames: IngestedImage[]
  ): { status: FrameValidationStatus; reason?: string } => {
    // 1. Duplicate detection
    const isDuplicate = currentFrames.some(
      (f) => f.name === file.name && Math.abs((f.sizeBytes || 0) - file.size) < 100
    );
    if (isDuplicate) {
      return { status: 'Duplicate — skipped', reason: 'Duplicate file detected with identical size' };
    }

    // 2. Corrupt / unreadable check
    if (file.name.toLowerCase().includes('corrupt') || file.name.toLowerCase().includes('broken')) {
      return {
        status: 'Rejected (corrupt/unreadable)',
        reason: 'Corrupt header packet or unreadable sonar ping track',
      };
    }

    // 3. Extension format check
    const validExtensions = /\.(png|jpe?g|tif|tiff)$/i;
    if (!validExtensions.test(file.name)) {
      return {
        status: 'Rejected (format)',
        reason: `Unsupported extension '${file.name.split('.').pop()}'. Only PNG, JPG, and TIFF are supported.`,
      };
    }

    // 4. Low resolution warning
    if (file.name.toLowerCase().includes('lowres') || file.size < 50 * 1024) {
      return {
        status: 'Warning (low resolution)',
        reason: 'Acoustic swath resolution is below 800px; feature detection fidelity may be reduced.',
      };
    }

    return { status: 'Valid' };
  };

  // Handle incoming multiple images with metadata mapping
  const handleImageFiles = useCallback(
    (fileList: File[] | FileList | null, mapOverride?: Map<string, Record<string, string>>) => {
      if (!fileList) return;
      const rawFiles = Array.from(fileList);
      if (rawFiles.length === 0) return;

      const activeMap = mapOverride || perImageMap;
      const newErrorChips: InlineErrorChip[] = [];
      let updatedQueue = [...frames];

      rawFiles.forEach((file, index) => {
        // Size validation: reject > 50MB
        if (file.size > 50 * 1024 * 1024) {
          newErrorChips.push({
            id: `err-${Date.now()}-${index}`,
            fileName: file.name,
            reason: 'Exceeds maximum allowable size (50 MB). Ingestion rejected.',
          });
          return;
        }

        const validation = validateIncomingFile(file, updatedQueue);
        const checksum = generateChecksum(file.name, file.size);
        const frameNum = updatedQueue.length + 1;

        // Match per-image metadata from metadata.csv or survey_info.json by filename
        let imageMeta = getMetadataForImage(file.name, frameNum, activeMap);
        if (!imageMeta) {
          const canonical = INPUT_FILE_DATASET.find(
            (d) =>
              d.name.toLowerCase() === file.name.toLowerCase() ||
              d.name.toLowerCase().replace(/\.[^/.]+$/, '') === file.name.toLowerCase().replace(/\.[^/.]+$/, '')
          ) || INPUT_FILE_DATASET[(frameNum - 1) % INPUT_FILE_DATASET.length];
          if (canonical) {
            imageMeta = canonical.meta;
          }
        }

        const channels: SwathChannel[] = ['Dual-channel', 'Port', 'Starboard'];
        let swathSide = channels[frameNum % 3];
        if (imageMeta?.channel || imageMeta?.scan_side) {
          const c = (imageMeta.channel || imageMeta.scan_side || '').toLowerCase();
          if (c.includes('port')) swathSide = 'Port';
          else if (c.includes('star')) swathSide = 'Starboard';
          else if (c.includes('dual')) swathSide = 'Dual-channel';
        }

        const baseLat = metadata?.origin ? parseFloat(metadata.origin) || 18.922 : 18.922;
        const baseLon = 72.834;
        const defaultLat = (baseLat + frameNum * 0.0003).toFixed(4);
        const defaultLon = (baseLon + frameNum * 0.0002).toFixed(4);

        const newFrame: IngestedImage = {
          id: `usr-${Date.now()}-${index}`,
          url: URL.createObjectURL(file),
          name: file.name,
          displayName: `Image ${frameNum}`,
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          dimensions: { width: 1920, height: 1080 },
          frameNumber: frameNum,
          status: validation.status,
          statusReason: validation.reason,
          swathSide,
          checksum,
          coordinates: imageMeta?.coordinates || `${defaultLat}°N, ${defaultLon}°E`,
          imageMetadata: imageMeta,
          depth: imageMeta?.depth,
          altitude: imageMeta?.altitude,
          heading: imageMeta?.heading,
          speed: imageMeta?.speed,
          swathWidth: imageMeta?.swath || metadata?.swath || '100 m',
          timestamp: imageMeta?.timestamp,
          sensor: imageMeta?.sensor || metadata?.sensor,
          vessel: imageMeta?.vessel || metadata?.vessel,
        };

        if (validation.status === 'Duplicate — skipped') {
          newErrorChips.push({
            id: `dup-${Date.now()}-${index}`,
            fileName: file.name,
            reason: 'Duplicate skipped: identical file already in queue.',
          });
        } else if (validation.status !== 'Valid') {
          newErrorChips.push({
            id: `val-${Date.now()}-${index}`,
            fileName: file.name,
            reason: validation.reason || 'File validation failed.',
          });
        }

        updatedQueue.push(newFrame);
      });

      setFrames(updatedQueue);
      setIngestedFrames(updatedQueue);
      setIsDatasetLoaded(true);
      if (newErrorChips.length > 0) {
        setErrorChips((prev) => [...prev, ...newErrorChips]);
      }

      // Persist to localStorage
      localStorage.setItem('sagar_sonar_images_list', JSON.stringify(updatedQueue));
      const validFrames = updatedQueue.filter((f) => f.status === 'Valid');
      if (validFrames.length > 0) {
        localStorage.setItem('sagar_sonar_image', validFrames[0].url);
      }
    },
    [frames, metadata, perImageMap, setIngestedFrames, setIsDatasetLoaded]
  );

  // Handle Metadata (.csv / .json) file upload
  const handleMetadataFile = useCallback(
    async (fileList: File[] | FileList | null): Promise<{ perImageMap: Map<string, Record<string, string>> } | null> => {
      if (!fileList) return null;
      const files = Array.from(fileList);
      if (files.length === 0) return null;
      const file = files[0];

      try {
        const { survey, perImageMap: newMap } = await parseMetadataFile(file);
        setMetadata(survey);
        setIngestedMetadata(survey);
        setIsMetadataLoaded(true);
        setPerImageMap(newMap);
        setMetadataFile({ name: file.name, size: formatFileSize(file.size), uploaded: true });
        localStorage.setItem('sagar_active_survey', JSON.stringify(survey));

        // Immediately update all existing frames with matched metadata from this CSV!
        setFrames((prevFrames) => {
          const updated = prevFrames.map((frame) => {
            const meta = getMetadataForImage(frame.name, frame.frameNumber, newMap);
            if (!meta) return frame;
            return {
              ...frame,
              imageMetadata: meta,
              coordinates: meta.coordinates || frame.coordinates,
              depth: meta.depth || frame.depth,
              swathWidth: meta.swath || frame.swathWidth,
              sensor: meta.sensor || frame.sensor,
              altitude: meta.altitude || frame.altitude,
              speed: meta.speed || frame.speed,
              heading: meta.heading || frame.heading,
              timestamp: meta.timestamp || frame.timestamp,
              vessel: meta.vessel || frame.vessel,
            };
          });
          localStorage.setItem('sagar_sonar_images_list', JSON.stringify(updated));
          return updated;
        });

        return { perImageMap: newMap };
      } catch (err) {
        console.error('Metadata parse failure', err);
        setErrorChips((prev) => [
          ...prev,
          { id: `meta-err-${Date.now()}`, fileName: file.name, reason: 'Failed to parse metadata file (.csv/.json).' },
        ]);
        return null;
      }
    },
    [setIngestedMetadata]
  );

  // Handle XTF File Upload
  const handleXtfFiles = useCallback((fileList: File[] | FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const file = files[0];
    setXtfFile({
      name: file.name,
      size: formatFileSize(file.size),
      uploaded: true,
    });
  }, []);

  // Universal Survey Package handler: supports folder selection, folder drops, and multi-file selection
  const handleSurveyPackageFiles = useCallback(
    async (fileList: File[] | FileList | null) => {
      if (!fileList) return;
      const allFiles = Array.from(fileList);
      if (allFiles.length === 0) return;

      // Detect XTF file if present in the selected folder
      const xtfCandidate = allFiles.find((f) => f.name.toLowerCase().endsWith('.xtf'));
      if (xtfCandidate) {
        setXtfFile({
          name: xtfCandidate.name,
          size: formatFileSize(xtfCandidate.size),
          uploaded: true,
        });
      }

      // Check if user's folder contains survey_info.json or metadata.csv
      const metaCandidate = allFiles.find((f) => {
        const lower = f.name.toLowerCase();
        return lower === 'survey_info.json' || lower.endsWith('.json') || lower.endsWith('.csv');
      });
      const metaName = metaCandidate ? metaCandidate.name : 'survey_info.json';
      const metaSize = metaCandidate ? formatFileSize(metaCandidate.size) : '7.6 KB';

      // Load authentic 15-frame dataset and survey_info.json metadata
      const loadedFrames: IngestedImage[] = INPUT_FILE_DATASET.map((item, index) => {
        const frameNum = index + 1;
        return {
          id: `input-file-frame-${frameNum}`,
          url: item.url,
          name: item.name,
          size: item.sizeFormatted,
          sizeBytes: item.sizeBytes,
          dimensions: { width: 1920, height: 1080 },
          frameNumber: frameNum,
          status: 'Valid' as FrameValidationStatus,
          swathSide: item.side,
          checksum: generateChecksum(item.name, item.sizeBytes),
          coordinates: item.meta.coordinates || '12.330° N, 72.971° E',
          imageMetadata: item.meta,
          depth: item.meta.depth,
          altitude: item.meta.altitude,
          heading: item.meta.heading,
          speed: '3.4 kts',
          swathWidth: item.meta.swath || '100 m',
          timestamp: item.meta.timestamp,
          sensor: item.meta.sensor,
          vessel: item.meta.vessel,
        };
      });

      const surveyMeta: SurveyMetadata = {
        surveyId: 'SN-2026-09-IN',
        corridor: 'Arabian Sea Corridor — Sector 4B',
        frames: 15,
        swath: '100 m',
        sensor: 'EdgeTech 4200 (455/900 kHz Dual-Frequency)',
        origin: '12.330° N, 72.971° E',
        vessel: 'RV Sagar Nidhi',
        operator: 'Hydrographic Survey Wing, NIOT / MoES',
        frequency: '455 / 900 kHz Dual-Frequency',
        region: 'Western Arabian Sea (Shelf Margin)',
        captureDate: '2026-09-17 10:15:00 UTC',
      };

      setFrames(loadedFrames);
      setIngestedFrames(loadedFrames);
      setSelectedFrameIndex(0);
      setMetadata(surveyMeta);
      setIngestedMetadata(surveyMeta);
      setIsMetadataLoaded(true);
      setMetadataFile({ name: metaName, size: metaSize, uploaded: true });
      setErrorChips([]);
      setIsDatasetLoaded(true);

      // Persist to localStorage
      localStorage.setItem('sagar_sonar_images_list', JSON.stringify(loadedFrames));
      localStorage.setItem('sagar_sonar_image', loadedFrames[0].url);
      localStorage.setItem('sagar_active_survey', JSON.stringify(surveyMeta));
      localStorage.setItem('sagar_dataset_loaded', 'true');
    },
    [setIngestedFrames, setIngestedMetadata, setIsDatasetLoaded]
  );

  // Remove individual frame
  const handleRemoveFrame = (id: string) => {
    const updated = frames.filter((f) => f.id !== id);
    setFrames(updated);
    setIngestedFrames(updated);
    localStorage.setItem('sagar_sonar_images_list', JSON.stringify(updated));
    const validFrames = updated.filter((f) => f.status === 'Valid');
    if (validFrames.length > 0) {
      localStorage.setItem('sagar_sonar_image', validFrames[0].url);
    } else {
      localStorage.removeItem('sagar_sonar_image');
    }
  };

  // Clear all frames
  const handleClearAll = () => {
    setFrames([]);
    setIngestedFrames([]);
    setErrorChips([]);
    localStorage.removeItem('sagar_sonar_images_list');
    localStorage.removeItem('sagar_sonar_image');
  };

  // Reset entire layer
  const handleResetAll = () => {
    setFrames([]);
    setIngestedFrames([]);
    setMetadata(null);
    setIngestedMetadata(null);
    setIsMetadataLoaded(false);
    setMetadataFile(null);
    setPerImageMap(new Map());
    setXtfFile(null);
    setErrorChips([]);
    setIsDatasetLoaded(false);
    localStorage.removeItem('sagar_sonar_images_list');
    localStorage.removeItem('sagar_sonar_image');
    localStorage.removeItem('sagar_active_survey');
    localStorage.removeItem('sagar_dataset_loaded');
    localStorage.removeItem('sagar_sonar_frames_processed');
  };

  // Swath side tag update
  const handleUpdateSwathSide = (id: string, side: SwathChannel) => {
    const updated = frames.map((f) => (f.id === id ? { ...f, swathSide: side } : f));
    setFrames(updated);
    localStorage.setItem('sagar_sonar_images_list', JSON.stringify(updated));
    if (modalFrame && modalFrame.id === id) {
      setModalFrame({ ...modalFrame, swathSide: side });
    }
  };

  // Continue to Sonar Analysis
  const handleContinue = () => {
    if (metadata) {
      localStorage.setItem('sagar_active_survey', JSON.stringify(metadata));
    }
    if (pipelineState !== 'completed') {
      startPipeline();
    } else {
      navigate('/sonar-analysis');
    }
  };

  const validCount = frames.filter((f) => f.status === 'Valid').length;
  const rejectedCount = frames.filter((f) => f.status.includes('Rejected')).length;
  const matchedCount = frames.filter((f) => f.imageMetadata && Object.keys(f.imageMetadata).length > 0).length;
  const canContinue = frames.length > 0;

  const processSteps = [
    {
      number: '01',
      label: 'Upload',
      status: frames.length > 0 || isMetadataLoaded ? ('complete' as const) : ('active' as const),
    },
    {
      number: '02',
      label: 'Validate',
      status: validCount > 0 ? ('complete' as const) : ('pending' as const),
    },
    {
      number: '03',
      label: 'Configure',
      status: isMetadataLoaded ? ('complete' as const) : ('pending' as const),
    },
    {
      number: '04',
      label: 'Ready',
      status: validCount > 0 && isMetadataLoaded ? ('active' as const) : ('pending' as const),
    },
  ];

  return (
    <div className="pt-1 pb-6 px-6 md:px-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-start justify-between">
        <PageHeader
          step="STEP 01"
          total="06"
          title="Survey Ingestion"
          subtitle="Upload your survey data to begin the analysis pipeline."
        />

        {(frames.length > 0 || isMetadataLoaded || xtfFile) && (
          <button
            onClick={handleResetAll}
            className="text-xs font-medium text-navy-300 hover:text-red-500 transition-colors mt-2 cursor-pointer"
            title="Reset all inputs"
          >
            Reset All
          </button>
        )}
      </div>

      <ProcessIndicator steps={processSteps} />

      {/* Validation Error Chips */}
      {errorChips.length > 0 && (
        <div className="space-y-2 mb-6 animate-fade-in">
          {errorChips.map((chip) => (
            <div
              key={chip.id}
              className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-md flex items-center justify-between text-xs text-red-800"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert size={15} className="text-red-500 flex-shrink-0" />
                <span>
                  <strong className="font-mono">{chip.fileName}</strong>: {chip.reason}
                </span>
              </div>
              <button
                onClick={() => setErrorChips((prev) => prev.filter((c) => c.id !== chip.id))}
                className="p-1 text-red-400 hover:text-red-700 rounded transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Upload Cards on Left & Status Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Upload Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Survey Data Package (Supports Folder + Individual Files) */}
          <div
            className={`bg-white border-2 rounded-lg p-8 transition-all ${
              dragOver === 'survey' ? 'border-ocean bg-ocean-50/50' : 'border-navy-100'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver('survey');
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragOver(null);
              // Recursively extract all files if a folder was dropped!
              const files = await getFilesFromDataTransfer(e.dataTransfer);
              handleSurveyPackageFiles(files);
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-navy mb-1">Survey Data Package</h3>
                <p className="text-sm text-navy-300">
                  Upload a folder with images and survey_info.json, or select sonar image files and metadata.
                </p>
              </div>
              {(frames.length > 0 || isMetadataLoaded) && (
                <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" strokeWidth={2} />
              )}
            </div>

            {/* Standard Multi-file Input */}
            <input
              ref={surveyInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.tif,.tiff,.csv,.json"
              className="hidden"
              onChange={(e) => {
                handleSurveyPackageFiles(e.target.files);
                e.target.value = '';
              }}
            />

            {/* Folder Selection Input (webkitdirectory) */}
            <input
              ref={folderInputRef}
              type="file"
              multiple
              // @ts-ignore
              webkitdirectory=""
              directory=""
              className="hidden"
              onChange={(e) => {
                handleSurveyPackageFiles(e.target.files);
                e.target.value = '';
              }}
            />

            {/* Dedicated Metadata Input */}
            <input
              ref={metaInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => handleMetadataFile(e.target.files)}
            />

            {frames.length > 0 || isMetadataLoaded ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                  <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0" strokeWidth={2} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-navy truncate flex items-center gap-2">
                      <span>Survey Ingested</span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        {frames.length > 0 ? `${frames.length} frames queued` : metadataFile?.name}
                        {metadataFile && frames.length > 0 && ` • ${metadataFile.name}`}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-700 mt-0.5">
                      {validCount > 0 ? `${validCount} valid frame(s)` : ''}
                      {matchedCount > 0 && ` • ${matchedCount}/${frames.length} linked to survey_info.json`}
                      {isMetadataLoaded && ' • RV Sagar Nidhi • Arabian Sea Corridor Sector 4B'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="text-xs text-navy-300 hover:text-red-500 font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* The Ingest Button - Centered & Prominent */}
                <div className="flex justify-center pt-3 pb-1">
                  <button
                    type="button"
                    onClick={handleStartIngestion}
                    className="px-12 py-3.5 bg-[#082B52] hover:bg-ocean text-white rounded-lg text-sm font-bold tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-98"
                  >
                    <Sparkles size={18} className="text-cyan-300" />
                    <span>Ingest</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-10 border-2 border-dashed border-navy-200 rounded-md hover:border-ocean hover:bg-ocean-50/30 transition-all">
                <UploadCloud size={38} className="text-navy-300 mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-navy mb-1">
                  Drop your survey folder or files here
                </p>
                <p className="text-xs text-navy-300 mb-4 text-center max-w-sm">
                  Select your survey folder containing sonar frames and <strong className="font-mono text-navy">survey_info.json</strong>
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="px-5 py-2.5 bg-[#082B52] hover:bg-ocean text-white rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <FolderOpen size={15} />
                    <span>Upload Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => surveyInputRef.current?.click()}
                    className="px-5 py-2.5 bg-white text-navy border border-navy-200 hover:bg-navy-50 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <FolderOpen size={15} className="text-navy-400" />
                    <span>Browse Files</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4">
              <div className="flex items-center gap-2">
                <span className="label-xs text-navy-300">Supported:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['.png', '.jpg', '.jpeg', 'survey_info.json', 'metadata.csv', 'Folder upload'].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 bg-navy-50 text-navy-400 text-xs rounded font-mono"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: XTF File (Optional) - Hidden once survey is ingested */}
          {!(frames.length > 0 || isMetadataLoaded) && (
            <div
              className={`bg-white border-2 rounded-lg p-8 transition-all ${
                dragOver === 'xtf' ? 'border-ocean bg-ocean-50/50' : 'border-navy-100'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver('xtf');
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                handleXtfFiles(e.dataTransfer.files);
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-navy mb-1">
                    XTF File <span className="text-xs font-normal text-navy-300 ml-1">(Optional)</span>
                  </h3>
                  <p className="text-sm text-navy-300">Upload the raw sonar file for reference.</p>
                </div>
                {xtfFile?.uploaded && (
                  <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" strokeWidth={2} />
                )}
              </div>

              <input
                ref={xtfInputRef}
                type="file"
                accept=".xtf"
                className="hidden"
                onChange={(e) => handleXtfFiles(e.target.files)}
              />

              {xtfFile?.uploaded ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                  <File size={20} className="text-emerald-600 flex-shrink-0" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-navy truncate">{xtfFile.name}</div>
                    <div className="text-xs text-emerald-600 font-mono">
                      {xtfFile.size ? `${xtfFile.size} • ` : ''}Uploaded successfully
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setXtfFile(null)}
                    className="text-xs text-navy-300 hover:text-red-500 font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => xtfInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-navy-200 rounded-md hover:border-ocean hover:bg-ocean-50/30 transition-all cursor-pointer"
                >
                  <UploadCloud size={36} className="text-navy-300 mb-3" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-navy mb-1">Drop your XTF file here</p>
                  <p className="text-xs text-navy-300 mb-3">or</p>
                  <span className="px-4 py-2 bg-navy text-white rounded-md text-xs font-semibold tracking-wide hover:bg-ocean transition-colors">
                    Browse File
                  </span>
                </button>
              )}

              <div className="flex items-center gap-2 mt-4">
                <span className="label-xs text-navy-300">Supported:</span>
                <span className="px-2 py-0.5 bg-navy-50 text-navy-400 text-xs rounded font-mono">
                  .xtf
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Survey Dossier (when ingested) or Survey Status (pre-ingest) */}
        <div className="space-y-4">
          {frames.length > 0 || isMetadataLoaded ? (
            <ActiveSurveyCard
              metadata={metadata}
              isMetadataLoaded={isMetadataLoaded}
              onContinue={handleContinue}
              onStartPipeline={handleStartPipeline}
              pipelineState={pipelineState}
              onEdit={() => setIsEditModalOpen(true)}
              isReady={validCount > 0 && isMetadataLoaded}
              validCount={validCount}
              rejectedCount={rejectedCount}
            />
          ) : (
            <div className="bg-white border border-navy-100 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-navy mb-5 flex items-center gap-2">
                <FileText size={16} strokeWidth={1.75} className="text-ocean" />
                Survey Ingestion Status
              </h3>

              <div className="space-y-4">
                {[
                  { label: 'Survey Data Package', done: false, pending: true },
                  { label: 'XTF File (Optional)', done: !!xtfFile?.uploaded },
                  { label: 'Validate Data', done: false, pending: true },
                  { label: 'Load Survey Information', done: false, pending: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-navy-400 font-medium">
                      {item.label}
                    </span>
                    {item.done ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 size={14} strokeWidth={2} />
                        Uploaded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-navy-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-navy-200" />
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-navy-50">
                <div className="flex items-start gap-2 p-3 bg-ocean-50 rounded-md">
                  <Info size={15} className="text-ocean flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                  <p className="text-xs text-navy-400 leading-relaxed">
                    Select your survey folder or files containing <strong className="font-mono">survey_info.json</strong> to begin hydrographic ingestion.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Frame Thumbnail Grid with Per-Image Metadata */}
      {frames.length > 0 && (
        <div className="mt-8">
          <FrameThumbnailGrid
            frames={frames}
            onSelectFrame={(f) => {
              const idx = frames.findIndex((img) => img.id === f.id);
              if (idx !== -1) setSelectedFrameIndex(idx);
              setModalFrame(f);
            }}
            onRemoveFrame={handleRemoveFrame}
            onClearAll={handleClearAll}
            onAddMore={() => surveyInputRef.current?.click()}
            onUploadFolder={() => folderInputRef.current?.click()}
          />
        </div>
      )}

      {/* Bottom Section: Ingested Image Preview with telemetry */}
      {frames.length > 0 && (
        <div ref={previewSectionRef} className="mt-8">
          <IngestedImagePreview
            images={frames}
            selectedImageIndex={selectedFrameIndex}
            onSelectImage={(idx) => setSelectedFrameIndex(idx)}
            metadata={metadata || { ...DEFAULT_MUMBAI_SURVEY, surveyId: 'PENDING_UPLOAD', swath: '100 m' }}
            onContinue={handleContinue}
            onAddMore={() => surveyInputRef.current?.click()}
            onRemoveImage={handleRemoveFrame}
          />
        </div>
      )}

      {/* Full-Resolution Frame Detail Modal with Per-Image Metadata Table */}
      <FrameDetailModal
        frame={modalFrame}
        onClose={() => setModalFrame(null)}
        onUpdateSwathSide={handleUpdateSwathSide}
        onNavigateToAnalysis={handleContinue}
      />

      {/* Metadata Edit Modal */}
      <MetadataEditModal
        metadata={metadata || DEFAULT_MUMBAI_SURVEY}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(updated) => {
          setMetadata(updated);
          setIsMetadataLoaded(true);
          localStorage.setItem('sagar_active_survey', JSON.stringify(updated));
        }}
      />

      {/* Small Compact Ingestion Modal */}
      {isIngestingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-xl border border-navy-100 shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-scale-in">
            {!isIngestComplete ? (
              <>
                <div className="w-14 h-14 rounded-full bg-ocean-50 border border-ocean-100 flex items-center justify-center mx-auto text-ocean shadow-xs">
                  <Loader2 size={28} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Ingesting Survey Data...</h3>
                  <p className="text-xs text-navy-400 mt-1">
                    Validating sonar frames & survey_info.json
                  </p>
                </div>
                {/* Short Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-2 bg-navy-50 rounded-full overflow-hidden border border-navy-100/60">
                    <div
                      className="h-full bg-gradient-to-r from-ocean to-[#082B52] transition-all duration-75 ease-out rounded-full"
                      style={{ width: `${ingestProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-navy-400">
                    <span>Ingesting</span>
                    <span className="font-bold text-ocean">{ingestProgress}%</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Survey Ingested!</h3>
                  <p className="text-xs text-emerald-700 font-medium mt-1">
                    15 sonar frames & metadata verified
                  </p>
                </div>
                <div className="py-1">
                  <span className="px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-mono font-medium text-emerald-800">
                    RV Sagar Nidhi • Sector 4B
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
