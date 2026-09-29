import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Target,
  MapPin,
  Shield,
  BarChart3,
  PieChart as PieChartIcon,
  ListFilter,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  ArrowLeft,
  Download,
  ExternalLink,
  CheckCircle2,
  Filter,
  ShieldCheck,
  ChevronRight,
  Printer,
  X,
  Activity,
  UserCheck,
  Clock,
  Sparkles,
  MessageSquare,
  Eye,
  Check,
} from 'lucide-react';
import {
  REVIEWED_DETECTIONS_TABLE,
  SURVEY_HOTSPOTS,
  ReviewedDetectionRow,
  INITIAL_REVIEW_CANDIDATES,
  ReviewCandidate,
} from '@/data/surveyWorkflowData';
import { OBSERVABILITY_METRICS_MAP, ObservabilityMetrics } from '@/data/sonarAnalysisData';
import { usePipeline } from '@/context/PipelineContext';
import LayerEmptyState from '@/components/LayerEmptyState';

const STORAGE_KEY = 'sagar_human_review_candidates_v5';

export default function Reports() {
  const navigate = useNavigate();
  const { pipelineState } = usePipeline();
  const isProcessed = pipelineState !== 'idle';

  // Load human review candidate (strictly human.png from Layer 04)
  const [humanCandidate, setHumanCandidate] = useState<ReviewCandidate>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          (parsed[0].name === 'human.png' || parsed[0].id === 'cand-human')
        ) {
          return parsed[0];
        }
      }
    } catch (e) {
      console.error('Failed to load human review candidate:', e);
    }
    return INITIAL_REVIEW_CANDIDATES[0];
  });

  // Re-sync with Layer 04 if user edits in another tab or returns to this tab
  useEffect(() => {
    const syncCandidate = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHumanCandidate(parsed[0]);
          }
        }
      } catch (e) {
        console.error('Failed to sync candidate:', e);
      }
    };

    window.addEventListener('storage', syncCandidate);
    window.addEventListener('focus', syncCandidate);
    return () => {
      window.removeEventListener('storage', syncCandidate);
      window.removeEventListener('focus', syncCandidate);
    };
  }, []);

  // Dynamically synchronize detections table with the human reviewer's decision & notes from Layer 04
  const detections = useMemo<ReviewedDetectionRow[]>(() => {
    return REVIEWED_DETECTIONS_TABLE.map((d) => {
      if (d.imageId === 'DET-005') {
        let status = 'Confirmed';
        let classType = 'Anthropogenic Anomaly';
        let priority = 'High' as 'High' | 'Medium' | 'Low';
        let reliability = 88;

        if (humanCandidate.decision === 'confirmed') {
          status = 'Human Confirmed';
          classType = humanCandidate.confirmedClass
            ? `Confirmed Debris (${humanCandidate.confirmedClass})`
            : 'Anthropogenic Debris (Verified)';
          priority = 'High';
          reliability = 95;
        } else if (humanCandidate.decision === 'natural') {
          status = 'Natural Formation';
          classType = 'Natural Rock / Outcrop';
          priority = 'Low';
          reliability = 92;
        } else if (humanCandidate.decision === 'further-review' || humanCandidate.decision === 'false-positive') {
          status = 'Further Review';
          classType = 'Further Review (Multi-Aspect)';
          priority = 'Medium';
          reliability = 85;
        } else {
          status = 'Under Review';
          classType = 'Anthropogenic Anomaly (HITL)';
          priority = 'High';
          reliability = 78;
        }

        return {
          ...d,
          status,
          classType,
          priority,
          reliability,
        };
      }
      return d;
    });
  }, [humanCandidate]);

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showObservabilityAudit, setShowObservabilityAudit] = useState<boolean>(false);
  const [selectedNoteModal, setSelectedNoteModal] = useState<string | null>(null);

  // Compute aggregate observability across all 15 authentic survey images
  const obsList = useMemo(() => {
    return Object.entries(OBSERVABILITY_METRICS_MAP).map(([filename, metric]) => ({
      filename,
      ...metric,
    }));
  }, []);

  const totalObsSwaths = obsList.length;
  const avgReliabilityScore = useMemo(() => {
    return Math.round(obsList.reduce((acc, m) => acc + m.surveyReliabilityScore, 0) / totalObsSwaths);
  }, [obsList, totalObsSwaths]);

  const avgUsableArea = useMemo(() => {
    return (obsList.reduce((acc, m) => acc + m.usableAreaPercent, 0) / totalObsSwaths).toFixed(1);
  }, [obsList, totalObsSwaths]);

  const avgSnr = useMemo(() => {
    return (obsList.reduce((acc, m) => acc + m.snrDb, 0) / totalObsSwaths).toFixed(1);
  }, [obsList, totalObsSwaths]);

  const avgNadirGap = useMemo(() => {
    return (obsList.reduce((acc, m) => acc + m.nadirGapPercent, 0) / totalObsSwaths).toFixed(1);
  }, [obsList, totalObsSwaths]);

  const avgShadow = useMemo(() => {
    return (obsList.reduce((acc, m) => acc + m.acousticShadowPercent, 0) / totalObsSwaths).toFixed(1);
  }, [obsList, totalObsSwaths]);


  // Trigger real CSV download
  const handleExportCSV = () => {
    const headers = [
      'Index,Target_ID,Class_Type,AI_Confidence,Reliability_Score,Review_Status,Latitude_Longitude,Hotspot_Cluster,Intervention_Priority,Analyst_Field_Notes',
    ];
    const rows = detections.map(
      (d) =>
        `${d.index},${d.imageId},"${d.classType}",${(d.confidence * 100).toFixed(0)}%,${
          d.reliability || 90
        }%,${d.status},"${d.location}",${d.hotspot},${d.priority},"${
          d.imageId === 'DET-005'
            ? (humanCandidate.notes || '').replace(/"/g, '""')
            : ''
        }"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sindhu_vilochan_survey_detections_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('CSV survey records downloaded with analyst field notes');
  };

  // Trigger real GeoJSON export
  const handleExportGeoJSON = () => {
    const hotspotFeatures = SURVEY_HOTSPOTS.map((spot) => {
      const [lat, lon] = spot.location.split(',').map((v) => parseFloat(v.trim()));
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        properties: {
          clusterId: spot.id,
          code: spot.code,
          priority: spot.priority,
          detectionsCount: spot.detectionsCount,
          dominantTypes: spot.dominantTypes,
          featureCategory: 'Hotspot_Density_Cluster',
        },
      };
    });

    const detectionFeatures = detections.map((d) => {
      const [lat, lon] = d.location.split(',').map((v) => parseFloat(v.trim()));
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        properties: {
          targetId: d.imageId,
          class: d.classType,
          confidence: d.confidence,
          reliability: d.reliability || 90,
          status: d.status,
          cluster: d.hotspot,
          priority: d.priority,
          featureCategory: 'Acoustic_Debris_Detection',
          analyst_notes: d.imageId === 'DET-005' ? humanCandidate.notes || '' : '',
          human_verified: d.imageId === 'DET-005',
          operator_decision: d.imageId === 'DET-005' ? humanCandidate.decision || 'pending' : 'automated',
        },
      };
    });

    const geojson = {
      type: 'FeatureCollection',
      name: 'Sindhu_Vilochan_Marine_Survey_Export',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      features: [...hotspotFeatures, ...detectionFeatures],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sindhu_vilochan_hotspots_gis_${new Date().toISOString().slice(0, 10)}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('GeoJSON GIS package exported with HITL attributes');
  };

  // Trigger PDF print in dedicated new tab
  const handleExportPDF = () => {
    window.open('/print-report', '_blank');
    showSuccess('Opening printable survey dossier in new tab');
  };

  // Trigger detection manifest JSON export
  const handleExportJSON = () => {
    const manifest = {
      surveyCampaign: 'SINDHU-VILOCHAN-SN2026-09',
      surveyArea: 'Western Arabian Sea, Sector 4B',
      coordinatesExtent: '12.330° N - 12.359° N, 72.971° E - 72.996° E',
      sensor: 'EdgeTech 4200 Dual-Frequency Side-Scan Sonar (455/900 kHz)',
      surveyReliabilityIndex: avgReliabilityScore,
      totalSwathsIngested: 12,
      totalHotspots: SURVEY_HOTSPOTS.length,
      detectionsCount: detections.length,
      humanReviewVerification: {
        targetId: 'ANO-001',
        sourceFrame: humanCandidate.name,
        coordinates: humanCandidate.coordinates,
        depth: humanCandidate.depth,
        decision: humanCandidate.decision || 'pending',
        analystNotes: humanCandidate.notes || '',
        verifiedBy: 'Hydrographic Operator QA-4402 (NIOT)',
        timestamp: new Date().toISOString(),
      },
      detections,
      hotspots: SURVEY_HOTSPOTS,
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sindhu_vilochan_mission_manifest_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('Complete survey mission JSON manifest exported with HITL dossier');
  };

  const handleDownloadAll = () => {
    handleExportCSV();
    handleExportGeoJSON();
    handleExportJSON();
    showSuccess('Complete survey bundle exported (CSV + GeoJSON + JSON)');
  };

  const showSuccess = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="pt-1 pb-6 px-6 md:px-8 max-w-[1520px] mx-auto space-y-3.5 select-none">
      {/* Download Alert Toast */}
      {downloadSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white px-4 py-3 rounded-lg shadow-xl border border-navy-700 flex items-center gap-3 animate-fade-in font-mono text-xs">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="font-semibold">{downloadSuccess}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1.5 border-b border-navy-100/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy tracking-tight">
            Reports & Export
          </h1>
          <p className="text-xs text-navy-400 max-w-3xl mt-0.5">
            Synthesized marine mission intelligence, multi-modal evidence reliability matrices, and standards-compliant GIS export bundles.
          </p>
        </div>
      </div>

      {!isProcessed ? (
        <LayerEmptyState
          layerNumber="06"
          layerName="Mission Reports & GIS Export"
          title="Mission Intelligence Dossier Not Generated"
          description="Survey Reliability Index (SRI), GIS shapefile packages, and executive print dossiers are synthesized after running the ingestion pipeline in Layer 01. Please upload your survey dataset in Layer 01 and click Ingest to run the processing pipeline."
          Icon={FileText}
          hint="IHO S-44 standards compliance, SRI 89/100, and GeoJSON bundles will be compiled upon pipeline execution."
        />
      ) : (
        <>
          {/* Top 4 Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Images Processed */}
            <div className="bg-white border border-navy-100/80 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 flex-shrink-0">
                <FileText size={20} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-navy-400">
                  Acoustic Swaths Processed
                </div>
                <div className="text-2xl font-bold text-navy mt-0.5 font-mono">12</div>
                <div className="text-[11px] text-navy-300">Sidescan sonar frames</div>
              </div>
            </div>

            {/* Verified Detections */}
            <div className="bg-white border border-navy-100/80 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-ocean-50 flex items-center justify-center text-ocean flex-shrink-0">
                <Target size={20} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-navy-400">Verified Detections</div>
                <div className="text-2xl font-bold text-navy mt-0.5 font-mono">{detections.length}</div>
                <div className="text-[11px] text-navy-300">Classified acoustic contacts</div>
              </div>
            </div>

            {/* Debris Hotspots */}
            <div className="bg-white border border-navy-100/80 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <MapPin size={20} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-navy-400">Hotspot Clusters</div>
                <div className="text-2xl font-bold text-navy mt-0.5 font-mono">4</div>
                <div className="text-[11px] text-navy-300">Density clusters identified</div>
              </div>
            </div>

            {/* High Priority Zones */}
            <div className="bg-white border border-navy-100/80 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Shield size={20} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-navy-400">High Priority Targets</div>
                <div className="text-2xl font-bold text-rose-600 mt-0.5 font-mono">6</div>
                <div className="text-[11px] text-navy-300">Requiring ROV intervention</div>
              </div>
            </div>
          </div>

          {/* Middle Section: 3 Visual Analysis Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Card 1: Detection Summary Bar Chart */}
            <div className="lg:col-span-4 bg-white border border-navy-100/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-navy font-semibold text-sm mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-ocean" />
                  <span>Detections by Classification</span>
                </div>
                <span className="text-xs font-mono font-bold text-navy-400">Total: 11</span>
              </div>

              <div className="flex-1 flex flex-col justify-end pt-1 pb-0.5">
                {/* 1. Bar Chart Area strictly aligned to baseline */}
                <div className="relative h-28 sm:h-32 flex items-end justify-between px-1 border-b border-navy-100 pb-0.5">
                  <div className="absolute inset-x-0 top-0 border-b border-dashed border-navy-100/70" />
                  <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-navy-100/70" />

                  {/* Shipwreck: 3 */}
                  <div className="flex flex-col items-center flex-1 px-0.5 group" title="Shipwreck: 3 detections">
                    <span className="text-[11px] font-bold text-navy font-mono mb-1 group-hover:scale-110 transition-transform">3</span>
                    <div className="w-5 sm:w-6 bg-rose-500 rounded-t-sm h-20 sm:h-22 transition-all group-hover:brightness-110 shadow-xs" />
                  </div>

                  {/* Ghostnet: 1 */}
                  <div className="flex flex-col items-center flex-1 px-0.5 group" title="Ghostnet: 1 detection">
                    <span className="text-[11px] font-bold text-navy font-mono mb-1 group-hover:scale-110 transition-transform">1</span>
                    <div className="w-5 sm:w-6 bg-purple-500 rounded-t-sm h-7 sm:h-8 transition-all group-hover:brightness-110 shadow-xs" />
                  </div>

                  {/* Plane: 2 */}
                  <div className="flex flex-col items-center flex-1 px-0.5 group" title="Plane: 2 detections">
                    <span className="text-[11px] font-bold text-navy font-mono mb-1 group-hover:scale-110 transition-transform">2</span>
                    <div className="w-5 sm:w-6 bg-indigo-500 rounded-t-sm h-14 sm:h-15 transition-all group-hover:brightness-110 shadow-xs" />
                  </div>

                  {/* Pipe: 2 */}
                  <div className="flex flex-col items-center flex-1 px-0.5 group" title="Pipe: 2 detections">
                    <span className="text-[11px] font-bold text-navy font-mono mb-1 group-hover:scale-110 transition-transform">2</span>
                    <div className="w-5 sm:w-6 bg-sky-500 rounded-t-sm h-14 sm:h-15 transition-all group-hover:brightness-110 shadow-xs" />
                  </div>

                  {/* Crabpot: 2 */}
                  <div className="flex flex-col items-center flex-1 px-0.5 group" title="Crabpot: 2 detections">
                    <span className="text-[11px] font-bold text-navy font-mono mb-1 group-hover:scale-110 transition-transform">2</span>
                    <div className="w-5 sm:w-6 bg-emerald-500 rounded-t-sm h-14 sm:h-15 transition-all group-hover:brightness-110 shadow-xs" />
                  </div>

                  {/* Novel Anomaly: 1 */}
                  <div className="flex flex-col items-center flex-1 px-0.5 group" title="Novel Anomaly: 1 detection">
                    <span className="text-[11px] font-bold text-navy font-mono mb-1 group-hover:scale-110 transition-transform">1</span>
                    <div className="w-5 sm:w-6 bg-amber-500 rounded-t-sm h-7 sm:h-8 transition-all group-hover:brightness-110 shadow-xs" />
                  </div>
                </div>

                {/* 2. Labels Area below baseline - Grid guarantees equal width and ZERO text collision */}
                <div className="grid grid-cols-6 pt-1.5 px-1 text-center">
                  <div className="min-w-0 px-0.5 flex justify-center">
                    <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-navy-600 block truncate" title="Shipwreck">
                      Shipwreck
                    </span>
                  </div>
                  <div className="min-w-0 px-0.5 flex justify-center">
                    <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-navy-600 block truncate" title="Ghostnet">
                      Ghostnet
                    </span>
                  </div>
                  <div className="min-w-0 px-0.5 flex justify-center">
                    <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-navy-600 block truncate" title="Plane">
                      Plane
                    </span>
                  </div>
                  <div className="min-w-0 px-0.5 flex justify-center">
                    <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-navy-600 block truncate" title="Pipe">
                      Pipe
                    </span>
                  </div>
                  <div className="min-w-0 px-0.5 flex justify-center">
                    <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-navy-600 block truncate" title="Crabpot">
                      Crabpot
                    </span>
                  </div>
                  <div className="min-w-0 px-0.5 flex justify-center">
                    <div className="text-[8px] sm:text-[9px] font-semibold text-navy-600 leading-tight" title="Novel Anomaly">
                      <span className="block truncate">Novel</span>
                      <span className="block truncate">Anomaly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

        {/* Card 2: Hotspot Priority Donut Chart */}
        <div className="lg:col-span-4 bg-white border border-navy-100/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-navy font-semibold text-sm mb-2">
            <PieChartIcon size={16} className="text-ocean" />
            <span>Hotspot Intervention Priority</span>
          </div>

          <div className="flex-1 flex items-center justify-center gap-5 py-1">
            {/* SVG Donut Chart: 2 High (50%), 1 Med (25%), 1 Low (25%) */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                {/* High Priority (Red) 50% -> dash 44 44 */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="4.5"
                  strokeDasharray="44 44"
                  strokeDashoffset="0"
                />
                {/* Medium Priority (Orange) 25% -> dash 22 66 offset -44 */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="4.5"
                  strokeDasharray="22 66"
                  strokeDashoffset="-44"
                />
                {/* Low Priority (Green) 25% -> dash 22 66 offset -66 */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4.5"
                  strokeDasharray="22 66"
                  strokeDashoffset="-66"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-navy leading-none font-mono">4</span>
                <span className="text-[10px] text-navy-400 font-medium mt-0.5">Hotspots</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-navy-600">High Priority</span>
                <span className="font-bold text-navy font-mono ml-auto">2 (50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-navy-600">Medium Priority</span>
                <span className="font-bold text-navy font-mono ml-auto">1 (25%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-navy-600">Low Priority</span>
                <span className="font-bold text-navy font-mono ml-auto">1 (25%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Survey Reliability & Acoustic Coverage */}
        <div className="lg:col-span-4 bg-white border border-navy-100/80 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-navy font-semibold text-sm mb-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-teal-600" />
              <span>Survey Reliability Index</span>
            </div>
            <button
              onClick={() => setShowObservabilityAudit(true)}
              className="text-[11px] font-mono text-ocean hover:underline flex items-center gap-1 cursor-pointer font-bold"
              title="Click to view all survey frame observability metrics"
            >
              <span>Survey Audit</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Circular Progress Gauge & Score */}
          <div className="flex items-center justify-center gap-4 py-1">
            <div className="relative w-22 h-22 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-100"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="currentColor"
                  className="text-teal-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={238.76}
                  strokeDashoffset={238.76 - (238.76 * avgReliabilityScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-mono text-navy leading-none">
                  {avgReliabilityScore}
                </span>
                <span className="text-[9px] font-mono font-bold text-navy-400 mt-0.5">
                  / 100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                HIGH RELIABILITY
              </span>
              <div className="text-xs font-bold text-navy font-mono">
                Acoustic Observability
              </div>
              <p className="text-[10px] text-navy-400 leading-tight">
                Synthesized across all 15 authentic survey images in Sector 4B.
              </p>
              <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                <span>Hotspots: 4 Clusters (P1 - High)</span>
              </div>
            </div>
          </div>

          {/* 4 Telemetry Mini-Badges */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-navy-50 text-[10px] font-mono">
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[8.5px] text-navy-400 uppercase">Acoustic Clarity</span>
              <span className="font-bold text-emerald-700">{avgUsableArea}%</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[8.5px] text-navy-400 uppercase">Mean SNR</span>
              <span className="font-bold text-navy">{avgSnr} dB</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[8.5px] text-navy-400 uppercase">Nadir Gap</span>
              <span className="font-bold text-slate-700">{avgNadirGap}%</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[8.5px] text-navy-400 uppercase">Shadow Loss</span>
              <span className="font-bold text-indigo-900">{avgShadow}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Human Review Summary (Compact & Clean Light Design) */}
      <div className="bg-white border border-navy-100/80 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/unknown/human.png"
            alt="Target ANO-001"
            className="w-11 h-11 rounded-lg border border-navy-100 object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-navy font-mono">
                Human Review: ANO-001
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  humanCandidate.decision === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : humanCandidate.decision === 'natural'
                    ? 'bg-sky-100 text-sky-700'
                    : humanCandidate.decision === 'further-review' || humanCandidate.decision === 'false-positive'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {humanCandidate.decision === 'confirmed'
                  ? (humanCandidate.confirmedClass ? `Confirmed (${humanCandidate.confirmedClass})` : 'Confirmed Debris')
                  : humanCandidate.decision === 'natural'
                  ? 'Natural Formation'
                  : humanCandidate.decision === 'further-review' || humanCandidate.decision === 'false-positive'
                  ? 'Further Review'
                  : 'Pending Review'}
              </span>
              <span className="text-[11px] text-navy-400 font-mono">
                {humanCandidate.coordinates || '12.3412° N, 72.9721° E'} (Depth: {humanCandidate.depth || '19.0 m'})
              </span>
            </div>
            <div className="text-xs text-navy-600 mt-0.5 truncate max-w-2xl">
              <span className="font-semibold text-navy">Analyst Note:</span>{' '}
              {humanCandidate.notes && humanCandidate.notes.trim() ? (
                <span className="italic">"{humanCandidate.notes}"</span>
              ) : (
                <span className="text-navy-400">None logged</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/human-review')}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-navy-200 hover:bg-mist-100 text-navy text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-center cursor-pointer"
        >
          <span>Edit in Human Review</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Bottom Section 1: Full-Width Multi-Modal Survey Detections Table */}
      <div className="bg-white border border-navy-100/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col">
        <div className="flex items-center gap-2 text-navy font-semibold text-sm mb-4">
          <ListFilter size={16} className="text-ocean" />
          <span>Multi-Modal Survey Detections</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-navy-100 text-navy-400 font-semibold uppercase tracking-wider">
                <th className="pb-2.5 pl-1 font-mono">ID</th>
                <th className="pb-2.5">Class / Feature</th>
                <th className="pb-2.5 text-center">Confidence</th>
                <th className="pb-2.5 text-center">Reliability (R)</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5">Coordinates</th>
                <th className="pb-2.5 text-center">Cluster</th>
                <th className="pb-2.5 text-right pr-1">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50 font-medium">
              {detections.map((row) => (
                <tr key={row.index} className="hover:bg-mist-100/70 transition-colors">
                  <td className="py-2.5 pl-1 font-mono font-bold text-navy">{row.imageId}</td>
                  <td className="py-2.5 text-navy">
                    <div className="font-semibold">{row.classType}</div>
                    {row.imageId === 'DET-005' && (
                      <button
                        type="button"
                        onClick={() => setSelectedNoteModal(humanCandidate.notes || 'No field notes logged yet.')}
                        className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer transition-colors"
                        title="Click to view full Hydrographic Field Note"
                      >
                        <MessageSquare size={10} className="text-teal-600" />
                        <span>
                          Note:{' '}
                          {humanCandidate.notes && humanCandidate.notes.trim()
                            ? humanCandidate.notes.length > 20
                              ? humanCandidate.notes.slice(0, 18) + '...'
                              : humanCandidate.notes
                            : 'None'}
                        </span>
                      </button>
                    )}
                  </td>
                  <td className="py-2.5 text-center font-mono font-bold text-navy">
                    {(row.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 text-center font-mono font-bold text-ocean">
                    {row.reliability || 90}%
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status.includes('Confirmed')
                          ? 'bg-emerald-100 text-emerald-700'
                          : row.status.includes('Natural')
                          ? 'bg-sky-100 text-sky-700'
                          : row.status.includes('False')
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-navy-500 text-[11px]">{row.location}</td>
                  <td className="py-2.5 text-center font-mono font-bold text-navy">
                    {row.hotspot}
                  </td>
                  <td className="py-2.5 text-right pr-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.priority === 'High'
                          ? 'bg-rose-100 text-rose-700'
                          : row.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {row.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section 2: Export Packages (Full Width below table) */}
      <div className="bg-white border border-navy-100/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col">
        <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <div className="flex items-center gap-2 text-navy font-semibold text-sm">
              <Download size={16} className="text-ocean" />
              <span>Export Packages & Formats</span>
            </div>
            <p className="text-xs text-navy-400 mt-0.5">
              Download certified sonar survey data for GIS systems, maritime operations, and archival records.
            </p>
          </div>
        </div>

        {/* 4 Action Cards in 4-column row (1 col on mobile, 2 on tablet, 4 on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Download PDF Dossier */}
          <div className="border border-navy-100 rounded-lg p-3 flex flex-col justify-between gap-3 hover:border-rose-300 transition-colors bg-mist-50">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-navy">Printable PDF Dossier</div>
                <div className="text-[10px] text-navy-400 mt-0.5 leading-tight">
                  Formal survey report with maps, metrics, and fusion formulas
                </div>
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              className="w-full py-1.5 px-2.5 rounded text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 font-mono cursor-pointer"
              title="Opens high-resolution printable survey report in a new browser tab"
            >
              <Printer size={13} />
              <span>Open Printable Dossier (New Tab)</span>
            </button>
          </div>

          {/* Export CSV Data */}
          <div className="border border-navy-100 rounded-lg p-3 flex flex-col justify-between gap-3 hover:border-emerald-300 transition-colors bg-mist-50">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-navy">CSV Analysis Table</div>
                <div className="text-[10px] text-navy-400 mt-0.5 leading-tight">
                  Detections, coordinates, and reliability scores
                </div>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="w-full py-1.5 px-2.5 rounded text-xs font-semibold text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 font-mono cursor-pointer"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Export GeoJSON */}
          <div className="border border-navy-100 rounded-lg p-3 flex flex-col justify-between gap-3 hover:border-sky-300 transition-colors bg-mist-50">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                <FileCode size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-navy">GeoJSON GIS Layer</div>
                <div className="text-[10px] text-navy-400 mt-0.5 leading-tight">
                  Standard GIS points and hotspot clusters for QGIS/ArcGIS
                </div>
              </div>
            </div>
            <button
              onClick={handleExportGeoJSON}
              className="w-full py-1.5 px-2.5 rounded text-xs font-semibold text-sky-600 border border-sky-200 hover:bg-sky-50 transition-colors flex items-center justify-center gap-1.5 font-mono cursor-pointer"
            >
              <Download size={12} />
              <span>Export GeoJSON</span>
            </button>
          </div>

          {/* Export JSON Manifest */}
          <div className="border border-navy-100 rounded-lg p-3 flex flex-col justify-between gap-3 hover:border-purple-300 transition-colors bg-mist-50">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                <ImageIcon size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-navy">Mission JSON Manifest</div>
                <div className="text-[10px] text-navy-400 mt-0.5 leading-tight">
                  Structured telemetry, detection bounds, and parameters
                </div>
              </div>
            </div>
            <button
              onClick={handleExportJSON}
              className="w-full py-1.5 px-2.5 rounded text-xs font-semibold text-purple-600 border border-purple-200 hover:bg-purple-50 transition-colors flex items-center justify-center gap-1.5 font-mono cursor-pointer"
            >
              <Download size={12} />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-navy-100/60">
        <button
          onClick={() => navigate('/debris-hotspots')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-navy-200 text-sm font-semibold text-navy hover:bg-mist-200 hover:border-navy-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Debris Hotspots
        </button>

        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0a58ca] hover:bg-[#084298] text-white text-sm font-semibold transition-all shadow-sm"
        >
          <Download size={16} />
          <span>Export All Survey Assets (Zip / Bundle)</span>
        </button>
      </div>
      </>
      )}

      {/* 15-Swath Acoustic Observability Audit Modal */}
      {showObservabilityAudit && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowObservabilityAudit(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-navy-100 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-navy-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy font-mono">
                    15-Swath Acoustic Observability & Reliability Audit
                  </h3>
                  <p className="text-xs text-navy-400 font-mono">
                    Sindhu Vilochan Hydrographic Specification • Sector 4B Arabian Sea Survey
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowObservabilityAudit(false)}
                className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-navy-50 text-xs font-mono bg-slate-50 rounded-xl px-4 my-3">
              <div>
                <span className="text-[10px] text-navy-400 block">MEAN RELIABILITY</span>
                <span className="font-bold text-teal-700 text-sm">{avgReliabilityScore}/100</span>
              </div>
              <div>
                <span className="text-[10px] text-navy-400 block">USABLE SWATH AVG</span>
                <span className="font-bold text-emerald-700 text-sm">{avgUsableArea}%</span>
              </div>
              <div>
                <span className="text-[10px] text-navy-400 block">MEAN ACOUSTIC SNR</span>
                <span className="font-bold text-navy text-sm">{avgSnr} dB</span>
              </div>
              <div>
                <span className="text-[10px] text-navy-400 block">QUALITY TIERS</span>
                <span className="font-bold text-slate-800 text-sm">12 High / 2 Med / 1 Low</span>
              </div>
            </div>

            {/* Modal Table */}
            <div className="flex-1 overflow-y-auto border border-navy-100 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-navy-100 text-navy-500 font-mono text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Swath File</th>
                    <th className="py-2.5 px-2 text-center">Usable Area</th>
                    <th className="py-2.5 px-2 text-center">SNR (dB)</th>
                    <th className="py-2.5 px-2 text-center">Quality Tier</th>
                    <th className="py-2.5 px-2 text-center">Score</th>
                    <th className="py-2.5 px-3">Propagation & Seabed Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50 font-mono text-navy-700">
                  {obsList.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-bold text-navy-400">{m.imageId}</td>
                      <td className="py-2 px-3 font-bold text-navy">{m.filename}</td>
                      <td className="py-2 px-2 text-center font-bold text-emerald-700">{m.usableAreaPercent}%</td>
                      <td className="py-2 px-2 text-center">{m.snrDb.toFixed(1)} dB</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          m.qualityTier === 'HIGH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.qualityTier === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {m.qualityTier}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-teal-800">{m.surveyReliabilityScore}</td>
                      <td className="py-2 px-3 text-[11px] font-sans text-navy-500 max-w-xs truncate" title={m.notes}>
                        {m.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-3 border-t border-navy-50 flex items-center justify-between text-xs text-navy-400 font-mono">
              <span>Acoustic Observability calculated per Sindhu Vilochan System Architecture Section 7</span>
              <button
                onClick={() => setShowObservabilityAudit(false)}
                className="px-5 py-2 bg-navy hover:bg-ocean text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hydrographic Analyst Field Note Detailed View Modal */}
      {selectedNoteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedNoteModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-navy-100 flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-navy-100/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <MessageSquare size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy font-mono">
                    Hydrographic Field Observation Log
                  </h4>
                  <p className="text-[11px] text-navy-400 font-mono">
                    Target: ANO-001 (DET-005) • Image 3
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNoteModal(null)}
                className="p-1 rounded-lg text-navy-400 hover:text-navy hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Note Content */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-mono font-bold uppercase text-teal-700 tracking-wider mb-1.5 flex items-center justify-between">
                <span>Certified Observation Note:</span>
                <span className="text-[10px] text-slate-400 font-mono">Operator QA-4402</span>
              </div>
              <div className="text-sm font-serif italic text-navy-800 leading-relaxed">
                "{selectedNoteModal}"
              </div>
            </div>

            {/* Target Status & Attribution */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-mist-50 border border-navy-100/60">
                <span className="text-[9px] text-navy-400 block">CLASSIFICATION</span>
                <span className="font-bold text-navy">
                  {humanCandidate.decision === 'confirmed'
                    ? (humanCandidate.confirmedClass ? `Confirmed (${humanCandidate.confirmedClass})` : 'Confirmed Debris')
                    : humanCandidate.decision === 'natural'
                    ? 'Natural Formation'
                    : humanCandidate.decision === 'further-review' || humanCandidate.decision === 'false-positive'
                    ? 'Further Review'
                    : 'Pending Confirmation'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-mist-50 border border-navy-100/60">
                <span className="text-[9px] text-navy-400 block">SEABED COORDINATES</span>
                <span className="font-bold text-navy">{humanCandidate.coordinates}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-navy-100/80 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedNoteModal(null);
                  navigate('/human-review');
                }}
                className="px-4 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Edit in Layer 04</span>
                <ChevronRight size={13} />
              </button>
              <button
                onClick={() => setSelectedNoteModal(null)}
                className="px-5 py-2 rounded-lg bg-navy hover:bg-ocean text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
