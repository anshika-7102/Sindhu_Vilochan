import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Box,
  Sun,
  Mountain,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ImageOff,
  ShieldCheck,
  X,
  Filter,
  Calculator,
  Layers,
  Activity,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { usePipeline } from '@/context/PipelineContext';
import LayerEmptyState from '@/components/LayerEmptyState';

export interface ClassFormulaDefinition {
  classKey: 'plane' | 'shipwreck' | 'pipe' | 'ghostnet' | 'crabpot';
  title: string;
  equation: string;
  variableForm: string;
  weights: {
    c_ai: number;
    s_shape: number;
    s_shadow: number;
    s_context: number;
  };
  note?: string;
  shadowNote?: string;
}

export const CLASS_FORMULAS: Record<string, ClassFormulaDefinition> = {
  shipwreck: {
    classKey: 'shipwreck',
    title: 'Shipwreck',
    equation: 'R_shipwreck = 100 × (0.50 · C_AI + 0.25 · S_shape + 0.15 · S_shadow + 0.10 · S_context)',
    variableForm: 'R_shipwreck = 100 × (0.50 C_AI + 0.25 S_shape + 0.15 S_shadow + 0.10 S_context)',
    weights: { c_ai: 0.50, s_shape: 0.25, s_shadow: 0.15, s_context: 0.10 },
  },
  crabpot: {
    classKey: 'crabpot',
    title: 'Crab Pot',
    equation: 'R_crabpot = 100 × (0.50 · C_AI + 0.25 · S_shape + 0.20 · S_shadow + 0.05 · S_context)',
    variableForm: 'R_crabpot = 100 × (0.50 C_AI + 0.25 S_shape + 0.20 S_shadow + 0.05 S_context)',
    weights: { c_ai: 0.50, s_shape: 0.25, s_shadow: 0.20, s_context: 0.05 },
  },
  plane: {
    classKey: 'plane',
    title: 'Plane',
    equation: 'R_plane = 100 × (0.50 · C_AI + 0.25 · S_shape + 0.15 · S_shadow + 0.10 · S_context)',
    variableForm: 'R_plane = 100 × (0.50 C_AI + 0.25 S_shape + 0.15 S_shadow + 0.10 S_context)',
    weights: { c_ai: 0.50, s_shape: 0.25, s_shadow: 0.15, s_context: 0.10 },
  },
  pipe: {
    classKey: 'pipe',
    title: 'Pipe',
    equation: 'R_pipe = 100 × (0.50 · C_AI + 0.30 · S_shape + 0.10 · S_shadow + 0.10 · S_context)',
    variableForm: 'R_pipe = 100 × (0.50 C_AI + 0.30 S_shape + 0.10 S_shadow + 0.10 S_context)',
    weights: { c_ai: 0.50, s_shape: 0.30, s_shadow: 0.10, s_context: 0.10 },
  },
  ghostnet: {
    classKey: 'ghostnet',
    title: 'Ghost Net',
    equation: 'R_ghostnet = 100 × (0.50 · C_AI + 0.10 · S_shape + 0.40 · S_context)',
    variableForm: 'R_ghostnet = 100 × (0.50 C_AI + 0.10 S_shape + 0.40 S_context)',
    weights: { c_ai: 0.50, s_shape: 0.10, s_shadow: 0.00, s_context: 0.40 },
    note: 'Shadow weight = 0 (Porous polymer mesh does not cast acoustic shadows)',
    shadowNote: 'This property is not defined for this class (Shadow weight = 0)',
  },
};

interface AuthenticEvidenceItem {
  id: string;
  name: string;
  displayName: string;
  className: string;
  classKey: 'plane' | 'shipwreck' | 'pipe' | 'ghostnet' | 'crabpot';
  category: 'pipes' | 'wrecks' | 'fishing';
  confidence: number;
  color: 'blue' | 'red' | 'yellow' | 'emerald';
  bboxUrl: string | null;
  rawUrl: string;
  preprocessedUrl: string | null;
  segmentationUrl: string | null;
  shapeUrl: string | null;
  shadowUrl: string | null;
  contextUrl: string | null;
  patchcoreUrl: string | null;
  c_ai: number;
  s_shape: number;
  s_shadow: number | null;
  s_context: number;
  shadowChecklist: { text: string; present: boolean }[];
  contextChecklist: { text: string; present: boolean }[];
  reliability: string;
  reliabilitySub: string;
}

