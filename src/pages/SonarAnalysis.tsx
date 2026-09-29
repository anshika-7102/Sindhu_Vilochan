import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Crosshair,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  Layers,
  Activity,
  X,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Cpu,
  Sparkles,
  Terminal,
  Loader2,
  Lock,
  Anchor,
  Compass,
  FileSpreadsheet,
  Copy,
  Check,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import {
  SonarAnalysisAsset,
  DEFAULT_SONAR_ANALYSIS_ASSETS,
  resolveSonarAsset,
  getAssetStem,
} from '@/data/sonarAnalysisData';
import { IngestedImage } from '@/types';
import { usePipeline } from '@/context/PipelineContext';
import LayerEmptyState from '@/components/LayerEmptyState';

// 6 Structured Stages for Autonomous Sonar Processing Pipeline
export interface SonarPipelineStage {
  id: number;
  shortCode: string;
  name: string;
  module: string;
}

export const SONAR_PIPELINE_STAGES: SonarPipelineStage[] = [
  {
    id: 1,
    shortCode: 'Ingestion',
    name: 'Survey Ingestion & Georeferencing',
    module: 'Acoustic Swath Normalization & Telemetry Parser',
  },
  {
    id: 2,
    shortCode: 'Sonar AI',
    name: 'YOLO26s-seg Contact Detection',
    module: 'Marine Debris Localization & SAM Segmentation',
  },
  {
    id: 3,
    shortCode: 'Anomaly',
    name: 'PatchCore Anomaly Screening',
    module: 'Memory Bank Spatial Embedding & Thermal Scoring',
  },
  {
    id: 4,
    shortCode: 'Evidence Fusion',
    name: 'Multi-Modal Physics Synthesizer',
    module: 'Acoustic Highlight & Shadow Geometry Fusion',
  },
  {
    id: 5,
    shortCode: 'Spatial Clusters',
    name: 'Hotspot Clustering & Density',
    module: 'Spatial KD-Tree Debris Cluster Aggregation',
  },
  {
    id: 6,
    shortCode: 'Reports & Export',
    name: 'Hydrographic Dossier Export',
    module: 'Downstream Layers Activation & GIS Synchronization',
  },
];

export interface PipelineLogItem {
  id: string;
  timestamp: string;
  stage: string;
  text: string;
  type: 'info' | 'process' | 'success' | 'warn';
}

// 4 explicit filter options available above the sonar image viewer
export type FilterOption = 'bbox_mask' | 'original' | 'enhanced' | 'heatmap';

const FILTER_OPTIONS: { id: FilterOption; label: string }[] = [
  { id: 'bbox_mask', label: 'Bounding Box + Mask' },
  { id: 'original', label: 'Original' },
  { id: 'enhanced', label: 'Enhanced' },
  { id: 'heatmap', label: 'Anomaly Heatmap' },
];

// Cycle modes for keyboard ArrowLeft / ArrowRight & on-screen navigation
const VIEW_CYCLE_MODES: FilterOption[] = ['bbox_mask', 'original', 'enhanced', 'heatmap'];

/**
 * Ensures sonar images follow the required priority sequence:
 * 1. Shipwreck
 * 2. Ghost Net
 * 3. Human (Novel Anomaly)
 * 4. Natural Reef
 * 5. Remaining survey images
 */
function prioritizeSonarFrames(rawFrames: SonarAnalysisAsset[]): SonarAnalysisAsset[] {
  const result: SonarAnalysisAsset[] = [];
  const remaining = [...rawFrames];

  // 1. Shipwreck: prioritize canonical 'shipwreck.png', otherwise any item containing 'shipwreck'
  let shipwreckIdx = remaining.findIndex((f) => getAssetStem(f.name) === 'shipwreck');
  if (shipwreckIdx === -1) {
    shipwreckIdx = remaining.findIndex((f) => getAssetStem(f.name).includes('shipwreck'));
  }
  if (shipwreckIdx !== -1) {
    result.push(remaining.splice(shipwreckIdx, 1)[0]);
  }

  // 2. Ghost Net: item matching 'ghostnet'
  const ghostnetIdx = remaining.findIndex((f) => getAssetStem(f.name).includes('ghost'));
  if (ghostnetIdx !== -1) {
    result.push(remaining.splice(ghostnetIdx, 1)[0]);
  }

  // 3. Human: item matching 'human'
  const humanIdx = remaining.findIndex((f) => getAssetStem(f.name).includes('human'));
  if (humanIdx !== -1) {
    result.push(remaining.splice(humanIdx, 1)[0]);
  }

  // 4. Natural Reef: item matching 'artificial_reef' or 'reef'
  const reefIdx = remaining.findIndex((f) => getAssetStem(f.name).includes('reef'));
  if (reefIdx !== -1) {
    result.push(remaining.splice(reefIdx, 1)[0]);
  }

  // 5. All remaining available images
  result.push(...remaining);

  // Strictly assign 1-based sequential display names: Image 1, Image 2, Image 3...
  return result.map((frame, index) => ({
    ...frame,
    displayName: `Image ${index + 1}`,
  }));
}

/**
 * Returns human-readable target labels, badge styling, anomaly indicators,
 * and classification descriptions for a given sonar asset.
 */
function getImageTypeInfo(frame: SonarAnalysisAsset): {
  typeLabel: string;
  badgeColor: string;
  isAnomaly: boolean;
  classification: string;
} {
  const stem = getAssetStem(frame.name);

  if (stem === 'shipwreck' || stem.startsWith('shipwreck')) {
    return {
      typeLabel: 'Shipwreck',
      badgeColor: 'text-ocean bg-ocean-50 border-ocean-100',
      isAnomaly: false,
      classification: 'Shipwreck',
    };
  }
  if (stem.includes('ghost')) {
    return {
      typeLabel: 'Ghost Net',
      badgeColor: 'text-amber-800 bg-amber-50 border-amber-100',
      isAnomaly: false,
      classification: 'Ghost Net',
    };
  }
  if (stem.includes('human')) {
    return {
      typeLabel: 'Human Anomaly',
      badgeColor: 'text-rose-800 bg-rose-50 border-rose-100',
      isAnomaly: true,
      classification: 'Anthropogenic Anomaly (Novel)',
    };
  }
  if (stem.includes('reef')) {
    return {
      typeLabel: 'Natural Reef',
      badgeColor: 'text-emerald-800 bg-emerald-50 border-emerald-100',
      isAnomaly: false,
      classification: 'Seafloor Natural Reef',
    };
  }
  if (stem.includes('pipe')) {
    return {
      typeLabel: 'Pipe',
      badgeColor: 'text-sky-800 bg-sky-50 border-sky-100',
      isAnomaly: false,
      classification: 'Pipe',
    };
  }
  if (stem.includes('plane')) {
    return {
      typeLabel: 'Plane',
      badgeColor: 'text-indigo-800 bg-indigo-50 border-indigo-100',
      isAnomaly: false,
      classification: 'Plane',
    };
  }
  if (stem.includes('crabpot')) {
    return {
      typeLabel: 'Crab Pot',
      badgeColor: 'text-teal-800 bg-teal-50 border-teal-100',
      isAnomaly: false,
      classification: 'Crab Pot',
    };
  }
  if (stem.includes('seabed')) {
    return {
      typeLabel: 'Seabed Baseline',
      badgeColor: 'text-navy-600 bg-slate-50 border-navy-100',
      isAnomaly: false,
      classification: 'Normal Seabed Profile',
    };
  }

  // Fallback to detection if available
  if (frame.detections && frame.detections.length > 0) {
    const d = frame.detections[0];
    return {
      typeLabel: d.className,
      badgeColor: d.isNovel
        ? 'text-rose-800 bg-rose-50 border-rose-100'
        : 'text-ocean bg-ocean-50 border-ocean-100',
      isAnomaly: !!d.isNovel,
      classification: d.className,
    };
  }

  return {
    typeLabel: 'Sonar Scan',
    badgeColor: 'text-navy-400 bg-slate-50 border-navy-100',
    isAnomaly: false,
    classification: 'Acoustic Waterfall Scan',
  };
}

