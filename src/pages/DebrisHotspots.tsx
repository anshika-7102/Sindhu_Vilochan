import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Network,
  Target,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  X,
  ShieldAlert,
  Compass,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  SURVEY_HOTSPOTS,
  HotspotItem,
  HotspotDetectionPreview,
} from '@/data/surveyWorkflowData';
import DebrisHotspotMap from '@/components/DebrisHotspotMap';
import { usePipeline } from '@/context/PipelineContext';
import LayerEmptyState from '@/components/LayerEmptyState';

export default function DebrisHotspots() {
  const navigate = useNavigate();
  const { pipelineState } = usePipeline();
  const isProcessed = pipelineState !== 'idle';

  const [hotspots] = useState<HotspotItem[]>(SURVEY_HOTSPOTS);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('h-1');
  const [mapMode, setMapMode] = useState<'map' | 'satellite'>('map');
  const [inspectingItem, setInspectingItem] = useState<HotspotDetectionPreview | null>(null);

  const activeHotspot =
    hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0];
  const activeHotspotIndex = hotspots.findIndex((h) => h.id === activeHotspot.id);

  // Total metrics synthesized from Layers 1-4
  const totalDetections = 18;
  const highPriorityCount = hotspots.filter((h) => h.priority === 'High').length;

  const handlePrevHotspot = () => {
    const prevIdx = activeHotspotIndex > 0 ? activeHotspotIndex - 1 : hotspots.length - 1;
    setSelectedHotspotId(hotspots[prevIdx].id);
  };

  const handleNextHotspot = () => {
    const nextIdx = activeHotspotIndex < hotspots.length - 1 ? activeHotspotIndex + 1 : 0;
    setSelectedHotspotId(hotspots[nextIdx].id);
  };

  // Mean reliability lookup per hotspot derived from Layer 3 formulas
  const hotspotReliability: Record<string, number> = {
    'h-1': 89.2,
    'h-2': 93.4,
    'h-3': 89.8,
    'h-4': 91.0,
  };

  return (
    <div className="pt-1 pb-6 px-6 md:px-8 max-w-[1520px] mx-auto space-y-3.5 select-none">
      {/* Target Inspection Modal */}
      {inspectingItem && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectingItem(null)}
        >
          <div
            className="bg-navy-900 border border-navy-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-navy-800 flex items-center justify-between bg-navy-950">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                <span className="text-ocean-300">{inspectingItem.label}</span>
                <span className="text-navy-500">•</span>
                <span className="text-xs font-normal text-navy-400">{inspectingItem.className}</span>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="p-1 rounded-md text-navy-400 hover:text-white hover:bg-navy-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-[#070b12]">
              <img
                src={inspectingItem.bboxUrl || inspectingItem.rawUrl}
                alt={inspectingItem.label}
                className="max-h-[380px] w-auto max-w-full rounded object-contain border border-navy-800 shadow-xl"
              />
            </div>

            <div className="p-4 bg-navy-900 border-t border-navy-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-navy-950 p-2 rounded border border-navy-800">
                <div className="text-[10px] text-navy-400 uppercase">Detection Score</div>
                <div className="text-emerald-400 font-bold text-sm mt-0.5">
                  {(inspectingItem.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-navy-950 p-2 rounded border border-navy-800">
                <div className="text-[10px] text-navy-400 uppercase">Hotspot Cluster</div>
                <div className="text-ocean-300 font-bold text-sm mt-0.5">
                  {activeHotspot.code}
                </div>
              </div>
              <div className="bg-navy-950 p-2 rounded border border-navy-800">
                <div className="text-[10px] text-navy-400 uppercase">Priority</div>
                <div className="text-amber-400 font-bold text-sm mt-0.5">
                  {activeHotspot.priority}
                </div>
              </div>
              <div className="bg-navy-950 p-2 rounded border border-navy-800">
                <div className="text-[10px] text-navy-400 uppercase">Coordinates</div>
                <div className="text-navy-200 text-[11px] truncate mt-0.5">
                  {activeHotspot.location}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-1.5 border-b border-navy-100/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy tracking-tight">
            Debris Hotspots
          </h1>
          <p className="text-xs text-navy-400 max-w-3xl mt-0.5">
            Spatial density clustering (DBSCAN &epsilon;=450m, MinPts=3) synthesizing detections from Layers 01–04 to designate priority intervention zones.
          </p>
        </div>

        {/* Top Right Metric KPI Cards */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          {/* Total Detections */}
          <div className="bg-white border border-navy-100/80 rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-md bg-ocean-50 flex items-center justify-center text-ocean">
              <Layers size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-navy-300 uppercase tracking-wide">
                Total Detections
              </div>
              <div className="text-xl font-bold text-navy leading-none mt-0.5">
                {isProcessed ? totalDetections : '—'}
              </div>
            </div>
          </div>

          {/* Hotspots Identified */}
          <div className="bg-white border border-navy-100/80 rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-md bg-navy-50 flex items-center justify-center text-navy-400">
              <Network size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-navy-300 uppercase tracking-wide">
                Hotspots Identified
              </div>
              <div className="text-xl font-bold text-navy leading-none mt-0.5">
                {isProcessed ? `${hotspots.length} Clusters` : '—'}
              </div>
            </div>
          </div>

          {/* High Priority */}
          <div className="bg-white border border-navy-100/80 rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-md bg-rose-50 flex items-center justify-center text-rose-500">
              <Target size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-navy-300 uppercase tracking-wide">
                High Priority
              </div>
              <div className="text-xl font-bold text-rose-600 leading-none mt-0.5">
                {isProcessed ? `${highPriorityCount} Zones` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isProcessed ? (
        <LayerEmptyState
          layerNumber="05"
          layerName="Debris Hotspots"
          title="Spatial Hotspot Clusters Not Computed"
          description="DBSCAN density clustering and priority hazard classification require processed sonar anomalies from the ingestion pipeline. Please upload your survey dataset in Layer 01 and click Ingest to run the processing pipeline."
          Icon={MapIcon}
          hint="4 spatial clusters (H-1 to H-4) and georeferenced boundary polygons will be computed upon execution."
        />
      ) : (
        <>
          {/* Main Grid: Left Hotspot Map (7 cols) + Right Summary & Preview (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Container: Hotspot Map */}
        <div className="lg:col-span-7 bg-white border border-navy-100/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
          {/* Map Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-navy-100/60 bg-white">
            <div className="flex items-center gap-2.5 text-navy font-semibold text-sm">
              <MapIcon size={17} className="text-navy-400" />
              <span>Geo-Spatial Cluster Map (Western Arabian Sea)</span>
            </div>

            {/* Map vs Satellite Toggle */}
            <div className="flex items-center bg-mist-200 p-1 rounded-md">
              <button
                onClick={() => setMapMode('map')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  mapMode === 'map'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-navy-400 hover:text-navy'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setMapMode('satellite')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  mapMode === 'satellite'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-navy-400 hover:text-navy'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>

          {/* Real Interactive Map Canvas */}
          <DebrisHotspotMap
            hotspots={hotspots}
            selectedHotspotId={selectedHotspotId}
            onSelectHotspot={setSelectedHotspotId}
            mapMode={mapMode}
            onToggleMapMode={setMapMode}
          />
        </div>

        {/* Right Container: Hotspot Summary Table (Top) + Hotspot Preview (Bottom) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Top Card: Hotspot Summary Table */}
          <div className="bg-white border border-navy-100/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-navy font-semibold text-sm">
                <Network size={16} className="text-ocean" />
                <span>Cluster Density Summary</span>
              </div>
              <span className="text-[10px] font-mono text-navy-400">Click row to focus map</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-navy-100 text-navy-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5 pl-1 font-mono">Cluster</th>
                    <th className="pb-2.5">Location</th>
                    <th className="pb-2.5 text-center">Count</th>
                    <th className="pb-2.5">Dominant Classes</th>
                    <th className="pb-2.5 text-center">Mean R</th>
                    <th className="pb-2.5">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {hotspots.map((spot) => {
                    const isSelected = spot.id === activeHotspot.id;
                    const rScore = hotspotReliability[spot.id] || 90.0;

                    return (
                      <tr
                        key={spot.id}
                        onClick={() => setSelectedHotspotId(spot.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-ocean-50/70 font-medium' : 'hover:bg-mist-100'
                        }`}
                      >
                        <td className="py-2.5 pl-1 font-mono font-bold text-navy">
                          {spot.code}
                        </td>
                        <td className="py-2.5 font-mono text-navy-600 text-[11px]">
                          {spot.location}
                        </td>
                        <td className="py-2.5 text-center font-bold text-navy">
                          {spot.detectionsCount}
                        </td>
                        <td className="py-2.5 text-navy-600 truncate max-w-[110px]">
                          {spot.dominantTypes}
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold text-ocean">
                          {rScore.toFixed(1)}%
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              spot.priority === 'High'
                                ? 'bg-rose-100 text-rose-700'
                                : spot.priority === 'Medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {spot.priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Card: Hotspot Preview */}
          <div className="bg-white border border-navy-100/80 rounded-xl p-5 shadow-xs">
            {/* Header with Hotspot Selector */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-navy font-semibold text-sm">
                <ImageIcon size={16} className="text-ocean" />
                <span>Cluster Detections Preview ({activeHotspot.code})</span>
              </div>

              {/* Selector with prev / next controls */}
              <div className="flex items-center gap-2 bg-mist-100 px-2 py-1 rounded-md border border-navy-100">
                <button
                  onClick={handlePrevHotspot}
                  className="p-0.5 text-navy-400 hover:text-navy transition-colors"
                  title="Previous Hotspot"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold text-navy font-mono">
                  {activeHotspot.code} ({activeHotspot.priority})
                </span>
                <button
                  onClick={handleNextHotspot}
                  className="p-0.5 text-navy-400 hover:text-navy transition-colors"
                  title="Next Hotspot"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="text-[11px] text-navy-400 mb-3">
              Click any detection card below to inspect high-resolution acoustic signature:
            </div>

            {/* Preview Cards Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 overflow-x-auto pb-1">
              {activeHotspot.previews.map((item) => {
                const boxBorderColor =
                  item.boxColor === 'red'
                    ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                    : item.boxColor === 'blue'
                    ? 'border-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]'
                    : 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]';

                return (
                  <div
                    key={item.id}
                    onClick={() => setInspectingItem(item)}
                    className="flex flex-col items-center bg-mist-100/70 hover:bg-white rounded-lg p-1.5 border border-navy-100/80 hover:border-ocean hover:shadow-sm transition-all cursor-pointer group"
                  >
                    {/* Thumbnail with Bounding Box Overlay */}
                    <div className="w-full aspect-square bg-navy-950 rounded relative overflow-hidden flex items-center justify-center">
                      <img
                        src={item.bboxUrl || item.rawUrl}
                        alt={item.label}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = item.rawUrl;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Bounding Box Border */}
                      <div
                        className={`absolute inset-1.5 border-2 rounded-xs pointer-events-none ${boxBorderColor}`}
                      />
                    </div>

                    {/* Metadata below card */}
                    <div className="mt-1.5 text-center w-full">
                      <div className="text-[11px] font-semibold text-navy truncate">
                        {item.label}
                      </div>
                      <div className="text-[10px] font-mono text-ocean font-bold">
                        {(item.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-navy-100/60">
        <button
          onClick={() => navigate('/human-review')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-navy-200 text-sm font-semibold text-navy hover:bg-mist-200 hover:border-navy-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Human Review
        </button>

        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0a58ca] hover:bg-[#084298] text-white text-sm font-semibold transition-all shadow-sm"
        >
          <span>Continue to Reports & Export</span>
          <ArrowRight size={16} />
        </button>
      </div>
      </>
      )}

      {/* Inspection Modal Lightbox */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-navy-100 flex flex-col gap-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-navy-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean flex items-center justify-center">
                  <Target size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy font-mono">
                    {inspectingItem.className || inspectingItem.label}
                  </h3>
                  <p className="text-xs text-navy-400 font-mono">
                    Cluster {activeHotspot.code} • {activeHotspot.priority} Priority • Conf: {(inspectingItem.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[16/9] flex items-center justify-center border border-navy-100">
              <img
                src={inspectingItem.bboxUrl || inspectingItem.rawUrl}
                alt={inspectingItem.label}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = inspectingItem.rawUrl;
                }}
                className="w-full h-full object-contain select-none"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                {inspectingItem.bboxUrl ? 'Acoustic Signature with Bounding Box' : 'Raw Sonar Swath'}
              </div>
            </div>

            {/* Modal Metadata Grid */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-navy-50 text-xs font-mono">
              <div>
                <span className="text-navy-400 text-[10px] block">TARGET CLASS</span>
                <span className="font-bold text-navy">{inspectingItem.className}</span>
              </div>
              <div>
                <span className="text-navy-400 text-[10px] block">CONFIDENCE</span>
                <span className="font-bold text-emerald-600">{(inspectingItem.confidence * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-navy-400 text-[10px] block">LOCATION</span>
                <span className="font-semibold text-navy">{activeHotspot.location}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingItem(null)}
                className="px-5 py-2 bg-navy hover:bg-ocean text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