// 10 authentic detected targets, sorted in priority sequence matching Layer 02
const AUTHENTIC_BBOX_EVIDENCE_ITEMS: AuthenticEvidenceItem[] = [
  // 1. Shipwreck (Canonical)
  {
    id: 'ev-shipwreck',
    name: 'shipwreck.png',
    displayName: 'Image 1',
    className: 'Shipwreck',
    classKey: 'shipwreck',
    category: 'wrecks',
    confidence: 0.97,
    color: 'blue',
    bboxUrl: '/bbox/shipwreck.png',
    rawUrl: '/raw/shipwreck.png',
    preprocessedUrl: '/pre-processed/shipwreck.png',
    segmentationUrl: '/bbox+mask/shipwreck.png',
    shapeUrl: '/shape/shipwreck.png',
    shadowUrl: '/shadow/shipwreck.png',
    contextUrl: '/context/shipwreck.png',
    patchcoreUrl: '/PatchCore/shipwreck.png',
    c_ai: 0.97,
    s_shape: 0.94,
    s_shadow: 0.91,
    s_context: 0.88,
    shadowChecklist: [
      { text: 'Continuous high-relief shadow penumbra', present: true },
      { text: 'Acoustic blockage matches sonar flight path', present: true },
      { text: 'Prominent hull shadow casting on starboard swath', present: true },
    ],
    contextChecklist: [
      { text: 'Major acoustic backscatter contrast vs seabed', present: true },
      { text: 'Localized seabed scour along hull base', present: true },
      { text: 'Perimeter debris scattering confirmed', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Marine Wreck',
  },

  // 2. Ghost Net
  {
    id: 'ev-ghostnet',
    name: 'ghostnet.jpeg',
    displayName: 'Image 2',
    className: 'Ghost Net',
    classKey: 'ghostnet',
    category: 'fishing',
    confidence: 0.98,
    color: 'blue',
    bboxUrl: '/bbox/ghostnet.png',
    rawUrl: '/raw/ghostnet.jpeg',
    preprocessedUrl: '/pre-processed/ghostnet.png',
    segmentationUrl: '/bbox+mask/ghostnet.png',
    shapeUrl: '/shape/ghostnet.png',
    shadowUrl: null, // Zero shadow weight: porous mesh allows acoustic transmission
    contextUrl: '/context/ghostnet.png',
    patchcoreUrl: '/PatchCore/ghostnet.png',
    c_ai: 0.98,
    s_shape: 0.91,
    s_shadow: null,
    s_context: 0.88,
    shadowChecklist: [
      { text: 'This property is not defined for this class', present: false },
      { text: 'Shadow weight = 0 in reliability formula', present: true },
      { text: 'Acoustically porous polymer mesh structure', present: true },
    ],
    contextChecklist: [
      { text: 'Traps shell fragments and seabed silt', present: true },
      { text: 'Distinct fibrous acoustic texture pattern', present: true },
      { text: 'Diffuse acoustic scattering over sandy floor', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Entangled Marine Litter',
  },


  // 4. Subsea Pipeline
  {
    id: 'ev-pipe',
    name: 'pipe.jpeg',
    displayName: 'Image 5',
    className: 'Pipe',
    classKey: 'pipe',
    category: 'pipes',
    confidence: 0.96,
    color: 'blue',
    bboxUrl: '/bbox/pipe.png',
    rawUrl: '/raw/pipe.jpeg',
    preprocessedUrl: '/pre-processed/pipe.png',
    segmentationUrl: '/bbox+mask/pipe.png',
    shapeUrl: '/shape/pipe.png',
    shadowUrl: '/shadow/pipe.png',
    contextUrl: '/context/pipe.png',
    patchcoreUrl: '/PatchCore/pipe.png',
    c_ai: 0.96,
    s_shape: 0.92,
    s_shadow: 0.88,
    s_context: 0.85,
    shadowChecklist: [
      { text: 'Clear linear acoustic shadow detected', present: true },
      { text: 'Consistent with sonar grazing angle', present: true },
      { text: 'Continuous geometry-consistent shadow penumbra', present: true },
    ],
    contextChecklist: [
      { text: 'Distinct raised cylindrical profile above seabed', present: true },
      { text: 'High metallic acoustic backscatter response', present: true },
      { text: 'Stable linear seafloor corridor', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Subsea Infrastructure',
  },

  // 5. Pipe 1
  {
    id: 'ev-pipe1',
    name: 'pipe1.jpeg',
    displayName: 'Image 6',
    className: 'Pipe',
    classKey: 'pipe',
    category: 'pipes',
    confidence: 0.97,
    color: 'blue',
    bboxUrl: '/bbox/pipe1.png',
    rawUrl: '/raw/pipe1.jpeg',
    preprocessedUrl: '/pre-processed/pipe1.png',
    segmentationUrl: '/bbox+mask/pipe1.png',
    shapeUrl: '/shape/pipe1.png',
    shadowUrl: '/shadow/pipe1.png',
    contextUrl: '/context/pipe1.png',
    patchcoreUrl: '/PatchCore/pipe1.png',
    c_ai: 0.97,
    s_shape: 0.91,
    s_shadow: 0.86,
    s_context: 0.84,
    shadowChecklist: [
      { text: 'Elongated shadow trail verified', present: true },
      { text: 'Conduit elevation confirmed via grazing angle', present: true },
      { text: 'Sharp acoustic cutoff boundary into starboard swath', present: true },
    ],
    contextChecklist: [
      { text: 'Raised above sand ripple bed', present: true },
      { text: 'High specular acoustic reflectance', present: true },
      { text: 'Continuous linear trajectory', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Subsea Infrastructure',
  },

  // 6. Plane
  {
    id: 'ev-plane',
    name: 'plane.jpg',
    displayName: 'Image 7',
    className: 'Plane',
    classKey: 'plane',
    category: 'wrecks',
    confidence: 0.98,
    color: 'blue',
    bboxUrl: '/bbox/plane.png',
    rawUrl: '/raw/plane.jpg',
    preprocessedUrl: '/pre-processed/plane.png',
    segmentationUrl: '/bbox+mask/plane.png',
    shapeUrl: '/shape/plane.png',
    shadowUrl: '/shadow/plane.png',
    contextUrl: '/context/plane.png',
    patchcoreUrl: '/PatchCore/plane.png',
    c_ai: 0.98,
    s_shape: 0.93,
    s_shadow: 0.89,
    s_context: 0.86,
    shadowChecklist: [
      { text: 'Fuselage acoustic shadow zone confirmed', present: true },
      { text: 'Geometric aspect matches airframe silhouette', present: true },
      { text: 'Trailing acoustic penumbra matches towfish heading', present: true },
    ],
    contextChecklist: [
      { text: 'Strong specular metallic backscatter', present: true },
      { text: 'Distinct seabed scour line along impact zone', present: true },
      { text: 'Contrasting roughness vs surrounding sediment', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Airframe Wreck',
  },

  // 7. Plane 1
  {
    id: 'ev-plane1',
    name: 'plane1.jpg',
    displayName: 'Image 8',
    className: 'Plane',
    classKey: 'plane',
    category: 'wrecks',
    confidence: 0.95,
    color: 'blue',
    bboxUrl: '/bbox/plane1.png',
    rawUrl: '/raw/plane1.jpg',
    preprocessedUrl: '/pre-processed/plane1.png',
    segmentationUrl: '/bbox+mask/plane1.png',
    shapeUrl: '/shape/plane1.png',
    shadowUrl: '/shadow/plane1.png',
    contextUrl: '/context/plane1.png',
    patchcoreUrl: '/PatchCore/plane1.jpeg',
    c_ai: 0.95,
    s_shape: 0.90,
    s_shadow: 0.85,
    s_context: 0.83,
    shadowChecklist: [
      { text: 'Wing acoustic shadow geometry confirmed', present: true },
      { text: 'Elevation above seabed matches acoustic shadow length', present: true },
      { text: 'Shadow orientation aligned to port track', present: true },
    ],
    contextChecklist: [
      { text: 'Wing section resting flat on sandy shelf', present: true },
      { text: 'High metallic acoustic signature', present: true },
      { text: 'Distinct boundary with minimal sedimentation', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Airframe Wreck',
  },

  // 8. Crab Pot
  {
    id: 'ev-crabpot',
    name: 'crabpot.jpg',
    displayName: 'Image 9',
    className: 'Crab Pot',
    classKey: 'crabpot',
    category: 'fishing',
    confidence: 0.96,
    color: 'blue',
    bboxUrl: '/bbox/crabpot.png',
    rawUrl: '/raw/crabpot.jpg',
    preprocessedUrl: '/pre-processed/crabpot.png',
    segmentationUrl: '/bbox+mask/crabpot.png',
    shapeUrl: '/shape/crabpot.png',
    shadowUrl: '/shadow/crabpot.png',
    contextUrl: '/context/crabpot.png',
    patchcoreUrl: '/PatchCore/crabpot.png',
    c_ai: 0.96,
    s_shape: 0.88,
    s_shadow: 0.84,
    s_context: 0.82,
    shadowChecklist: [
      { text: 'Compact discrete trap shadow verified', present: true },
      { text: 'Acoustic penumbra matches cage geometry', present: true },
      { text: 'Low-profile cage elevation above seabed', present: true },
    ],
    contextChecklist: [
      { text: 'Discrete item resting on silt bed', present: true },
      { text: 'Acoustic contrast against mud substrate', present: true },
      { text: 'Confirmed commercial gear signature', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Derelict Fishing Trap',
  },

  // 9. Shipwreck 2
  {
    id: 'ev-shipwreck2',
    name: 'shipwreck2.png',
    displayName: 'Image 10',
    className: 'Shipwreck',
    classKey: 'shipwreck',
    category: 'wrecks',
    confidence: 0.97,
    color: 'blue',
    bboxUrl: '/bbox/shipwreck2.png',
    rawUrl: '/raw/shipwreck2.png',
    preprocessedUrl: '/pre-processed/shipwreck2.png',
    segmentationUrl: '/bbox+mask/shipwreck2.png',
    shapeUrl: '/shape/shipwreck2.png',
    shadowUrl: '/shadow/shipwreck2.png',
    contextUrl: '/context/shipwreck2.png',
    patchcoreUrl: '/PatchCore/shipwreck2.png',
    c_ai: 0.97,
    s_shape: 0.94,
    s_shadow: 0.91,
    s_context: 0.88,
    shadowChecklist: [
      { text: 'Large hull acoustic silhouette confirmed', present: true },
      { text: 'Prominent hull shadow in swath', present: true },
      { text: 'Shadow orientation aligned to track', present: true },
    ],
    contextChecklist: [
      { text: 'Extreme acoustic contrast vs sand', present: true },
      { text: 'Massive artificial seabed anomaly', present: true },
      { text: 'Debris scattering around periphery', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Marine Wreck',
  },

  // 10. Shipwreck 3
  {
    id: 'ev-shipwreck3',
    name: 'shipwreck3.jpeg',
    displayName: 'Image 11',
    className: 'Shipwreck',
    classKey: 'shipwreck',
    category: 'wrecks',
    confidence: 0.96,
    color: 'blue',
    bboxUrl: '/bbox/shipwreck3.png',
    rawUrl: '/raw/shipwreck3.jpeg',
    preprocessedUrl: '/pre-processed/shipwreck3.png',
    segmentationUrl: '/bbox+mask/shipwreck3.png',
    shapeUrl: '/shape/shipwreck3.png',
    shadowUrl: '/shadow/shipwreck3.png',
    contextUrl: '/context/shipwreck.png',
    patchcoreUrl: '/PatchCore/shipwreck3.png',
    c_ai: 0.96,
    s_shape: 0.91,
    s_shadow: 0.88,
    s_context: 0.85,
    shadowChecklist: [
      { text: 'Hull fragment acoustic shadow confirmed', present: true },
      { text: 'Raw acoustic penumbra visible in swath', present: true },
      { text: 'Shadow orientation aligned to track', present: true },
    ],
    contextChecklist: [
      { text: 'Clear demarcation from seabed', present: true },
      { text: 'High acoustic return energy', present: true },
      { text: 'Isolated wreckage fragment', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Marine Wreck',
  },
];

// Renders formal mathematical equation with proper scientific subscripts (no underscores)
function renderFormulaEquation(def: ClassFormulaDefinition) {
  const { classKey, weights } = def;
  return (
    <div className="flex items-center flex-wrap gap-1 text-xs text-navy font-sans leading-relaxed">
      <span className="font-bold text-navy-900">
        R<sub className="text-[10px] font-normal text-navy-600">{classKey}</sub>
      </span>
      <span className="text-navy-400 font-normal">=</span>
      <span className="font-medium text-navy-800">100 × (</span>

      <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-navy-100/70 shadow-2xs">
        <span className="font-mono text-ocean-700 font-bold">{weights.c_ai.toFixed(2)}</span>
        <span className="text-navy-300">·</span>
        <span className="font-medium text-navy-800">C<sub className="text-[9px] font-normal text-navy-500">AI</sub></span>
      </span>

      {weights.s_shape > 0 && (
        <>
          <span className="text-navy-400 font-normal">+</span>
          <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-navy-100/70 shadow-2xs">
            <span className="font-mono text-ocean-700 font-bold">{weights.s_shape.toFixed(2)}</span>
            <span className="text-navy-300">·</span>
            <span className="font-medium text-navy-800">S<sub className="text-[9px] font-normal text-navy-500">shape</sub></span>
          </span>
        </>
      )}

      {weights.s_shadow > 0 && (
        <>
          <span className="text-navy-400 font-normal">+</span>
          <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-navy-100/70 shadow-2xs">
            <span className="font-mono text-ocean-700 font-bold">{weights.s_shadow.toFixed(2)}</span>
            <span className="text-navy-300">·</span>
            <span className="font-medium text-navy-800">S<sub className="text-[9px] font-normal text-navy-500">shadow</sub></span>
          </span>
        </>
      )}

      <span className="text-navy-400 font-normal">+</span>
      <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-navy-100/70 shadow-2xs">
        <span className="font-mono text-ocean-700 font-bold">{weights.s_context.toFixed(2)}</span>
        <span className="text-navy-300">·</span>
        <span className="font-medium text-navy-800">S<sub className="text-[9px] font-normal text-navy-500">context</sub></span>
      </span>

      <span className="font-medium text-navy-800">)</span>
    </div>
  );
}

// Renders numerical substitution values with clear math notation (no truncate, no underscores)
function renderNumericalSubstitution(item: AuthenticEvidenceItem, def: ClassFormulaDefinition, computedPercentage: number) {
  const { weights } = def;
  return (
    <div className="flex items-center flex-wrap gap-1 text-[11px] text-navy-700 font-sans leading-relaxed">
      <span className="font-medium text-navy-500">100 × (</span>

      <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-navy-100/70 shadow-2xs">
        <span className="font-mono text-navy-500">{weights.c_ai.toFixed(2)}</span>
        <span className="text-navy-300">×</span>
        <span className="font-mono font-bold text-ocean-700">{item.c_ai.toFixed(2)}</span>
      </span>

      {weights.s_shape > 0 && (
        <>
          <span className="text-navy-400">+</span>
          <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-navy-100/70 shadow-2xs">
            <span className="font-mono text-navy-500">{weights.s_shape.toFixed(2)}</span>
            <span className="text-navy-300">×</span>
            <span className="font-mono font-bold text-ocean-700">{item.s_shape.toFixed(2)}</span>
          </span>
        </>
      )}

      {weights.s_shadow > 0 && (
        <>
          <span className="text-navy-400">+</span>
          <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-navy-100/70 shadow-2xs">
            <span className="font-mono text-navy-500">{weights.s_shadow.toFixed(2)}</span>
            <span className="text-navy-300">×</span>
            <span className="font-mono font-bold text-ocean-700">{(item.s_shadow ?? 0).toFixed(2)}</span>
          </span>
        </>
      )}

      <span className="text-navy-400">+</span>
      <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-navy-100/70 shadow-2xs">
        <span className="font-mono text-navy-500">{weights.s_context.toFixed(2)}</span>
        <span className="text-navy-300">×</span>
        <span className="font-mono font-bold text-ocean-700">{item.s_context.toFixed(2)}</span>
      </span>

      <span className="font-medium text-navy-500">)</span>
      <span className="text-navy-400">=</span>
      <span className="font-bold text-emerald-600 text-xs font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
        {computedPercentage.toFixed(1)}%
      </span>
    </div>
  );
}

export default function EvidenceIntelligence() {
  const navigate = useNavigate();
  const { pipelineState } = usePipeline();
  const isProcessed = pipelineState !== 'idle';

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'pipes' | 'wrecks' | 'fishing' | 'anomaly'>('all');

  // Currently selected item from filmstrip (defaults to first item: shipwreck)
  const [selectedId, setSelectedId] = useState<string>('ev-shipwreck');

  // Canvas View Mode: [ Evidence View ] is default
  const [viewMode, setViewMode] = useState<
    'evidence' | 'shadow' | 'segmentation' | 'context' | 'enhanced'
  >('evidence');

  const EVIDENCE_MODES: Array<'evidence' | 'shadow' | 'segmentation' | 'context' | 'enhanced'> = [
    'evidence',
    'shadow',
    'segmentation',
    'context',
    'enhanced',
  ];

  const handlePrevMode = () => {
    const currentIndex = EVIDENCE_MODES.indexOf(viewMode);
    const prevIndex = (currentIndex - 1 + EVIDENCE_MODES.length) % EVIDENCE_MODES.length;
    setViewMode(EVIDENCE_MODES[prevIndex]);
  };

  const handleNextMode = () => {
    const currentIndex = EVIDENCE_MODES.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % EVIDENCE_MODES.length;
    setViewMode(EVIDENCE_MODES[nextIndex]);
  };

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Lightbox modal for clicking Shadow, Segmentation, or Context thumbnails
  const [expandedModal, setExpandedModal] = useState<{
    isOpen: boolean;
    title: string;
    imageUrl: string;
    modality: string;
    score: number;
    checklist: { text: string; present: boolean }[];
  } | null>(null);

  // Class Formulas Reference Modal State
  const [showAllFormulasModal, setShowAllFormulasModal] = useState<boolean>(false);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedModal(null);
        setShowAllFormulasModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered items based on category
  const filteredItems = AUTHENTIC_BBOX_EVIDENCE_ITEMS.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.category === categoryFilter;
  });

  // Current active asset item
  const activeIndex = AUTHENTIC_BBOX_EVIDENCE_ITEMS.findIndex((i) => i.id === selectedId);
  const activeItem =
    activeIndex !== -1
      ? AUTHENTIC_BBOX_EVIDENCE_ITEMS[activeIndex]
      : AUTHENTIC_BBOX_EVIDENCE_ITEMS[0];

  // Mathematical Reliability Calculation using the authentic class-specific formulas
  const calculateReliability = (item: AuthenticEvidenceItem) => {
    const formulaDef = CLASS_FORMULAS[item.classKey] || CLASS_FORMULAS.shipwreck;
    const { c_ai, s_shape, s_shadow, s_context } = formulaDef.weights;

    const termCAI = c_ai * item.c_ai;
    const termShape = s_shape * item.s_shape;
    const termShadow = s_shadow * (item.s_shadow ?? 0);
    const termContext = s_context * item.s_context;

    const sum = termCAI + termShape + termShadow + termContext;
    const computedPercentage = Math.round(100 * sum * 10) / 10;

    let substitutedString = '';
    if (item.classKey === 'ghostnet') {
      substitutedString = `100 × (${c_ai.toFixed(2)} · ${item.c_ai.toFixed(2)} + ${s_shape.toFixed(2)} · ${item.s_shape.toFixed(2)} + ${s_context.toFixed(2)} · ${item.s_context.toFixed(2)})`;
    } else {
      substitutedString = `100 × (${c_ai.toFixed(2)} · ${item.c_ai.toFixed(2)} + ${s_shape.toFixed(2)} · ${item.s_shape.toFixed(2)} + ${s_shadow.toFixed(2)} · ${(item.s_shadow ?? 0).toFixed(2)} + ${s_context.toFixed(2)} · ${item.s_context.toFixed(2)})`;
    }

    return {
      formulaDef,
      computedPercentage,
      substitutedString,
      termCAI,
      termShape,
      termShadow,
      termContext,
    };
  };

  const reliabilityData = calculateReliability(activeItem);

  // Steppers for targets
  const handlePrevItem = () => {
    const prevIdx =
      activeIndex > 0 ? activeIndex - 1 : AUTHENTIC_BBOX_EVIDENCE_ITEMS.length - 1;
    setSelectedId(AUTHENTIC_BBOX_EVIDENCE_ITEMS[prevIdx].id);
  };

  const handleNextItem = () => {
    const nextIdx =
      activeIndex < AUTHENTIC_BBOX_EVIDENCE_ITEMS.length - 1 ? activeIndex + 1 : 0;
    setSelectedId(AUTHENTIC_BBOX_EVIDENCE_ITEMS[nextIdx].id);
  };

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Determine what image source to render on the main canvas
  const getCanvasSource = (): {
    url: string | null;
    placeholderTitle: string;
    placeholderDesc: string;
    label: string;
  } => {
    switch (viewMode) {
      case 'shadow':
        return {
          url: activeItem.shadowUrl,
          placeholderTitle: 'Property not defined for this class',
          placeholderDesc: `Shadow weight = 0 in reliability formula for "${activeItem.name}".`,
          label: 'Acoustic Shadow Verification',
        };
      case 'segmentation':
        return {
          url: activeItem.segmentationUrl || activeItem.shapeUrl,
          placeholderTitle: 'No Mask Defined',
          placeholderDesc: `No instance segmentation mask defined for "${activeItem.name}".`,
          label: 'Shape / Segmentation Mask',
        };
      case 'context':
        return {
          url: activeItem.contextUrl,
          placeholderTitle: 'Context ROI Inferred',
          placeholderDesc: `Localized acoustic seafloor ROI for "${activeItem.name}".`,
          label: 'Acoustic Context & Seafloor ROI',
        };
      case 'enhanced':
        return {
          url: activeItem.preprocessedUrl,
          placeholderTitle: 'Property not available',
          placeholderDesc: `No pre-processed acoustic scan available for "${activeItem.name}".`,
          label: 'Pre-Processed Scan',
        };
      case 'evidence':
      default:
        if (activeItem.bboxUrl) {
          return {
            url: activeItem.bboxUrl,
            placeholderTitle: 'Evidence Scan',
            placeholderDesc: `Bounding box scan for "${activeItem.name}".`,
            label: 'BBox Evidence ROI',
          };
        }
        return {
          url: activeItem.preprocessedUrl || activeItem.rawUrl,
          placeholderTitle: 'Evidence Scan',
          placeholderDesc: 'Acoustic survey candidate.',
          label: 'Acoustic Scan',
        };
    }
  };

  const canvasDisplay = getCanvasSource();

  if (!isProcessed) {
    return (
      <div className="pt-1 pb-6 px-6 md:px-8 max-w-7xl mx-auto">
        <PageHeader
          step="STEP 03"
          total="06"
          title="Evidence Intelligence"
          subtitle="Deep multi-modal physical verification fusing acoustic shadow, shape segmentation, and seafloor context into an explainable reliability score."
        />

        <LayerEmptyState
          layerNumber="03"
          layerName="Evidence Intelligence"
          title="Multi-Modal Physical Evidence Not Available"
          description="Acoustic shadow geometry, shape regularity, and contextual divergence calculations require survey ingestion. Please upload your survey dataset in Layer 01 and click Ingest to run the processing pipeline."
          Icon={ShieldCheck}
          hint="Shadow, Shape, and Context evidence fusion will be rendered here once the pipeline is ingested."
        />
      </div>
    );
  }

  return (
    <div className="pt-1 pb-6 px-6 md:px-8 max-w-7xl mx-auto space-y-3">
      {/* Header Bar matching Sonar Analysis */}
      <PageHeader
        step="STEP 03"
        total="06"
        title="Evidence Intelligence"
        subtitle="Deep multi-modal physical verification fusing acoustic shadow, shape segmentation, and seafloor context into an explainable reliability score."
      />

      {/* Target Filtering & Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-navy-100 rounded-xl px-4 py-2.5 shadow-xs">
        {/* Left Side: Target Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 text-xs font-semibold text-navy-400 mr-1.5">
            <Filter size={13} className="text-ocean" />
            <span>Filter:</span>
          </div>

          {[
            { id: 'all', label: 'All Debris (9)' },
            { id: 'wrecks', label: 'Wrecks & Airframes (5)' },
            { id: 'pipes', label: 'Pipelines (2)' },
            { id: 'fishing', label: 'Fishing Gear (2)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-navy text-white font-semibold shadow-xs'
                  : 'text-navy-500 hover:text-navy hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Side: Active Target Stepper & Class Formula Shortcut */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAllFormulasModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-navy-100 bg-white hover:bg-slate-50 text-navy text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            title="View all 5 class reliability formulas"
          >
            <Calculator size={13} className="text-ocean" />
            <span>Class Profiles</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-navy">
            <span className="text-navy-400">
              Target {activeIndex + 1} of {AUTHENTIC_BBOX_EVIDENCE_ITEMS.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevItem}
                className="w-6 h-6 flex items-center justify-center border border-navy-100 rounded text-navy-400 hover:text-navy hover:border-ocean hover:bg-ocean-50/50 transition-colors cursor-pointer"
                title="Previous Target"
                aria-label="Previous Target"
              >
                <ChevronLeft size={13} strokeWidth={2} />
              </button>
              <button
                onClick={handleNextItem}
                className="w-6 h-6 flex items-center justify-center border border-navy-100 rounded text-navy-400 hover:text-navy hover:border-ocean hover:bg-ocean-50/50 transition-colors cursor-pointer"
                title="Next Target"
                aria-label="Next Target"
              >
                <ChevronRight size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 of 12 cols): Large Sonar Evidence Viewer Workspace */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs overflow-hidden flex flex-col">
            {/* Viewer Header */}
            <div className="px-5 py-3 border-b border-navy-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <Target size={18} className="text-ocean" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-navy">Evidence Inspection Viewer</h3>
              </div>
            </div>

            {/* Viewer Body: Filmstrip + Central Viewport */}
            <div className="flex flex-row overflow-hidden border-b border-navy-50">
              {/* Left Filmstrip Column (Strictly Target Items in Priority Order) */}
              <div className="w-[96px] bg-slate-50/70 border-r border-navy-50 p-2 space-y-2.5 max-h-[500px] overflow-y-auto scrollbar-thin select-none flex-shrink-0">
                {filteredItems.map((item) => {
                  const isSelected = item.id === activeItem.id;
                  const thumbSource = item.segmentationUrl || item.bboxUrl || item.rawUrl;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className="cursor-pointer group flex flex-col items-center"
                    >
                      <div
                        className={`w-full aspect-[16/10] bg-navy-950 rounded-sm overflow-hidden transition-all duration-200 relative ${
                          isSelected
                            ? 'ring-2 ring-ocean border border-ocean shadow-xs scale-102'
                            : 'border border-navy-100 opacity-70 group-hover:opacity-100'
                        }`}
                      >
                        <img
                          src={thumbSource}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {item.segmentationUrl && (
                          <span className="absolute top-1 right-1 px-1 py-0.2 bg-emerald-600/90 text-[8px] text-white rounded font-bold">
                            MASK
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] text-center truncate block mt-1 w-full ${
                          isSelected ? 'text-ocean font-semibold' : 'text-navy-400 font-medium'
                        }`}
                        title={item.name}
                      >
                        {item.displayName}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Central Sonar Image Viewport */}
              <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center h-[500px]">
                {/* Top View Mode Switcher */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-center pointer-events-none select-none z-20">
                  <div className="pointer-events-auto bg-white border border-navy-100 rounded-md shadow-xs p-0.5 flex items-center gap-1">
                    <button
                      onClick={handlePrevMode}
                      className="w-6 h-6 flex items-center justify-center rounded text-navy-400 hover:text-navy hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Previous View"
                      aria-label="Previous View"
                    >
                      <ChevronLeft size={13} strokeWidth={2} />
                    </button>

                    <div className="flex items-center gap-0.5">
                      {[
                        { id: 'evidence', label: 'Evidence View' },
                        { id: 'shadow', label: 'Shadow' },
                        { id: 'segmentation', label: 'Shape Mask' },
                        { id: 'context', label: 'Context' },
                        { id: 'enhanced', label: 'Enhanced' },
                      ].map((mode) => {
                        const isActive = viewMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as any)}
                            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
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
                      className="w-6 h-6 flex items-center justify-center rounded text-navy-400 hover:text-navy hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Next View"
                      aria-label="Next View"
                    >
                      <ChevronRight size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Scaled Sonar Display Canvas */}
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200 relative p-4"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {canvasDisplay.url ? (
                    <img
                      src={canvasDisplay.url}
                      alt={activeItem.name}
                      className="max-h-full max-w-full object-contain select-none"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-900/80 rounded-lg border border-dashed border-slate-700 max-w-sm">
                      <ImageOff size={32} className="text-slate-500 mb-2" />
                      <div className="text-xs font-semibold text-white">
                        {canvasDisplay.placeholderTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {canvasDisplay.placeholderDesc}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Toolbar: Zoom & Download */}
                <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-none select-none z-10">
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

                  {canvasDisplay.url && (
                    <a
                      href={canvasDisplay.url}
                      download={activeItem.name}
                      className="pointer-events-auto px-2.5 py-1.5 bg-white border border-navy-100 text-navy hover:text-ocean hover:bg-slate-50 rounded-md shadow-xs text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Download Current Asset"
                    >
                      <Download size={13} />
                      <span>Download Scan</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 of 12 cols): Fusion Reliability Score (TOP) + Evidence Modalities & Formula */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: PROMINENT COMPUTED FUSION RELIABILITY SCORE (MOVED TO TOP!) */}
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs p-5 space-y-4">
            {/* Target Header */}
            <div className="flex items-center justify-between pb-3 border-b border-navy-50">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-ocean" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-navy">Fusion Reliability Score</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded border font-medium text-emerald-800 bg-emerald-50 border-emerald-100">
                {activeItem.reliability}
              </span>
            </div>

            {/* Big Prominent Score Box */}
            <div className="bg-slate-50/70 rounded-lg p-4 border border-navy-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="label-xs text-navy-400 flex items-center gap-1.5">
                    <span>EVALUATED FUSION RELIABILITY</span>
                    <span className="text-[10px] font-semibold text-ocean bg-ocean-50 px-1.5 py-0.2 rounded border border-ocean-100">
                      R<sub>{activeItem.classKey}</sub>
                    </span>
                  </div>
                  <div className="text-xs text-navy-500 font-medium mt-0.5">
                    {activeItem.reliabilitySub}
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-600 tracking-tight">
                  {reliabilityData.computedPercentage.toFixed(1)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(10, reliabilityData.computedPercentage))}%`,
                  }}
                />
              </div>

              {/* 4 Multi-Modal Evidence Component Pills (No underscores, proper subscripts) */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                <div className="bg-white p-2 rounded-lg border border-navy-100 shadow-2xs hover:border-ocean-300 transition-colors">
                  <div className="text-[11px] font-bold text-navy-700">
                    C<sub className="text-[9px] font-normal text-navy-400">AI</sub>
                  </div>
                  <div className="text-[9px] text-navy-400 font-medium mt-0.5">AI Conf</div>
                  <div className="text-xs font-bold text-ocean-700 mt-0.5 font-mono">
                    {(activeItem.c_ai * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-navy-100 shadow-2xs hover:border-ocean-300 transition-colors">
                  <div className="text-[11px] font-bold text-navy-700">
                    S<sub className="text-[9px] font-normal text-navy-400">shape</sub>
                  </div>
                  <div className="text-[9px] text-navy-400 font-medium mt-0.5">Shape Mask</div>
                  <div className="text-xs font-bold text-ocean-700 mt-0.5 font-mono">
                    {activeItem.s_shape > 0 ? `${(activeItem.s_shape * 100).toFixed(0)}%` : 'N/A'}
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-navy-100 shadow-2xs hover:border-ocean-300 transition-colors">
                  <div className="text-[11px] font-bold text-navy-700">
                    S<sub className="text-[9px] font-normal text-navy-400">shadow</sub>
                  </div>
                  <div className="text-[9px] text-navy-400 font-medium mt-0.5">Shadow</div>
                  <div className="text-xs font-bold text-ocean-700 mt-0.5 font-mono">
                    {activeItem.classKey === 'ghostnet'
                      ? 'N/A (w=0)'
                      : activeItem.s_shadow !== null
                      ? `${(activeItem.s_shadow * 100).toFixed(0)}%`
                      : '0%'}
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-navy-100 shadow-2xs hover:border-ocean-300 transition-colors">
                  <div className="text-[11px] font-bold text-navy-700">
                    S<sub className="text-[9px] font-normal text-navy-400">context</sub>
                  </div>
                  <div className="text-[9px] text-navy-400 font-medium mt-0.5">Context</div>
                  <div className="text-xs font-bold text-ocean-700 mt-0.5 font-mono">
                    {(activeItem.s_context * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Formula Calculation Details: Elegant Mathematical Presentation */}
            <div className="bg-white rounded-xl p-3.5 border border-navy-100 shadow-2xs space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-navy-50">
                <div className="flex items-center gap-1.5">
                  <Calculator size={14} className="text-ocean" />
                  <span className="label-xs text-navy-500 font-bold">
                    RELIABILITY FORMULA
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-ocean bg-ocean-50 px-2 py-0.5 rounded border border-ocean-100">
                  {reliabilityData.formulaDef.title}
                </span>
              </div>

              {/* Step 1: Formal Equation with Subscripts */}
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-semibold text-navy-400 tracking-wider">
                  Formal Class Equation
                </div>
                <div className="bg-slate-50/90 rounded-lg p-2.5 border border-navy-100/70">
                  {renderFormulaEquation(reliabilityData.formulaDef)}
                </div>
              </div>

              {/* Step 2: Live Substitution (Clean wrapping, no truncation) */}
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-semibold text-navy-400 tracking-wider">
                  Substituted Evidence & Weighting
                </div>
                <div className="bg-slate-50/70 rounded-lg p-2.5 border border-navy-100/60">
                  {renderNumericalSubstitution(
                    activeItem,
                    reliabilityData.formulaDef,
                    reliabilityData.computedPercentage
                  )}
                </div>
              </div>

              {/* Step 3: Exact Weighted Contributions Breakdown */}
              <div className="pt-2 border-t border-navy-50">
                <div className="text-[10px] uppercase font-semibold text-navy-400 tracking-wider mb-1.5">
                  Component Contributions
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {/* AI Detection Contribution */}
                  <div className="bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-navy-50 flex items-center justify-between">
                    <span className="text-navy-600 flex items-center gap-1 font-medium">
                      <span>C<sub className="text-[9px]">AI</sub></span>
                      <span className="text-navy-400 text-[10px]">
                        ({(reliabilityData.formulaDef.weights.c_ai * 100).toFixed(0)}%)
                      </span>
                    </span>
                    <span className="font-semibold text-ocean-800 font-mono text-xs">
                      +{(reliabilityData.formulaDef.weights.c_ai * activeItem.c_ai * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Shape Contribution */}
                  {reliabilityData.formulaDef.weights.s_shape > 0 && (
                    <div className="bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-navy-50 flex items-center justify-between">
                      <span className="text-navy-600 flex items-center gap-1 font-medium">
                        <span>S<sub className="text-[9px]">shape</sub></span>
                        <span className="text-navy-400 text-[10px]">
                          ({(reliabilityData.formulaDef.weights.s_shape * 100).toFixed(0)}%)
                        </span>
                      </span>
                      <span className="font-semibold text-ocean-800 font-mono text-xs">
                        +{(reliabilityData.formulaDef.weights.s_shape * activeItem.s_shape * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* Shadow Contribution */}
                  {reliabilityData.formulaDef.weights.s_shadow > 0 ? (
                    <div className="bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-navy-50 flex items-center justify-between">
                      <span className="text-navy-600 flex items-center gap-1 font-medium">
                        <span>S<sub className="text-[9px]">shadow</sub></span>
                        <span className="text-navy-400 text-[10px]">
                          ({(reliabilityData.formulaDef.weights.s_shadow * 100).toFixed(0)}%)
                        </span>
                      </span>
                      <span className="font-semibold text-ocean-800 font-mono text-xs">
                        +{(reliabilityData.formulaDef.weights.s_shadow * (activeItem.s_shadow ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ) : activeItem.classKey === 'ghostnet' ? (
                    <div className="bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-100 flex items-center justify-between">
                      <span className="text-amber-800 flex items-center gap-1 text-[10px] font-medium">
                        <span>S<sub className="text-[9px]">shadow</sub></span>
                        <span className="text-amber-600">(Porous)</span>
                      </span>
                      <span className="font-semibold text-amber-700 text-[10px]">
                        Weight = 0
                      </span>
                    </div>
                  ) : null}

                  {/* Context Contribution */}
                  <div className="bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-navy-50 flex items-center justify-between">
                    <span className="text-navy-600 flex items-center gap-1 font-medium">
                      <span>
                        S<sub className="text-[9px]">context</sub>
                      </span>
                      <span className="text-navy-400 text-[10px]">
                        ({(reliabilityData.formulaDef.weights.s_context * 100).toFixed(0)}%)
                      </span>
                    </span>
                    <span className="font-semibold text-ocean-800 font-mono text-xs">
                      +{(reliabilityData.formulaDef.weights.s_context * activeItem.s_context * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Final Total Row */}
                <div className="mt-2.5 pt-2 border-t border-navy-100/60 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-navy">
                    Synthesized Reliability Score:
                  </span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">
                    {reliabilityData.computedPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons matching Sonar Analysis */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-navy-100/60">
        <button
          onClick={() => navigate('/sonar-analysis')}
          className="px-4 py-2 bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 text-ocean rounded-md text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Sonar Analysis
        </button>

        <button
          onClick={() => navigate('/human-review')}
          className="px-5 py-2.5 bg-navy hover:bg-ocean text-white rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm group"
        >
          <span>Continue to Human Review</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Lightbox Modal for Full-Resolution Modality Inspection */}
      {expandedModal && expandedModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setExpandedModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-xl border border-navy-100 max-h-[92vh] flex flex-col justify-between overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-navy-50">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-ocean" strokeWidth={2} />
                <div>
                  <h3 className="text-sm font-semibold text-navy">
                    {expandedModal.title}
                  </h3>
                  <p className="text-xs text-navy-400 mt-0.5">
                    Modality: {expandedModal.modality} • Score: {expandedModal.score.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setExpandedModal(null)}
                className="p-1.5 rounded-md text-navy-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Viewport */}
            <div className="py-4 flex-1 overflow-hidden flex items-center justify-center bg-black rounded-lg border border-navy-100 relative min-h-[380px]">
              <img
                src={expandedModal.imageUrl}
                alt={expandedModal.title}
                className="max-h-[58vh] max-w-full object-contain select-none shadow-lg"
              />
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-navy-50 flex items-center justify-between text-xs text-navy-500">
              <span>Normalized Acoustic Evidence Score: <strong className="text-emerald-600 font-semibold">{expandedModal.score.toFixed(2)}</strong></span>
              <div className="flex items-center gap-2">
                <a
                  href={expandedModal.imageUrl}
                  download={`${activeItem.name}_${expandedModal.modality.replace(/\s+/g, '_').toLowerCase()}.png`}
                  className="px-3.5 py-1.5 border border-navy-200 hover:bg-slate-50 rounded-md text-xs font-semibold text-navy flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  Download Image
                </a>
                <button
                  onClick={() => setExpandedModal(null)}
                  className="px-4 py-1.5 bg-navy hover:bg-ocean text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Formulas Reference Modal */}
      {showAllFormulasModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAllFormulasModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl border border-navy-100 max-h-[90vh] flex flex-col justify-between overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-navy-50">
              <div className="flex items-center gap-2.5">
                <Calculator size={18} className="text-ocean" strokeWidth={2} />
                <div>
                  <h3 className="text-sm font-semibold text-navy">
                    Class-Specific Evidence Formulas
                  </h3>
                  <p className="text-xs text-navy-400 mt-0.5">
                    Multi-modal evidence weighting calibrated by side-scan sonar physical principles
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAllFormulasModal(false)}
                className="p-1.5 rounded-md text-navy-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-3 overflow-y-auto max-h-[62vh]">
              {Object.entries(CLASS_FORMULAS).map(([key, def], idx) => {
                const isCurrent = activeItem.classKey === key;

                return (
                  <div
                    key={key}
                    className={`p-3.5 rounded-lg border transition-all text-xs ${
                      isCurrent
                        ? 'border-ocean bg-ocean-50/40 ring-1 ring-ocean/30 shadow-2xs'
                        : 'border-navy-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-navy-400 font-semibold">{idx + 1}.</span>
                        <span className="text-navy font-semibold">{def.title}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-ocean text-white text-[10px] font-semibold">
                            ACTIVE TARGET
                          </span>
                        )}
                      </div>
                      {def.weights.s_shadow === 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                          Shadow weight = 0
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50/90 p-2.5 rounded-lg border border-navy-50 mb-2">
                      {renderFormulaEquation(def)}
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-navy-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-navy-400 uppercase text-[10px]">Component Weights:</span>
                        <span className="text-navy font-medium">
                          C<sub className="text-[9px]">AI</sub>: {(def.weights.c_ai * 100).toFixed(0)}%
                        </span>
                        <span>•</span>
                        <span className="text-navy font-medium">
                          S<sub className="text-[9px]">shape</sub>: {(def.weights.s_shape * 100).toFixed(0)}%
                        </span>
                        <span>•</span>
                        <span className={def.weights.s_shadow === 0 ? 'text-amber-700 font-medium' : 'text-navy font-medium'}>
                          S<sub className="text-[9px]">shadow</sub>: {(def.weights.s_shadow * 100).toFixed(0)}%
                        </span>
                        <span>•</span>
                        <span className="text-navy font-medium">
                          S<sub className="text-[9px]">context</sub>: {(def.weights.s_context * 100).toFixed(0)}%
                        </span>
                      </div>

                      {def.note && (
                        <span className="text-amber-700 text-[10px]">
                          {def.note}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-navy-50 flex items-center justify-between text-xs text-navy-400">
              <span>Equations comply with physical underwater acoustic propagation principles.</span>
              <button
                onClick={() => setShowAllFormulasModal(false)}
                className="px-4 py-1.5 bg-navy hover:bg-ocean text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