/**
 * Conceptually and deterministically resolves the authentic image URL for the requested layer:
 * - 'bbox_mask': BBox + Mask if annotated, otherwise direct authentic Original for normal seabed/reef
 * - 'original': Authentic raw scan from /raw/
 * - 'enhanced': Contrast & bilateral enhanced scan from /pre-processed/
 * - 'heatmap': PatchCore anomaly thermal heatmap from /PatchCore/
 */
function resolveActiveView(frame: SonarAnalysisAsset, mode: FilterOption): {
  url: string;
  watermark: string;
} {
  const stem = getAssetStem(frame.name);

  if (mode === 'original') {
    return {
      url: frame.rawUrl,
      watermark: 'Original Sonar Swath (Raw)',
    };
  }

  if (mode === 'enhanced') {
    return {
      url: frame.preprocessedUrl || frame.enhancedUrl || `/pre-processed/${stem}.png`,
      watermark: 'Pre-Processed • Contrast Enhanced',
    };
  }

  if (mode === 'heatmap') {
    if (frame.heatmapUrl || frame.patchcoreUrl) {
      return {
        url: (frame.heatmapUrl || frame.patchcoreUrl)!,
        watermark: 'PatchCore Anomaly Heatmap',
      };
    }
    // Baseline scans without anomaly activations fall back to enhanced
    return {
      url: frame.preprocessedUrl || frame.enhancedUrl || frame.rawUrl,
      watermark: 'Baseline Seafloor • Normal Profile',
    };
  }

  // mode === 'bbox_mask' (Default layer)
  if (frame.segmentationUrl) {
    return {
      url: frame.segmentationUrl,
      watermark: 'YOLO26s-seg BBox + Mask Detection',
    };
  }
  if (frame.bboxUrl && (stem === 'human' || frame.bboxUrl.includes('unknown'))) {
    return {
      url: frame.bboxUrl,
      watermark: 'PatchCore Anomaly ROI • Novel Candidate',
    };
  }
  if (frame.bboxUrl) {
    return {
      url: frame.bboxUrl,
      watermark: 'YOLO Detection Bounding Box',
    };
  }

  // Normal seabed or artificial reef images where no object was detected
  return {
    url: frame.rawUrl,
    watermark: 'Original Scan • Baseline (No Target Detected)',
  };
}

