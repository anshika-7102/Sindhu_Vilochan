import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
  CheckSquare,
  MessageSquare,
  User,
  Check,
  Leaf,
  X,
  Clock,
  Compass,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ArrowRight,
  ArrowLeft,
  Info,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  Activity,
  Target,
  Save,
  RotateCcw,
  HelpCircle,
  Tag,
  Plus,
  ChevronDown,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import {
  INITIAL_REVIEW_CANDIDATES,
  ReviewCandidate,
} from '@/data/surveyWorkflowData';
import { usePipeline } from '@/context/PipelineContext';
import LayerEmptyState from '@/components/LayerEmptyState';

type ReviewViewMode = 'bbox' | 'raw' | 'enhanced' | 'heatmap';

interface ViewOption {
  id: ReviewViewMode;
  label: string;
  watermark: string;
  getUrl: (candidate: ReviewCandidate) => string;
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    id: 'bbox',
    label: 'Bounding Box',
    watermark: 'PatchCore Anomaly • Bounding Box ROI',
    getUrl: (c) => c.bboxUrl || c.rawUrl,
  },
  {
    id: 'raw',
    label: 'Raw Sonar',
    watermark: 'PatchCore Anomaly • Raw Acoustic Data',
    getUrl: (c) => c.rawUrl,
  },
  {
    id: 'enhanced',
    label: 'Enhanced',
    watermark: 'PatchCore Anomaly • Pre-Processed Sonar',
    getUrl: (c) => c.preprocessedUrl || c.rawUrl,
  },
  {
    id: 'heatmap',
    label: 'Anomaly Heatmap',
    watermark: 'PatchCore Engine • Anomaly Heatmap',
    getUrl: (c) => c.heatmapUrl,
  },
];

const STORAGE_KEY = 'sagar_human_review_candidates_v5';

const PREDEFINED_CLASSES = [
  'Shipwreck',
  'Crab Pot',
  'Plane',
  'Pipe',
  'Ghost Net',
];

