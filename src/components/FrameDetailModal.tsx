import { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Hash,
  ShieldCheck,
  Compass,
  Sliders,
  Layers,
  Database,
} from 'lucide-react';
import { IngestedImage, SwathChannel } from '@/types';

interface FrameDetailModalProps {
  frame: IngestedImage | null;
  onClose: () => void;
  onUpdateSwathSide?: (id: string, side: SwathChannel) => void;
  onNavigateToAnalysis?: () => void;
}

export default function FrameDetailModal({
  frame,
  onClose,
  onUpdateSwathSide,
  onNavigateToAnalysis,
}: FrameDetailModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterMode, setFilterMode] = useState<'normal' | 'ocean' | 'amber' | 'grayscale'>('normal');

  if (!frame) return null;

  const filterStyles = {
    normal: '',
    ocean: 'hue-rotate-180 contrast-125 saturate-150',
    amber: 'sepia contrast-125 saturate-200 brightness-95',
    grayscale: 'grayscale contrast-125',
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[95vh] flex flex-col justify-between overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0080ff] flex items-center justify-center">
              <Layers size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 font-mono">
                  {frame.displayName || `Image ${frame.frameNumber}`}
                </h3>
                {frame.status === 'Valid' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Valid Frame
                  </span>
                )}
                {frame.status.includes('Rejected') && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1">
                    <XCircle size={11} /> {frame.status}
                  </span>
                )}
                {frame.status.includes('Warning') && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <AlertTriangle size={11} /> Warning
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Frame #{frame.frameNumber} • Size: {frame.size} • Checksum: {frame.checksum}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Viewer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Palette:</span>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                {(['normal', 'ocean', 'amber', 'grayscale'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
                      filterMode === mode
                        ? 'bg-white font-semibold text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Swath Side Selector (Item 16) */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Swath Side:</span>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 font-mono">
                {(['Port', 'Starboard', 'Dual-channel'] as SwathChannel[]).map((side) => (
                  <button
                    key={side}
                    onClick={() => onUpdateSwathSide && onUpdateSwathSide(frame.id, side)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      frame.swathSide === side
                        ? 'bg-[#0080ff] font-bold text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 text-xs">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="px-1.5 font-mono font-semibold text-slate-700">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900"
                title="Reset Zoom"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Image Canvas with Zoom / Pan */}
          <div className="relative h-80 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
            <img
              src={frame.url}
              alt={frame.name}
              style={{ transform: `scale(${zoomLevel})` }}
              className={`max-w-full max-h-full object-contain transition-transform duration-200 ${filterStyles[filterMode]}`}
            />
            {/* Center Nadir Line - Rendered strictly for Dual-channel / full-swath frames */}
            {(frame.swathSide === 'Dual-channel' ||
              frame.name.toLowerCase().includes('seabed') ||
              frame.name.toLowerCase().includes('swath') ||
              (frame.imageMetadata?.scan_side &&
                frame.imageMetadata.scan_side.toLowerCase().includes('dual'))) && (
              <>
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-400/40 border-r border-dashed border-cyan-300/60 pointer-events-none" />
                <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-cyan-200">
                  Channel: {frame.swathSide} • Nadir center track
                </div>
              </>
            )}
          </div>

          {/* Ingested Metadata Table from metadata.csv */}
          {frame.imageMetadata && Object.keys(frame.imageMetadata).length > 0 ? (
            <div className="p-4 bg-navy-50/60 border border-navy-100 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-ocean" />
                  <span className="text-xs font-semibold text-navy">
                    Matched CSV Metadata for <span className="font-mono text-ocean">{frame.name}</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Indexed from metadata.csv
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 text-xs">
                {Object.entries(frame.imageMetadata).map(([k, v]) => (
                  <div key={k} className="p-2 bg-white border border-navy-50 rounded">
                    <span className="text-[10px] font-mono text-navy-400 uppercase block truncate" title={k}>
                      {k}
                    </span>
                    <span className="font-mono font-semibold text-navy truncate block mt-0.5" title={String(v)}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
              <Compass size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Coordinates:</span> Deterministic spatial coordinate{' '}
                <span className="font-mono font-semibold">{frame.coordinates || '18.9220°N, 72.8340°E'}</span>{' '}
                was assigned. Upload <span className="font-mono font-bold">metadata.csv</span> to populate per-image telemetry.
              </div>
            </div>
          )}

          {/* Frame Technical Readout Grid (Specification #15) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Resolution</span>
              <span className="font-mono font-semibold text-slate-800">
                {frame.dimensions ? `${frame.dimensions.width} × ${frame.dimensions.height} px` : '1920 × 1080 px'}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bit Depth</span>
              <span className="font-mono font-semibold text-slate-800">16-bit acoustic depth</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Aspect Ratio</span>
              <span className="font-mono font-semibold text-slate-800">16:9 widescreen</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Swath</span>
              <span className="font-mono font-semibold text-slate-800">100 m (±0.5m deadzone)</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Integrity Check</span>
              <span className="font-mono font-semibold text-emerald-600 flex items-center gap-1">
                <ShieldCheck size={12} /> {frame.checksum}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Channel</span>
              <span className="font-mono font-semibold text-ocean">{frame.swathSide}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <a
            href={frame.url}
            download={frame.name}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download size={13} />
            Download Frame
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
            >
              Close
            </button>
            {onNavigateToAnalysis && frame.status === 'Valid' && (
              <button
                onClick={onNavigateToAnalysis}
                className="px-5 py-2 bg-[#0080ff] hover:bg-[#006ee6] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Analyze in Phase 2</span>
                <CheckCircle2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