export default function SonarAnalysis() {
  const navigate = useNavigate();
  const { pipelineState, completePipeline } = usePipeline();

  // Track if AI model execution has run across all frames
  const [isFramesProcessed, setIsFramesProcessed] = useState<boolean>(() => {
    return localStorage.getItem('sagar_sonar_frames_processed') === 'true';
  });

  // Active layer mode: starts at 'original' until "Run All Frames" is executed
  const [activeLayer, setActiveLayer] = useState<FilterOption>(() => {
    const processed = localStorage.getItem('sagar_sonar_frames_processed') === 'true';
    return processed ? 'bbox_mask' : 'original';
  });

  // Batch inference progress modal state
  const [isRunningInference, setIsRunningInference] = useState<boolean>(false);
  const [inferenceProgress, setInferenceProgress] = useState<number>(0);
  const [currentInferringIndex, setCurrentInferringIndex] = useState<number>(0);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isSimulationComplete, setIsSimulationComplete] = useState<boolean>(false);
  const [pipelineLogs, setPipelineLogs] = useState<PipelineLogItem[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'process' | 'success' | 'warn'>('all');
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Active survey data from survey_info.json / localStorage
  const [activeSurvey] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('sagar_active_survey');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      surveyId: 'SN-2026-09-IN',
      name: 'Arabian Sea Continental Margin - Sector 4B',
      corridor: 'Arabian Sea Corridor — Sector 4B',
      vessel: 'RV Sagar Nidhi',
      sensor: 'EdgeTech 4200 (455/900 kHz Dual-Frequency)',
      swath: '100 m Dual-Ch',
      swathWidth: '100 m Dual-Ch',
      origin: '12.3300° N, 72.9710° E',
      frequency: '455 / 900 kHz Dual-Frequency',
      operator: 'National Institute of Ocean Technology (NIOT)',
    };
  });

  // Frames state initialized with priority sequence
  const [frames, setFrames] = useState<SonarAnalysisAsset[]>(() =>
    prioritizeSonarFrames(DEFAULT_SONAR_ANALYSIS_ASSETS)
  );
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Lightbox modal for high-resolution inspection
  const [expandedLayer, setExpandedLayer] = useState<FilterOption>('bbox_mask');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalZoomLevel, setModalZoomLevel] = useState<number>(1);

  // Modal ref for auto-scrolling log table
  const logBoxRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log console to bottom when new log lines arrive
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [pipelineLogs, logFilter]);

  const handleCopyLogs = () => {
    const formattedLogs = pipelineLogs
      .map((l) => `[${l.timestamp}] [${l.stage}] [${l.type.toUpperCase()}] ${l.text}`)
      .join('\n');
    navigator.clipboard.writeText(formattedLogs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleProceedToWorkspace = () => {
    setIsRunningInference(false);
    setIsFramesProcessed(true);
    localStorage.setItem('sagar_sonar_frames_processed', 'true');
    setActiveLayer('bbox_mask');
    completePipeline();
  };

  const handleResetToPreRun = () => {
    setIsFramesProcessed(false);
    localStorage.removeItem('sagar_sonar_frames_processed');
    setActiveLayer('original');
  };

  // Autonomous Multi-Stage Pipeline Simulation across all frames (~7.0s realistic duration)
  const handleRunAllFrames = () => {
    setIsRunningInference(true);
    setInferenceProgress(0);
    setCurrentInferringIndex(0);
    setCurrentStageIndex(0);
    setIsSimulationComplete(false);
    setLogFilter('all');

    const now = () => {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(Math.floor(d.getMilliseconds() / 10)).padStart(2, '0')}`;
    };

    const initialLogs: PipelineLogItem[] = [
      {
        id: 'log-0',
        timestamp: now(),
        stage: 'SYSTEM',
        text: 'Autonomous Sonar Deep Learning Pipeline initialized for Sector 4B.',
        type: 'info',
      },
      {
        id: 'log-1',
        timestamp: now(),
        stage: 'INGESTION',
        text: `Reading acoustic waterfall telemetry from Sector 4B (${frames.length} swath frames)...`,
        type: 'process',
      },
      {
        id: 'log-2',
        timestamp: now(),
        stage: 'CALIBRATION',
        text: 'Sound velocity profile confirmed: 1532 m/s. Ping rate: 15 pings/sec. Datum: WGS 84 / UTM 43N.',
        type: 'info',
      },
    ];
    setPipelineLogs(initialLogs);

    const totalFrames = frames.length;
    let frameIdx = 0;
    const totalDuration = 7000;
    const intervalMs = 100;
    const totalTicks = totalDuration / intervalMs;
    let ticks = 0;
    const frameStepTicks = Math.max(1, Math.floor(totalTicks / totalFrames));

    const interval = setInterval(() => {
      ticks += 1;
      const progress = Math.min(99, Math.round((ticks / totalTicks) * 100));
      setInferenceProgress(progress);

      const stageIdx = Math.min(5, Math.floor((progress / 100) * 6));
      setCurrentStageIndex(stageIdx);

      if (ticks % frameStepTicks === 0 && frameIdx < totalFrames) {
        const currentFrame = frames[frameIdx];
        setCurrentInferringIndex(frameIdx);
        const stem = getAssetStem(currentFrame.name);

        let desc = '';
        let stageName = 'SONAR AI';
        let logType: 'info' | 'process' | 'success' | 'warn' = 'process';

        const frameLabel = currentFrame.displayName || `Image ${frameIdx + 1}`;
        if (stem.includes('shipwreck')) {
          desc = `Frame ${String(frameIdx + 1).padStart(2, '0')}/${totalFrames} (${frameLabel}): YOLO26s-seg localized 'Shipwreck' (confidence: 0.97, acoustic shadow: 14.2m)`;
          logType = 'success';
        } else if (stem.includes('ghost')) {
          desc = `Frame ${String(frameIdx + 1).padStart(2, '0')}/${totalFrames} (${frameLabel}): YOLO26s-seg localized 'Ghost Net' (confidence: 0.96, porous entanglement)`;
          logType = 'success';
        } else if (stem.includes('human')) {
          stageName = 'ANOMALY';
          desc = `Frame ${String(frameIdx + 1).padStart(2, '0')}/${totalFrames} (${frameLabel}): PatchCore anomaly score 0.88 > threshold (0.65) -> Anthropogenic Novel Target`;
          logType = 'warn';
        } else if (stem.includes('reef')) {
          desc = `Frame ${String(frameIdx + 1).padStart(2, '0')}/${totalFrames} (${frameLabel}): Seafloor natural bathymetry classified as Natural Reef (confidence: 0.94)`;
          logType = 'info';
        } else if (stem.includes('pipe')) {
          desc = `Frame ${String(frameIdx + 1).padStart(2, '0')}/${totalFrames} (${frameLabel}): Subsea pipeline tracked continuously (confidence: 0.97, linear echo)`;
          logType = 'success';
        } else if (stem.includes('plane')) {
          desc = `Frame ${String(frameIdx + 1).padStart(2, '0')}/${totalFrames} (${frameLabel}): Submerged aircraft wreckage fuselage segmented (confidence: 0.98)`;
          logType = 'success';
        } else if (stem.includes('crabpot')) {
          desc = `Frame ${String(frameIdx + 1).padStart(2, '0')}/${totalFrames} (${frameLabel}): Commercial Crab-Pot Trap localized on seabed (confidence: 0.96)`;
          logType = 'success';
        } else {
          desc = `Frame ${String(frameIdx + 1).padStart(2, '0')}/${totalFrames} (${frameLabel}): Baseline acoustic seafloor verified (Reliability: 94%)`;
          logType = 'info';
        }

        setPipelineLogs((prev) => [
          ...prev,
          {
            id: `log-${Date.now()}-${frameIdx}`,
            timestamp: now(),
            stage: stageName,
            text: desc,
            type: logType,
          },
        ]);

        frameIdx += 1;
      }

      if (ticks >= totalTicks) {
        clearInterval(interval);
        setInferenceProgress(100);
        setCurrentStageIndex(5);
        setCurrentInferringIndex(totalFrames - 1);
        setIsSimulationComplete(true);

        setPipelineLogs((prev) => [
          ...prev,
          {
            id: `log-complete-1`,
            timestamp: now(),
            stage: 'EVIDENCE',
            text: 'Multi-modal feature tensor fused. 12 candidate targets confirmed across 15 frames.',
            type: 'success',
          },
          {
            id: `log-complete-2`,
            timestamp: now(),
            stage: 'DOSSIER',
            text: 'System Verified • Survey Reliability Index: 89/100. Downstream analysis layers unlocked.',
            type: 'success',
          },
        ]);
      }
    }, intervalMs);
  };

  // Thumbnail container ref for smooth auto-scroll on navigation
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load uploaded frames from Step 1 (Survey Ingestion) if available
  useEffect(() => {
    const savedList = localStorage.getItem('sagar_sonar_images_list');
    if (savedList) {
      try {
        const parsed: IngestedImage[] = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out obsolete legacy entries
          const validFrames = parsed.filter(
            (item) =>
              item.name.toLowerCase() !== 'img_001.png' &&
              item.name.toLowerCase() !== 'img.001.png' &&
              !item.name.toLowerCase().includes('img_001') &&
              !item.name.toLowerCase().includes('img.001')
          );
          if (validFrames.length > 0) {
            const mappedAssets: SonarAnalysisAsset[] = validFrames.map((item, index) =>
              resolveSonarAsset(item.name, index, item.url)
            );
            setFrames(prioritizeSonarFrames(mappedAssets));
            return;
          }
        }
      } catch (err) {
        console.error('Failed to parse saved sonar images for SonarAnalysis:', err);
      }
    }
    setFrames(prioritizeSonarFrames(DEFAULT_SONAR_ANALYSIS_ASSETS));
  }, []);

  const activeFrame = frames[selectedFrameIndex] || frames[0] || DEFAULT_SONAR_ANALYSIS_ASSETS[0];
  const typeInfo = getImageTypeInfo(activeFrame);

  // Auto-scroll selected thumbnail into view
  useEffect(() => {
    const el = thumbnailRefs.current[selectedFrameIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedFrameIndex]);

  // Image Navigation Handlers (UP / DOWN)
  const handlePrevImage = () => {
    setSelectedFrameIndex((curr) => (curr > 0 ? curr - 1 : frames.length - 1));
  };

  const handleNextImage = () => {
    setSelectedFrameIndex((curr) => (curr < frames.length - 1 ? curr + 1 : 0));
  };

  // Processed View Navigation Handlers (LEFT / RIGHT)
  // Cycle: Bounding Box + Mask ↔ Original ↔ Enhanced ↔ Anomaly Heatmap
  const handlePrevMode = () => {
    setActiveLayer((curr) => {
      const idx = VIEW_CYCLE_MODES.indexOf(curr);
      return VIEW_CYCLE_MODES[(idx - 1 + VIEW_CYCLE_MODES.length) % VIEW_CYCLE_MODES.length];
    });
  };

  const handleNextMode = () => {
    setActiveLayer((curr) => {
      const idx = VIEW_CYCLE_MODES.indexOf(curr);
      return VIEW_CYCLE_MODES[(idx + 1) % VIEW_CYCLE_MODES.length];
    });
  };

  // Keyboard navigation listener:
  // LEFT / RIGHT: change ONLY the processed-view mode
  // UP / DOWN: change ONLY the selected sonar image
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInput) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMode();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMode();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevImage();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames.length]);

  // Zoom handlers for main viewport
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Modal zoom handlers
  const handleModalZoomIn = () => setModalZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleModalZoomOut = () => setModalZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleModalResetZoom = () => setModalZoomLevel(1);

  // Resolve current active view image and watermark
  const currentView = resolveActiveView(activeFrame, activeLayer);
  const modalView = isModalOpen ? resolveActiveView(activeFrame, expandedLayer) : null;

  // Check if survey dataset was ingested
  const hasIngestedData =
    frames.length > 0 &&
    (localStorage.getItem('sagar_sonar_images_list') !== null ||
      localStorage.getItem('sagar_dataset_loaded') === 'true' ||
      localStorage.getItem('sagar_active_survey') !== null ||
      pipelineState !== 'idle');

  if (!hasIngestedData && frames.length === 0) {
    return (
      <div className="pt-1 pb-6 px-6 md:px-8 max-w-7xl mx-auto">
        <PageHeader
          step="STEP 02"
          total="06"
          title="Sonar Analysis"
          subtitle="Preprocess the sonar images and detect known objects and novel anomalies using AI."
        />

        <LayerEmptyState
          layerNumber="02"
          layerName="Sonar Analysis"
          title="No Sonar Analysis Data Ingested"
          description="Acoustic waterfall contrast enhancement and PatchCore candidate segmentation require survey ingestion. Please upload your survey dataset in Layer 01 to begin analysis."
          Icon={Layers}
          hint="Dual-waterfall contrast, PatchCore anomaly activations, and bounded targets will be rendered here once ingested."
        />
      </div>
    );
  }

  // Render Big Institutional Pipeline Execution Modal
  const renderBigPipelineModal = () => {
    const filteredLogs = pipelineLogs.filter((log) => {
      if (logFilter === 'all') return true;
      return log.type === logFilter;
    });

    return (
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget && isSimulationComplete) {
            handleProceedToWorkspace();
          }
        }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in select-none font-sans"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-6xl bg-white border border-slate-300 rounded-sm shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Institutional Government / Scientific Portal Header */}
          <div className="relative px-6 py-3.5 bg-[#082B52] text-white border-b border-[#051c37] flex items-center justify-between z-10">
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xs bg-white/10 text-white border border-white/20">
                <Anchor size={18} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold tracking-tight text-white uppercase font-sans">
                    Sonar Processing Pipeline
                  </h3>
                  <span className="text-[11px] text-slate-300 font-medium border-l border-slate-600 pl-3">
                    SINDHU VILOCHAN • Indian Ocean Survey Program
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wider uppercase border ${
                      isSimulationComplete
                        ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700'
                        : 'bg-amber-900/80 text-amber-200 border-amber-700 animate-pulse'
                    }`}
                  >
                    {isSimulationComplete ? 'SYSTEM STATUS: OPERATIONAL' : 'SYSTEM STATUS: PROCESSING'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                  Marine Debris Intelligence • Sector 4B Survey Dataset ({frames.length} Sonar Frames)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isSimulationComplete) {
                    handleProceedToWorkspace();
                  } else {
                    setIsRunningInference(false);
                  }
                }}
                className="p-1.5 rounded-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div ref={modalBodyRef} className="relative flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-5 z-10 scrollbar-thin">
            {/* Section 1: Survey Processing Status (Full Width) */}
            <div className="p-4 bg-white border border-slate-300 rounded-sm shadow-xs space-y-4">
              <div>
                <div className="text-sm font-semibold text-[#082B52] uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
                  Survey Processing Status
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-[#EBF3FA] border border-[#B4CCE4] rounded-xs">
                    <div className="text-[10px] font-semibold text-[#64748B] uppercase">Current Status</div>
                    <div className="mt-1 flex items-center gap-1.5 font-bold text-[#082B52]">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isSimulationComplete ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                      <span>{isSimulationComplete ? 'COMPLETED' : 'PROCESSING'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                    <div className="text-[10px] font-semibold text-[#64748B] uppercase">Processing Stages</div>
                    <div className="mt-1 font-bold text-[#082B52]">
                      {isSimulationComplete ? '6 / 6 Complete' : `${currentStageIndex + 1} / 6 Active`}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                    <div className="text-[10px] font-semibold text-[#64748B] uppercase">Frames Processed</div>
                    <div className="mt-1 font-bold text-[#082B52]">
                      {isSimulationComplete ? `${frames.length} / ${frames.length} Frames` : `${Math.min(frames.length, currentInferringIndex + 1)} / ${frames.length} Frames`}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                    <div className="text-[10px] font-semibold text-[#64748B] uppercase">Reliability Index</div>
                    <div
                      className={`mt-1 font-bold ${
                        isSimulationComplete ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {isSimulationComplete ? '89 / 100' : 'Calculating...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-[#082B52]">
                  <span>Overall Workflow Synthesis</span>
                  <span className="font-bold">{inferenceProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-xs overflow-hidden border border-slate-300">
                  <div
                    className="h-full bg-[#082B52] transition-all duration-200"
                    style={{ width: `${inferenceProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Survey Information (Metadata Block) */}
            <div className="p-4 bg-white border border-slate-300 rounded-sm shadow-xs space-y-3">
              <div className="text-sm font-semibold text-[#082B52] uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <Compass size={16} className="text-[#082B52]" />
                <span>SURVEY INFORMATION</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Survey ID</div>
                  <div className="font-bold text-[#082B52] mt-0.5">{activeSurvey?.surveyId || 'SN-2026-09-IN'}</div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Survey Area</div>
                  <div className="font-semibold text-[#082B52] mt-0.5 truncate" title="Arabian Sea Corridor - Sector 4B">
                    {activeSurvey?.corridor || activeSurvey?.name || 'Arabian Sea Corridor'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Survey Platform</div>
                  <div className="font-semibold text-[#082B52] mt-0.5">{activeSurvey?.vessel || 'RV Sagar Nidhi'}</div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Sonar System</div>
                  <div className="font-semibold text-[#082B52] mt-0.5">{activeSurvey?.sensor?.split('(')[0] || 'EdgeTech 4200'}</div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Acoustic Frequency</div>
                  <div className="font-semibold text-[#082B52] mt-0.5">{activeSurvey?.frequency || '455 / 900 kHz'}</div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Swath Width</div>
                  <div className="font-semibold text-[#082B52] mt-0.5">{activeSurvey?.swathWidth || activeSurvey?.swath || '100 m'}</div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Center Coordinates</div>
                  <div className="font-semibold text-[#082B52] mt-0.5">{activeSurvey?.origin || '12.3300° N, 72.9710° E'}</div>
                </div>
              </div>
            </div>

            {/* Section 3: Processing Workflow Table */}
            <div className="p-4 bg-white border border-slate-300 rounded-sm shadow-xs space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-[#082B52] uppercase tracking-wider border-b border-slate-200 pb-2">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-[#082B52]" />
                  PROCESSING WORKFLOW
                </span>
                <span className="text-xs font-medium text-[#64748B]">
                  {isSimulationComplete ? '6 / 6 Completed' : `${currentStageIndex} of 6 Completed`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[#082B52] text-[10px] font-bold uppercase tracking-wider border-y border-slate-300">
                      <th className="py-2 px-3 border-r border-slate-200 w-16">ID</th>
                      <th className="py-2 px-3 border-r border-slate-200 w-48">Stage Name</th>
                      <th className="py-2 px-3 border-r border-slate-200">Processing Module</th>
                      <th className="py-2 px-3 w-32 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {SONAR_PIPELINE_STAGES.map((stage, idx) => {
                      const isPast = idx < currentStageIndex || isSimulationComplete;
                      const isCurrent = idx === currentStageIndex && !isSimulationComplete;

                      return (
                        <tr
                          key={stage.id}
                          className={`transition-colors ${
                            isCurrent
                              ? 'bg-[#EBF3FA] font-semibold text-[#082B52]'
                              : isPast
                              ? 'bg-emerald-50/20'
                              : 'bg-white text-slate-500'
                          }`}
                        >
                          <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#082B52]">
                            0{stage.id}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-[#082B52]">
                            {stage.shortCode}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-[#082B52] font-semibold">
                            {stage.name} — <span className="font-normal text-slate-500">{stage.module}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isPast ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-xs border border-emerald-300">
                                <CheckCircle2 size={11} className="text-emerald-700" />
                                COMPLETED
                              </span>
                            ) : isCurrent ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#082B52] bg-blue-100 px-2.5 py-0.5 rounded-xs border border-blue-300 animate-pulse">
                                <Loader2 size={11} className="animate-spin text-[#082B52]" />
                                PROCESSING
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-xs border border-slate-200">
                                QUEUED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Processing Activity Table */}
            <div className="bg-white border border-slate-300 rounded-sm shadow-xs overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 select-none">
                <div className="flex items-center gap-2">
                  <Terminal size={15} className="text-[#082B52]" />
                  <span className="text-xs font-semibold text-[#082B52] uppercase tracking-wider">
                    PROCESSING ACTIVITY
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-white text-[#082B52] border border-slate-300 rounded-xs">
                    {filteredLogs.length} events logged
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white rounded-xs border border-slate-300 p-0.5 text-[10px]">
                    {(['all', 'process', 'success', 'warn'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setLogFilter(filter)}
                        className={`px-2 py-0.5 rounded-xs transition-all capitalize cursor-pointer font-medium ${
                          logFilter === filter
                            ? 'bg-[#082B52] text-white font-bold'
                            : 'text-[#64748B] hover:text-[#082B52]'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyLogs}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-[#082B52] text-[11px] font-medium border border-slate-300 rounded-xs transition-colors cursor-pointer"
                    title="Copy activity log"
                  >
                    {copiedLogs ? (
                      <>
                        <Check size={12} className="text-emerald-700" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Log</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Clean Light Institutional Activity Table */}
              <div ref={logBoxRef} className="max-h-48 overflow-y-auto divide-y divide-slate-200 text-xs scrollbar-thin">
                <div className="sticky top-0 bg-slate-50 border-b border-slate-300 text-[#082B52] font-bold text-[10px] uppercase tracking-wider grid grid-cols-12 px-3 py-1.5 select-none">
                  <span className="col-span-2">TIME</span>
                  <span className="col-span-2">MODULE</span>
                  <span className="col-span-6">EVENT DESCRIPTION</span>
                  <span className="col-span-2 text-right">STATUS</span>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="text-slate-500 italic py-4 text-center text-xs">
                    No activity entries matching filter "{logFilter}"
                  </div>
                ) : (
                  filteredLogs.map((log, index) => {
                    const isLatest = index === filteredLogs.length - 1;
                    const isProcessingItem = log.type === 'process';

                    return (
                      <div
                        key={log.id}
                        className="grid grid-cols-12 px-3 py-1.5 items-center hover:bg-slate-50 transition-colors"
                      >
                        <span className="col-span-2 text-[#64748B] font-mono text-[11px]">[{log.timestamp}]</span>
                        <span className="col-span-2 font-bold text-[#082B52] truncate">{log.stage}</span>
                        <span className="col-span-6 text-[#082B52] font-medium truncate" title={log.text}>{log.text}</span>
                        <span className="col-span-2 text-right">
                          {log.type === 'success' ? (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-xs border border-emerald-300">
                              COMPLETED
                            </span>
                          ) : log.type === 'warn' ? (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-xs border border-amber-300">
                              WARNING
                            </span>
                          ) : isProcessingItem && !isSimulationComplete && isLatest ? (
                            <span className="text-[9px] font-bold text-[#082B52] bg-blue-100 px-1.5 py-0.5 rounded-xs border border-blue-300 animate-pulse">
                              PROCESSING
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-xs border border-slate-300">
                              COMPLETED
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="relative px-6 py-3.5 bg-slate-100 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
            <div className="text-xs text-[#082B52] font-medium">
              {isSimulationComplete ? (
                <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-700" />
                  SYSTEM VERIFIED • {frames.length} Frames Processed (12 Targets Detected). Reliability Index: 89/100.
                </span>
              ) : (
                <span className="text-[#082B52] font-bold flex items-center gap-1.5 animate-pulse">
                  <Activity size={15} />
                  PROCESSING • Executing autonomous deep learning pipeline across {frames.length} sonar swaths...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isSimulationComplete ? (
                <>
                  <button
                    onClick={() => setIsRunningInference(false)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    title="Close modal"
                  >
                    <X size={14} />
                    <span>Close Window</span>
                  </button>
                  <button
                    onClick={handleProceedToWorkspace}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xs bg-[#082B52] hover:bg-[#051c37] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>View Sonar Analysis Results</span>
                    <ArrowRight size={15} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xs bg-slate-200/70 border border-slate-300 text-slate-700 text-xs font-semibold">
                  <Loader2 size={13} className="animate-spin text-[#082B52]" />
                  <span>Processing Survey Telemetry Stream...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pre-Inference Hero Screen: if AI pipeline has not yet executed across all frames
  if (!isFramesProcessed) {
    return (
      <div className="pt-1 pb-6 px-6 md:px-8 max-w-7xl mx-auto">
        <PageHeader
          step="STEP 02"
          total="06"
          title="Sonar Analysis"
          subtitle="Preprocess the sonar images and detect known objects and novel anomalies using AI."
        />

        {/* Clean Pre-Inference Hero Workspace */}
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-xs overflow-hidden">
            {/* Top Navy Accent Bar */}
            <div className="h-1.5 bg-[#082B52]" />

            <div className="p-8 sm:p-10 space-y-8">
              {/* Header with Status Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-sm bg-[#EBF3FA] border border-[#B4CCE4] flex items-center justify-center text-[#082B52] flex-shrink-0">
                    <Anchor size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#082B52] tracking-tight">
                      Autonomous Sonar AI Analysis Pipeline
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Sector 4B Survey Dataset • {frames.length} Hydrographic Swaths Staged for Multi-Model Neural Inference
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs bg-[#EBF3FA] text-[#082B52] border border-[#B4CCE4] text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    STATUS: READY FOR INFERENCE
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                The acoustic waterfall survey data from RV Sagar Nidhi has been ingested and calibrated.
                Execute the neural deep learning pipeline to run bilateral denoising, YOLO26s-seg marine debris
                localization, SAM contour mask extraction, and PatchCore memory bank anomaly screening across all {frames.length} frames.
              </p>

              {/* 4 Metadata & Model Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xs">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sonar Platform</div>
                  <div className="font-bold text-[#082B52] text-sm mt-1">{activeSurvey?.vessel || 'RV Sagar Nidhi'}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{activeSurvey?.sensor || 'EdgeTech 4200 (455/900 kHz)'}</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xs">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Queued Swaths</div>
                  <div className="font-bold text-[#082B52] text-sm mt-1">{frames.length} Waterfall Frames</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">100% Ingested & Validated</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xs">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AI Model Suite</div>
                  <div className="font-bold text-[#082B52] text-sm mt-1">YOLO26s-seg + PatchCore</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">SAM Contour Segmentation</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xs">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Survey Corridor</div>
                  <div className="font-bold text-[#082B52] text-sm mt-1">Arabian Sea Sector 4B</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{activeSurvey?.origin || '12.330° N, 72.971° E'}</div>
                </div>
              </div>

              {/* Centered Prominent "Run All Frames" Button */}
              <div className="flex flex-col items-center justify-center pt-4 pb-2 space-y-4">
                <button
                  type="button"
                  onClick={handleRunAllFrames}
                  className="px-10 py-4 bg-[#082B52] hover:bg-ocean text-white rounded-md text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group active:scale-98"
                >
                  <Play size={20} className="fill-current text-white group-hover:scale-110 transition-transform" />
                  <span>Run All Frames (Execute Sonar Pipeline)</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>TensorRT FP16 Inference Engine Ready • Est. Duration ~7.0s</span>
                </div>
              </div>

              {/* Pipeline Sequence Steps Banner */}
              <div className="p-3.5 bg-[#EBF3FA]/60 border border-[#B4CCE4]/80 rounded-xs flex flex-wrap items-center justify-between text-xs text-[#082B52] gap-2">
                <span className="font-bold uppercase tracking-wider text-[11px]">Pipeline Sequence:</span>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-700">
                  <span>01 Raw Ingestion</span>
                  <span className="text-slate-400">→</span>
                  <span>02 Bilateral Denoising</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-[#082B52]">03 YOLO26s-seg Detection</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-[#082B52]">04 PatchCore Anomaly Scoring</span>
                  <span className="text-slate-400">→</span>
                  <span>05 Downstream Activation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Queued Frames Strip */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#082B52]" />
                <h3 className="text-sm font-bold text-[#082B52] uppercase tracking-wider">
                  Queued Sonar Swath Frames ({frames.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">Awaiting Batch Deep Learning Inference</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {frames.map((frame, index) => (
                <div
                  key={frame.id || index}
                  className="bg-slate-50 border border-slate-200 rounded-xs overflow-hidden flex flex-col group hover:border-[#082B52] transition-colors"
                >
                  <div className="aspect-[16/10] bg-black overflow-hidden relative">
                    <img
                      src={frame.rawUrl}
                      alt={frame.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-[9px] font-mono text-white rounded-xs">
                      #{String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono font-medium text-[#082B52] truncate" title={frame.displayName || `Image ${index + 1}`}>
                      {frame.displayName || `Image ${index + 1}`}
                    </span>
                    <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded-xs border border-amber-200 text-center font-medium">
                      Queued
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Big Pipeline Execution Dialog Box (rendered when isRunningInference is true) */}
        {isRunningInference && renderBigPipelineModal()}
      </div>
    );
  }

  // Primary detection if present
  const primaryDetection =
    activeFrame.detections && activeFrame.detections.length > 0 ? activeFrame.detections[0] : null;

  return (
    <div className="pt-1 pb-6 px-6 md:px-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <PageHeader
        step="STEP 02"
        total="06"
        title="Sonar Analysis"
        subtitle="Preprocess the sonar images and detect known objects and novel anomalies using AI."
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 of 12 cols): Large Sonar Image Viewer Primary Workspace */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs overflow-hidden flex flex-col">
            {/* Viewer Header */}
            <div className="px-5 py-3 border-b border-navy-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <ImageIcon size={18} className="text-ocean" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-navy">Sonar Image Viewer</h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded border font-medium ${
                    isFramesProcessed
                      ? typeInfo.badgeColor
                      : 'text-navy-700 bg-navy-50 border-navy-200 font-mono'
                  }`}
                >
                  {isFramesProcessed ? typeInfo.typeLabel : 'Raw Acoustic Waterfall • 455 kHz'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleRunAllFrames}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-navy-50 text-navy-700 border border-navy-200 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                  title="Re-run AI deep learning inference pipeline across all frames"
                >
                  <RotateCcw size={12} />
                  <span>Re-run All Frames</span>
                </button>
                <button
                  onClick={handleResetToPreRun}
                  className="text-[11px] text-navy-400 hover:text-red-600 transition-colors cursor-pointer font-medium"
                  title="Reset back to Pre-Inference State"
                >
                  Reset
                </button>

                <span className="text-xs text-navy-400 font-mono font-medium">
                  {selectedFrameIndex + 1} / {frames.length}
                </span>
                {/* Header On-Screen Arrow Controls: ↑ / ↓ for Image Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevImage}
                    className="w-6 h-6 flex items-center justify-center border border-navy-100 rounded text-navy-400 hover:text-navy hover:border-ocean hover:bg-ocean-50/50 transition-colors cursor-pointer"
                    title="Previous Image (Keyboard: ↑)"
                    aria-label="Previous Image"
                  >
                    <ChevronUp size={13} strokeWidth={2} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="w-6 h-6 flex items-center justify-center border border-navy-100 rounded text-navy-400 hover:text-navy hover:border-ocean hover:bg-ocean-50/50 transition-colors cursor-pointer"
                    title="Next Image (Keyboard: ↓)"
                    aria-label="Next Image"
                  >
                    <ChevronDown size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            {/* Viewer Body: Left Filmstrip + Central Viewport */}
            <div className="flex flex-row overflow-hidden border-b border-navy-50">
              {/* Left Filmstrip Column (Strictly Raw Authentic Images in Priority Order) */}
              <div className="w-[88px] bg-slate-50/70 border-r border-navy-50 p-2 space-y-2.5 max-h-[500px] overflow-y-auto scrollbar-thin select-none flex-shrink-0">
                {frames.map((frame, index) => {
                  const isSelected = index === selectedFrameIndex;
                  const itemInfo = getImageTypeInfo(frame);
                  return (
                    <div
                      key={frame.id || index}
                      ref={(el) => (thumbnailRefs.current[index] = el)}
                      onClick={() => setSelectedFrameIndex(index)}
                      className="cursor-pointer group flex flex-col items-center"
                    >
                      <div
                        className={`w-full aspect-[16/10] bg-navy-950 rounded-sm overflow-hidden transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-ocean border border-ocean shadow-xs scale-102'
                            : 'border border-navy-100 opacity-70 group-hover:opacity-100'
                        }`}
                      >
                        <img
                          src={frame.rawUrl}
                          alt={frame.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className={`text-[10px] text-center truncate block mt-1 w-full ${
                          isSelected ? 'text-ocean font-semibold' : 'text-navy-400 font-medium'
                        }`}
                        title={`${frame.displayName || `Image ${index + 1}`} (${itemInfo.typeLabel})`}
                      >
                        {frame.displayName || `Image ${index + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Central Sonar Image Viewport */}
              <div
                className={`relative flex-1 bg-black overflow-hidden flex items-center justify-center transition-all ${
                  isFullscreen ? 'h-[78vh]' : 'h-[500px]'
                }`}
              >
                {/* Top View Mode Switcher: Centered & Slim, Exactly like Evidence Layer */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-center pointer-events-none select-none z-20">
                  <div className="pointer-events-auto bg-white border border-navy-100 rounded-md shadow-xs p-0.5 flex items-center gap-1">
                    {/* On-Screen ← Arrow for Processed View */}
                    <button
                      onClick={handlePrevMode}
                      className="w-6 h-6 flex items-center justify-center rounded text-navy-400 hover:text-navy hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Previous View (Keyboard: ←)"
                      aria-label="Previous View"
                    >
                      <ChevronLeft size={13} strokeWidth={2} />
                    </button>

                    {/* The 4 Options */}
                    <div className="flex items-center gap-0.5">
                      {FILTER_OPTIONS.map((item) => {
                        const isActive = activeLayer === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveLayer(item.id)}
                            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap ${
                              isActive
                                ? 'bg-navy text-white font-semibold shadow-xs'
                                : 'text-navy-500 hover:text-navy hover:bg-slate-50 font-medium'
                            }`}
                            title={`Switch to ${item.label}`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* On-Screen → Arrow for Processed View */}
                    <button
                      onClick={handleNextMode}
                      className="w-6 h-6 flex items-center justify-center rounded text-navy-400 hover:text-navy hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Next View (Keyboard: →)"
                      aria-label="Next View"
                    >
                      <ChevronRight size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Scaled Sonar Display Canvas */}
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200 relative"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={currentView.url}
                    alt={`${activeLayer} view of ${activeFrame.name}`}
                    className="max-h-full max-w-full object-contain select-none"
                  />
                </div>

                {/* Bottom-Left: Active Mode Watermark Tag */}
                <div className="absolute bottom-12 left-5 select-none pointer-events-none z-10">
                  <div className="px-2 py-0.5 rounded bg-white/95 border border-navy-100 text-[10px] font-medium text-navy shadow-xs">
                    {currentView.watermark}
                  </div>
                </div>

                {/* Bottom-Right: 50m Scale Bar */}
                <div className="absolute bottom-12 right-5 select-none pointer-events-none opacity-90 z-10 text-right">
                  <div className="text-[10px] font-medium text-white mb-0.5">50 m</div>
                  <div className="w-20 h-0.5 bg-white relative flex justify-between">
                    <div className="w-0.5 h-2 bg-white -top-1.5 absolute left-0" />
                    <div className="w-0.5 h-2 bg-white -top-1.5 absolute right-0" />
                  </div>
                </div>

                {/* Bottom Toolbar: Zoom Controls & Fullscreen */}
                <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-none select-none z-10">
                  {/* Zoom Controls Pill */}
                  <div className="pointer-events-auto flex items-center bg-white border border-navy-100 rounded-md shadow-xs p-0.5 text-xs">
                    <button
                      onClick={handleZoomOut}
                      className="px-2 py-1 text-navy-400 hover:text-navy hover:bg-slate-50 rounded transition-colors cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="px-2 py-1 font-semibold text-navy hover:text-ocean transition-colors cursor-pointer"
                      title="Reset Zoom"
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                    <button
                      onClick={handleZoomIn}
                      className="px-2 py-1 text-navy-400 hover:text-navy hover:bg-slate-50 rounded transition-colors cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn size={13} />
                    </button>
                  </div>

                  {/* Modal Expand & Fullscreen Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setExpandedLayer(activeLayer);
                        setIsModalOpen(true);
                      }}
                      className="pointer-events-auto px-2.5 py-1.5 bg-white border border-navy-100 text-navy hover:text-ocean hover:bg-slate-50 rounded-md shadow-xs text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Open High-Resolution Inspector Modal"
                    >
                      <SlidersHorizontal size={13} className="text-ocean" />
                      <span>Inspect Mode</span>
                    </button>

                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="pointer-events-auto p-1.5 bg-white border border-navy-100 text-navy-400 hover:text-navy hover:bg-slate-50 rounded-md shadow-xs transition-colors cursor-pointer"
                      title="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 of 12 cols): AI Analysis & Telemetry Panel */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-navy-50">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-ocean" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-navy">AI Analysis & Telemetry</h3>
              </div>
              {isFramesProcessed ? (
                primaryDetection ? (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Model Inferred
                  </span>
                ) : (
                  <span className="text-xs font-medium text-navy-400 bg-slate-50 px-2 py-0.5 rounded border border-navy-100">
                    Baseline Scan
                  </span>
                )
              ) : (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  Awaiting Inference
                </span>
              )}
            </div>

            {/* If inference not executed yet: Show Deep Learning Execution Card */}
            {!isFramesProcessed ? (
              <div className="p-4 bg-navy-50/50 border border-navy-100 rounded-lg space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-[#082B52] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <Cpu size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy uppercase tracking-wider">
                      Deep Learning Models Ready
                    </h4>
                    <p className="text-xs text-navy-400 mt-0.5 leading-relaxed">
                      15 raw acoustic waterfall frames ingested. Run batch inference to execute YOLO26s-seg detection, SAM segmentation masks, and PatchCore anomaly scoring.
                    </p>
                  </div>
                </div>

                {/* Model Architecture Info */}
                <div className="space-y-1.5 text-xs bg-white p-3 rounded-md border border-navy-100/70 shadow-xs">
                  <div className="flex items-center justify-between text-navy-400">
                    <span className="font-medium">Target Detector:</span>
                    <span className="font-mono font-semibold text-navy">YOLO26s-seg (Marine Debris)</span>
                  </div>
                  <div className="flex items-center justify-between text-navy-400">
                    <span className="font-medium">Anomaly Engine:</span>
                    <span className="font-mono font-semibold text-navy">PatchCore Memory Bank</span>
                  </div>
                  <div className="flex items-center justify-between text-navy-400">
                    <span className="font-medium">Swath Coverage:</span>
                    <span className="font-mono font-semibold text-navy">100 m Dual-Frequency</span>
                  </div>
                  <div className="flex items-center justify-between text-navy-400">
                    <span className="font-medium">Queued Dataset:</span>
                    <span className="font-mono font-semibold text-ocean">15 Sonar Swaths</span>
                  </div>
                </div>

                {/* Prominent Action Button */}
                <button
                  onClick={handleRunAllFrames}
                  className="w-full py-2.5 bg-[#082B52] hover:bg-ocean text-white rounded-md font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Play size={13} className="fill-current text-white" />
                  <span>Run All Frames (Execute Inference)</span>
                </button>
              </div>
            ) : (
              /* AI Target Analysis Section (When Inferred) */
              <div className="space-y-2.5">
                <div className="label-xs text-navy-300">AI TARGET ANALYSIS</div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Confidence */}
                  <div className="bg-slate-50/60 p-2.5 rounded-md border border-navy-50">
                    <div className="label-xs text-navy-300 mb-0.5">
                      {primaryDetection?.isNovel
                        ? 'Anomaly Score'
                        : activeFrame.detections && activeFrame.detections.length > 1
                        ? `YOLO Confidence (${activeFrame.detections.length})`
                        : 'YOLO Confidence'}
                    </div>
                    <div className="font-semibold text-navy">
                      {activeFrame.detections && activeFrame.detections.length > 1 ? (
                        <div className="space-y-1">
                          {activeFrame.detections.map((d, i) => (
                            <div key={d.id} className="flex items-center justify-between text-xs">
                              <span className="text-navy-400 font-normal">#{i + 1}:</span>
                              <span>
                                {Math.round(d.confidence * 100)}%
                                <span className="text-navy-400 font-normal ml-1">
                                  ({d.confidence.toFixed(2)})
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : primaryDetection ? (
                        <span>
                          {Math.round(primaryDetection.confidence * 100)}%
                          <span className="text-navy-400 font-normal ml-1">
                            ({primaryDetection.confidence.toFixed(2)})
                          </span>
                        </span>
                      ) : (
                        <span className="text-navy-300 font-normal">N/A</span>
                      )}
                    </div>
                  </div>

                  {/* Detection Status */}
                  <div className="bg-slate-50/60 p-2.5 rounded-md border border-navy-50">
                    <div className="label-xs text-navy-300 mb-0.5">Detection Status</div>
                    <div className="font-semibold text-navy flex items-center gap-1.5">
                      {activeFrame.detections && activeFrame.detections.length > 1 ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          {activeFrame.detections.length} Detected
                        </span>
                      ) : primaryDetection ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Detected
                        </span>
                      ) : (
                        <span className="text-navy-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                          No Detection
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detected Class (Full Width) */}
                  <div className="col-span-2 bg-slate-50/60 p-2.5 rounded-md border border-navy-50">
                    <div className="label-xs text-navy-300 mb-0.5">Detected Class</div>
                    <div className="font-semibold text-navy truncate">
                      {primaryDetection ? primaryDetection.className : typeInfo.classification}
                    </div>
                  </div>
                </div>

                {/* Anomaly Status Bar */}
                <div className="bg-slate-50/60 p-2.5 rounded-md border border-navy-50 flex items-center justify-between text-xs">
                  <span className="label-xs text-navy-300">Anomaly Status</span>
                  {typeInfo.isAnomaly ||
                  (activeFrame.detections && activeFrame.detections.some((d) => d.isNovel)) ? (
                    <span className="text-[#eb3838] font-semibold text-xs flex items-center gap-1.5">
                      <AlertTriangle size={13} /> PatchCore Novel Anomaly
                    </span>
                  ) : activeFrame.detections && activeFrame.detections.length > 0 ? (
                    <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Normal (Known Class)
                    </span>
                  ) : (
                    <span className="text-navy-400 font-medium text-xs">
                      Normal Seafloor Profile
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Image Information Section */}
            <div className="pt-2 border-t border-navy-50 space-y-2">
              <div className="label-xs text-navy-300 font-semibold tracking-wider">IMAGE INFORMATION</div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
                  <span className="text-navy-400 font-medium">Image</span>
                  <span className="font-semibold text-navy truncate max-w-[170px]" title={activeFrame.displayName || `Image ${selectedFrameIndex + 1}`}>
                    {activeFrame.displayName || `Image ${selectedFrameIndex + 1}`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
                  <span className="text-navy-400 font-medium">Frame Index</span>
                  <span className="font-semibold text-navy font-mono">
                    {selectedFrameIndex + 1} of {frames.length}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
                  <span className="text-navy-400 font-medium">Coordinates</span>
                  <span className="font-mono font-medium text-navy text-[11px]">
                    12.330° N, 72.971° E
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
                  <span className="text-navy-400 font-medium">Swath Range</span>
                  <span className="font-semibold text-navy">100 m (Dual-Channel)</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
                  <span className="text-navy-400 font-medium">Sensor</span>
                  <span className="font-semibold text-navy">EdgeTech 4200 (455 kHz)</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-navy-400 font-medium">Processing Status</span>
                  <span className={`font-semibold flex items-center gap-1.5 ${isFramesProcessed ? 'text-emerald-700' : 'text-amber-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isFramesProcessed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {isFramesProcessed ? 'Model Inferred' : 'Raw Ingested (Awaiting Inference)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Acoustic Note Section */}
            {activeFrame.observability?.notes && (
              <div className="pt-2 border-t border-navy-50">
                <div className="label-xs text-navy-300 mb-1">ACOUSTIC NOTE</div>
                <p className="text-xs text-navy-500 font-normal leading-relaxed bg-slate-50/60 p-2.5 rounded-md border border-navy-50">
                  {activeFrame.observability.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-navy-100/60">
        <button
          onClick={() => navigate('/survey-ingestion')}
          className="px-4 py-2 bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 text-ocean rounded-md text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Ingestion
        </button>

        <button
          onClick={() => navigate('/evidence-intelligence')}
          className="px-5 py-2.5 bg-navy hover:bg-ocean text-white rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm group"
        >
          <span>Continue to Evidence Intelligence</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* High-Resolution Expanded Section Modal Lightbox */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 shadow-xl border border-navy-100 max-h-[95vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-navy-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-ocean-50 text-ocean flex items-center justify-center">
                  <SlidersHorizontal size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy capitalize">
                    {FILTER_OPTIONS.find((o) => o.id === expandedLayer)?.label || 'Bounding Box + Mask'} • {activeFrame.displayName || `Image ${selectedFrameIndex + 1}`}
                  </h3>
                  <p className="text-xs text-navy-400 mt-0.5">
                    Frame {selectedFrameIndex + 1} of {frames.length} ({typeInfo.typeLabel})
                  </p>
                </div>
              </div>

              {/* Section Switcher Tabs inside Modal */}
              <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-md">
                {FILTER_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setExpandedLayer(item.id);
                      setActiveLayer(item.id);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                      expandedLayer === item.id
                        ? 'bg-navy text-white shadow-xs'
                        : 'text-navy-400 hover:text-navy'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Modal Zoom & Close Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-md p-0.5 text-xs">
                  <button
                    onClick={handleModalZoomOut}
                    className="p-1 rounded text-navy-400 hover:text-navy cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="px-1.5 text-navy font-semibold">
                    {Math.round(modalZoomLevel * 100)}%
                  </span>
                  <button
                    onClick={handleModalZoomIn}
                    className="p-1 rounded text-navy-400 hover:text-navy cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    onClick={handleModalResetZoom}
                    className="p-1 rounded text-navy-400 hover:text-navy cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setModalZoomLevel(1);
                  }}
                  className="p-1.5 rounded-md text-navy-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body Viewport */}
            <div className="py-4 flex-1 overflow-hidden flex items-center justify-center bg-black rounded-lg border border-navy-100 relative min-h-[420px]">
              {modalView ? (
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${modalZoomLevel})` }}
                >
                  <img
                    src={modalView.url}
                    alt={`${expandedLayer} expanded view`}
                    className="max-h-[65vh] max-w-full object-contain select-none shadow-lg"
                  />
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-navy-50 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-navy-400">
                Active Layer: <strong className="text-navy">{FILTER_OPTIONS.find((o) => o.id === expandedLayer)?.label || 'Bounding Box + Mask'}</strong>
              </div>

              <div className="flex items-center gap-3">
                {modalView && (
                  <a
                    href={modalView.url}
                    download={`${activeFrame.name}_${expandedLayer}`}
                    className="px-4 py-2 border border-navy-200 hover:bg-slate-50 rounded-md text-xs font-semibold text-navy flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    Download Image
                  </a>
                )}
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setModalZoomLevel(1);
                  }}
                  className="px-5 py-2 bg-navy hover:bg-ocean text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Big Institutional Pipeline Execution Modal */}
      {isRunningInference && renderBigPipelineModal()}
    </div>
  );
}