export default function HumanReview() {
  const navigate = useNavigate();
  const { pipelineState } = usePipeline();
  const isProcessed = pipelineState !== 'idle';

  // Load human review candidate (strictly human.png and its corresponding images)
  const [candidates, setCandidates] = useState<ReviewCandidate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          (parsed[0].name === 'human.png' || parsed[0].id === 'cand-human')
        ) {
          return parsed.map((c: any) => {
            const isPredefined = PREDEFINED_CLASSES.includes(c.confirmedClass);
            return {
              ...c,
              displayId: 'Image 3',
              // On page reload, reset custom class to default predefined 'Shipwreck'
              confirmedClass: isPredefined
                ? c.confirmedClass
                : c.decision === 'confirmed'
                ? 'Shipwreck'
                : undefined,
            };
          });
        }
      } catch (e) {
        console.error('Failed to load review candidates:', e);
      }
    }
    return INITIAL_REVIEW_CANDIDATES.map((c) => ({
      ...c,
      displayId: 'Image 3',
      confirmedClass: c.confirmedClass || undefined,
    }));
  });

  const [activeView, setActiveView] = useState<ReviewViewMode>('bbox');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Active single candidate: human.png
  const activeCandidate = candidates[0] || INITIAL_REVIEW_CANDIDATES[0];
  const [noteText, setNoteText] = useState<string>(activeCandidate.notes || '');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Class Selection states for Confirm Debris
  const [isClassListOpen, setIsClassListOpen] = useState<boolean>(
    activeCandidate.decision === 'confirmed'
  );
  // On reload, custom class is always reset
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);
  const [customClassText, setCustomClassText] = useState<string>('');

  // Sync noteText when activeCandidate changes
  useEffect(() => {
    setNoteText(activeCandidate.notes || '');
  }, [activeCandidate.id]);

  // Sync custom class text and selection when candidate changes
  useEffect(() => {
    if (activeCandidate.confirmedClass) {
      const isCustom = !PREDEFINED_CLASSES.includes(activeCandidate.confirmedClass);
      setIsCustomSelected(isCustom);
      if (isCustom) {
        setCustomClassText(activeCandidate.confirmedClass);
      } else {
        setCustomClassText('');
      }
    } else {
      setIsCustomSelected(false);
      setCustomClassText('');
    }
  }, [activeCandidate.confirmedClass]);

  // Persist review decisions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
  }, [candidates]);

  // Handle human decision action
  const handleDecision = (
    decision: 'confirmed' | 'natural' | 'further-review'
  ) => {
    if (decision === 'confirmed') {
      const updated = [...candidates];
      updated[0] = {
        ...updated[0],
        decision: 'confirmed',
        confirmedClass: activeCandidate.confirmedClass || 'Shipwreck',
        notes: noteText,
      };
      setCandidates(updated);
      setIsClassListOpen((prev) => (activeCandidate.decision === 'confirmed' ? !prev : true));
    } else {
      setIsClassListOpen(false);
      const updated = [...candidates];
      updated[0] = {
        ...updated[0],
        decision,
        notes: noteText,
      };
      setCandidates(updated);
    }
  };

  const handleSelectPredefinedClass = (className: string) => {
    setIsCustomSelected(false);
    const updated = [...candidates];
    updated[0] = {
      ...updated[0],
      decision: 'confirmed',
      confirmedClass: className,
    };
    setCandidates(updated);
  };

  const handleSelectCustomClass = () => {
    setIsCustomSelected(true);
  };

  const handleCustomClassTextChange = (text: string) => {
    // Only update local input field draft state — do not mutate confirmedClass everywhere on each keystroke
    setCustomClassText(text);
  };

  const handleApplyCustomClass = () => {
    const trimmed = customClassText.trim();
    if (!trimmed) return;
    const updated = [...candidates];
    updated[0] = {
      ...updated[0],
      decision: 'confirmed',
      confirmedClass: trimmed,
    };
    setCandidates(updated);
  };

  // Handle note change
  const handleNoteChange = (text: string) => {
    setNoteText(text.slice(0, 300));
    setIsSaved(false);
  };

  // Handle save notes
  const handleSaveNotes = () => {
    const updated = [...candidates];
    updated[0] = {
      ...updated[0],
      notes: noteText,
    };
    setCandidates(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Handle reset notes and reset custom class
  const handleResetNotes = () => {
    setNoteText('');
    setIsCustomSelected(false);
    setCustomClassText('');
    const updated = [...candidates];
    updated[0] = {
      ...updated[0],
      notes: '',
      confirmedClass: updated[0].decision === 'confirmed' ? 'Shipwreck' : undefined,
    };
    setCandidates(updated);
    setIsSaved(false);
  };


  // View navigation helpers
  const handlePrevMode = () => {
    const currentIndex = VIEW_OPTIONS.findIndex((v) => v.id === activeView);
    const prevIndex = (currentIndex - 1 + VIEW_OPTIONS.length) % VIEW_OPTIONS.length;
    setActiveView(VIEW_OPTIONS[prevIndex].id);
  };

  const handleNextMode = () => {
    const currentIndex = VIEW_OPTIONS.findIndex((v) => v.id === activeView);
    const nextIndex = (currentIndex + 1) % VIEW_OPTIONS.length;
    setActiveView(VIEW_OPTIONS[nextIndex].id);
  };

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const isReviewed = activeCandidate.decision !== null && activeCandidate.decision !== undefined;
  const currentView = VIEW_OPTIONS.find((v) => v.id === activeView) || VIEW_OPTIONS[0];
  const currentImageUrl = currentView.getUrl(activeCandidate);

  if (!isProcessed) {
    return (
      <div className="pt-1 pb-4 px-6 md:px-8 max-w-7xl mx-auto space-y-3">
        <PageHeader
          title="Human Review"
          subtitle="Expert human-in-the-loop verification of novel acoustic anomalies and out-of-distribution seabed contacts identified by unsupervised PatchCore."
        />

        <LayerEmptyState
          layerNumber="04"
          layerName="Human Review"
          title="Human Verification Queue Empty"
          description="No flagged anomaly targets available for review. Ingest survey data in Layer 01 and execute the processing pipeline to populate the review triage."
          Icon={CheckSquare}
          hint="Unsupervised novel anomaly activations (ANO-001) will populate this verification queue once processed."
        />
      </div>
    );
  }

  return (
    <div className="pt-1 pb-3 px-6 md:px-8 max-w-7xl mx-auto space-y-2.5">
      {/* Top Header with Consistent PageHeader */}
      <PageHeader
        title="Human Review"
        subtitle="Expert human-in-the-loop verification of novel acoustic anomalies and out-of-distribution seabed contacts identified by unsupervised PatchCore."
      />

      {/* Main Two-Column Layout matching Sonar Analysis & Evidence Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 of 12 cols): Multi-Modal Viewport Workspace */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs overflow-hidden flex flex-col">
            {/* Viewer Header */}
            <div className="px-4 py-2 border-b border-navy-50 flex items-center bg-white">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-ocean" strokeWidth={2} />
                <h3 className="text-xs font-semibold text-navy">Anomaly Inspection Workspace</h3>
              </div>
            </div>

            {/* Viewer Body: Filmstrip + Central Viewport */}
            <div className="flex flex-row overflow-hidden">
              {/* Left Queue / Filmstrip Column */}
              <div className="w-[105px] bg-slate-50/70 border-r border-navy-50 p-2 space-y-2 select-none flex-shrink-0 flex flex-col items-center">
                <div className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-0.5 text-center">
                  Review Queue
                </div>

                {/* Candidate Thumbnail Card */}
                <div className="w-full cursor-pointer group flex flex-col items-center">
                  <div className="w-full aspect-[4/3] bg-navy-950 rounded-sm overflow-hidden transition-all duration-200 relative ring-2 ring-ocean border border-ocean shadow-xs">
                    <img
                      src={activeCandidate.rawUrl}
                      alt={activeCandidate.name}
                      className="w-full h-full object-cover"
                    />
                    {isReviewed ? (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    ) : (
                      <span className="absolute top-1 right-1 px-1 py-0.2 bg-amber-500 text-[8px] text-white rounded font-bold">
                        NOVEL
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-center font-semibold text-ocean mt-1 w-full truncate" title={activeCandidate.displayId || 'Image 3'}>
                    {activeCandidate.displayId || 'Image 3'}
                  </span>
                  <span className="text-[9px] text-navy-400 font-mono text-center">
                    ANO-001
                  </span>
                </div>
              </div>

              {/* Central Sonar Image Viewport */}
              <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center h-[375px]">
                {/* Top View Mode Switcher Pill */}
                <div className="absolute top-2.5 inset-x-3 flex items-center justify-center pointer-events-none select-none z-20">
                  <div className="pointer-events-auto bg-white border border-navy-100 rounded-md shadow-xs p-0.5 flex items-center gap-1">
                    <button
                      onClick={handlePrevMode}
                      className="w-5 h-5 flex items-center justify-center rounded text-navy-400 hover:text-navy hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Previous View"
                      aria-label="Previous View"
                    >
                      <ChevronLeft size={12} strokeWidth={2} />
                    </button>

                    <div className="flex items-center gap-0.5">
                      {VIEW_OPTIONS.map((mode) => {
                        const isActive = activeView === mode.id;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => setActiveView(mode.id)}
                            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-navy text-white font-semibold shadow-xs'
                                : 'text-navy-500 hover:text-navy hover:bg-slate-50 font-medium'
                            }`}
                          >
                            {mode.label}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleNextMode}
                      className="w-5 h-5 flex items-center justify-center rounded text-navy-400 hover:text-navy hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Next View"
                      aria-label="Next View"
                    >
                      <ChevronRight size={12} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Scaled Sonar Display Canvas with Comfortable Spacing */}
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200 relative pt-11 pb-9 px-4"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={currentImageUrl}
                    alt={currentView.label}
                    className="max-h-full max-w-full object-contain select-none"
                  />
                </div>

                {/* Bottom Toolbar: Zoom & Download */}
                <div className="absolute bottom-2 inset-x-3 flex items-center justify-between pointer-events-none select-none z-10">
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

                  <a
                    href={currentImageUrl}
                    download={`human_review_${activeView}.png`}
                    className="pointer-events-auto px-2.5 py-1.5 bg-white border border-navy-100 text-navy hover:text-ocean hover:bg-slate-50 rounded-md shadow-xs text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download Current Asset"
                  >
                    <Download size={13} />
                    <span>Download Scan</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 of 12 cols): Decision Console & Inspector */}
        <div className="lg:col-span-5 space-y-2.5">
          {/* Card 1: Human Classification Decision & Verification Notes */}
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs p-3.5 space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-navy-50">
              <User size={15} className="text-ocean" strokeWidth={2} />
              <h3 className="text-xs font-semibold text-navy">Classification Decision</h3>
            </div>

            {/* Prominent, Beautiful Decision Status Banner */}
            {activeCandidate.decision === 'confirmed' ? (
              <div className="py-1.5 px-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Verified Classification
                    </span>
                    <span className="text-xs font-bold text-emerald-950">
                      Confirmed Debris • {activeCandidate.confirmedClass || 'Shipwreck'}
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900 font-mono text-[9px] font-bold">
                  VERIFIED
                </span>
              </div>
            ) : activeCandidate.decision === 'natural' ? (
              <div className="py-1.5 px-3 bg-sky-50/80 border border-sky-200 rounded-lg flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-ocean text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Leaf size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-sky-800 uppercase tracking-wider block">
                      Verified Classification
                    </span>
                    <span className="text-xs font-bold text-navy">
                      Natural Seabed Formation
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-sky-200/60 text-sky-900 font-mono text-[9px] font-bold">
                  NON-DEBRIS
                </span>
              </div>
            ) : activeCandidate.decision === 'further-review' || activeCandidate.decision === 'false-positive' ? (
              <div className="py-1.5 px-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <HelpCircle size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">
                      Verified Classification
                    </span>
                    <span className="text-xs font-bold text-amber-950">
                      Further Review Required
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900 font-mono text-[9px] font-bold">
                  UNDER REVIEW
                </span>
              </div>
            ) : (
              <div className="py-1.5 px-3 bg-slate-50 border border-navy-100 rounded-lg flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Clock size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-navy-400 uppercase tracking-wider block">
                      Operator Sign-off Status
                    </span>
                    <span className="text-xs font-bold text-navy">
                      Awaiting Human Classification
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[9px] font-bold">
                  UNREVIEWED
                </span>
              </div>
            )}

            {/* Decision Buttons Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {/* 1. Confirm Debris */}
              <button
                type="button"
                onClick={() => handleDecision('confirmed')}
                className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCandidate.decision === 'confirmed'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400 font-bold'
                    : 'border border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="Confirm as Anthropogenic Debris (Click to choose class)"
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <Check size={14} strokeWidth={2.5} />
                  {activeCandidate.decision === 'confirmed' && (
                    <ChevronDown
                      size={11}
                      className={`transition-transform duration-200 ${
                        isClassListOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
                <span>Confirm Debris</span>
              </button>

              {/* 2. Mark Natural */}
              <button
                type="button"
                onClick={() => handleDecision('natural')}
                className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCandidate.decision === 'natural'
                    ? 'bg-ocean text-white shadow-xs ring-2 ring-ocean-300 font-bold'
                    : 'border border-sky-200 bg-sky-50/70 text-sky-800 hover:bg-sky-100'
                }`}
              >
                <Leaf size={14} strokeWidth={2.5} className="mb-0.5" />
                <span>Mark Natural</span>
              </button>

              {/* 3. Further Review */}
              <button
                type="button"
                onClick={() => handleDecision('further-review')}
                className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCandidate.decision === 'further-review' || activeCandidate.decision === 'false-positive'
                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400 font-bold'
                    : 'border border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <HelpCircle size={14} strokeWidth={2.5} className="mb-0.5" />
                <span>Further Review</span>
              </button>
            </div>

            {/* Class Selection List Underneath Confirm Debris */}
            {isClassListOpen && activeCandidate.decision === 'confirmed' && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag size={11} className="text-emerald-700" />
                    Select Debris Class
                  </span>
                  {activeCandidate.confirmedClass && (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-200/80">
                      Active: {activeCandidate.confirmedClass}
                    </span>
                  )}
                </div>

                {/* 5 Current Classes + Custom Class */}
                <div className="grid grid-cols-2 gap-1.5">
                  {PREDEFINED_CLASSES.map((cls) => {
                    const isSelected = !isCustomSelected && activeCandidate.confirmedClass === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleSelectPredefinedClass(cls)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs font-semibold ring-1 ring-emerald-500'
                            : 'bg-white hover:bg-emerald-100/70 text-navy-800 border border-navy-100 hover:border-emerald-200'
                        }`}
                      >
                        <span className="truncate">{cls}</span>
                        {isSelected && <Check size={12} strokeWidth={2.5} className="flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })}

                  {/* Custom Class Button */}
                  <button
                    type="button"
                    onClick={handleSelectCustomClass}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      isCustomSelected
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold ring-1 ring-emerald-500'
                        : 'bg-white hover:bg-emerald-100/70 text-navy-800 border border-navy-100 hover:border-emerald-200'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <Plus size={11} className={isCustomSelected ? 'text-white' : 'text-emerald-700'} />
                      Custom Class
                    </span>
                    {isCustomSelected && <Check size={12} strokeWidth={2.5} className="flex-shrink-0 ml-1" />}
                  </button>
                </div>

                {/* Custom Class Input Field */}
                {isCustomSelected && (
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={customClassText}
                        onChange={(e) => handleCustomClassTextChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCustomClass();
                          }
                        }}
                        placeholder="Type custom class name..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-md text-navy outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-navy-300"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomClass}
                        disabled={!customClassText.trim()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Apply Custom Class"
                      >
                        <Check size={12} strokeWidth={2.5} />
                        <span>Apply</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-navy-400 block pl-0.5">
                      Press <strong>Apply</strong> or <strong>Enter</strong> to set class.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Integrated Analyst Observations / Verification Notes */}
            <div className="pt-2 border-t border-navy-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-navy font-semibold text-xs">
                  <MessageSquare size={13} className="text-ocean" strokeWidth={2} />
                  <span>Verification Notes & Observations</span>
                </div>
                <span className="text-[10px] text-navy-400 font-mono">
                  {noteText.length}/300
                </span>
              </div>

              <textarea
                value={noteText}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Record operational rationale, acoustic shadow details, or seabed context..."
                className="w-full min-h-[54px] h-[54px] p-2 text-xs text-navy bg-slate-50 border border-navy-100 rounded-lg resize-none outline-none focus:border-ocean focus:bg-white transition-all placeholder:text-navy-300 leading-relaxed"
              />

              {/* Save & Reset Actions */}
              <div className="flex items-center justify-end gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleResetNotes}
                  disabled={!noteText}
                  className="px-2.5 py-1 rounded-md border border-navy-200 bg-white hover:bg-slate-50 text-navy-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset / Clear Notes"
                >
                  <RotateCcw size={12} className="text-navy-400" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                    isSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-ocean hover:bg-ocean-600 text-white'
                  }`}
                  title="Save Notes"
                >
                  {isSaved ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : (
                    <Save size={12} />
                  )}
                  <span>{isSaved ? 'Saved!' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Candidate Telemetry & Geolocation */}
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs p-3 space-y-1.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-navy-50">
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="text-ocean" strokeWidth={2} />
                <h3 className="text-xs font-semibold text-navy">Candidate Telemetry</h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <MapPin size={10} /> Geo-referenced
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="p-1.5 rounded bg-slate-50 border border-navy-50">
                <span className="text-[9px] text-navy-400 font-medium block">Coordinates</span>
                <span className="font-semibold text-navy font-mono text-[11px]">{activeCandidate.coordinates}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-navy-50">
                <span className="text-[9px] text-navy-400 font-medium block">Estimated Depth</span>
                <span className="font-semibold text-navy font-mono text-[11px]">{activeCandidate.depth}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-navy-50">
                <span className="text-[9px] text-navy-400 font-medium block">Pixel Resolution</span>
                <span className="font-semibold text-navy font-mono text-[11px]">{activeCandidate.pixelScale}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-navy-50">
                <span className="text-[9px] text-navy-400 font-medium block">Anomaly Status</span>
                <span className="font-semibold text-amber-700 text-[11px]">Out-of-Distribution</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-navy-100/60">
        <button
          onClick={() => navigate('/evidence-intelligence')}
          className="px-3.5 py-1.5 bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 text-ocean rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} />
          Back to Evidence Intelligence
        </button>

        <button
          onClick={() => navigate('/debris-hotspots')}
          className="px-4 py-1.5 bg-navy hover:bg-ocean text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
        >
          <span>Continue to Debris Hotspots</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
