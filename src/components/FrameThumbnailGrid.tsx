import {
  Trash2,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Hash,
  Plus,
  Database,
  MapPin,
} from 'lucide-react';
import { IngestedImage } from '@/types';

interface FrameThumbnailGridProps {
  frames: IngestedImage[];
  onSelectFrame: (frame: IngestedImage) => void;
  onRemoveFrame: (id: string) => void;
  onClearAll?: () => void;
  onAddMore?: () => void;
  onUploadFolder?: () => void;
}

export default function FrameThumbnailGrid({
  frames,
  onSelectFrame,
  onRemoveFrame,
  onClearAll,
  onAddMore,
  onUploadFolder,
}: FrameThumbnailGridProps) {
  if (frames.length === 0) return null;

  const matchedMetadataCount = frames.filter((f) => f.imageMetadata && Object.keys(f.imageMetadata).length > 0).length;

  return (
    <div className="bg-white rounded-lg border border-navy-100 p-6 space-y-4">
      {/* Header with Title and Clear All */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-navy-50">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-navy">
              Queued Acoustic Frames ({frames.length})
            </h3>
            {matchedMetadataCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-mono flex items-center gap-1">
                <Database size={11} /> {matchedMetadataCount}/{frames.length} linked to metadata.csv
              </span>
            )}
          </div>
          <p className="text-xs text-navy-300 mt-0.5">
            Per-image metadata extracted from metadata.csv matched by image name. Click any tile to inspect full metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onUploadFolder && (
            <button
              onClick={onUploadFolder}
              className="px-3 py-1.5 bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 text-ocean-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Upload an entire folder with images"
            >
              Upload Folder
            </button>
          )}

          {onAddMore && (
            <button
              onClick={onAddMore}
              className="px-3 py-1.5 bg-navy-50 hover:bg-navy-100 border border-navy-100 text-navy rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={13} />
              Add Images / CSV
            </button>
          )}

          {onClearAll && (
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 text-xs font-medium text-navy-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Reset Queue"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Grid of Preview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-1">
        {frames.map((frame, index) => {
          const isValid = frame.status === 'Valid';
          const isRejected = frame.status.includes('Rejected');
          const isWarning = frame.status.includes('Warning');
          const isDuplicate = frame.status.includes('Duplicate');
          const hasCsvMetadata = !!(frame.imageMetadata && Object.keys(frame.imageMetadata).length > 0);

          return (
            <div
              key={frame.id || index}
              onClick={() => onSelectFrame(frame)}
              className={`bg-white rounded-lg border overflow-hidden transition-all group cursor-pointer flex flex-col justify-between hover:shadow-card-hover relative ${
                isValid
                  ? 'border-navy-100 hover:border-ocean'
                  : isRejected
                  ? 'border-red-200 bg-red-50/20'
                  : isWarning
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-navy-100 opacity-75'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="aspect-[4/3] bg-navy-900 overflow-hidden relative select-none">
                <img
                  src={frame.url}
                  alt={frame.name}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                    isRejected ? 'opacity-40 grayscale' : ''
                  }`}
                />

                {/* Scan line overlay */}
                <div className="absolute inset-0 scan-line pointer-events-none opacity-30" />

                {/* Frame Index badge */}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-navy-900/80 text-[10px] font-mono font-bold text-white">
                  F{String(frame.frameNumber).padStart(2, '0')}
                </div>

                {/* Swath Channel Badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-ocean/90 text-[9px] font-mono font-bold text-white uppercase">
                  {frame.swathSide}
                </div>

                {/* Metadata Synced Indicator on image */}
                {hasCsvMetadata && (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                    <Database size={9} /> CSV
                  </div>
                )}

                {/* Hover Maximize Icon */}
                <div className="absolute inset-0 bg-navy-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <div className="p-1.5 rounded-full bg-white/20 flex items-center gap-1 text-[11px] font-medium">
                    <Maximize2 size={13} /> Inspect
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFrame(frame.id);
                  }}
                  className="absolute bottom-2 right-2 p-1.5 rounded bg-navy-900/80 text-navy-200 hover:text-red-400 hover:bg-navy-900 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Remove from queue"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Tile Details */}
              <div className="p-3 bg-white border-t border-navy-50 flex flex-col justify-between flex-1">
                <div>
                  {/* Filename */}
                  <div
                    className="text-xs font-semibold text-navy font-mono truncate"
                    title={frame.displayName || `Image ${frame.frameNumber}`}
                  >
                    {frame.displayName || `Image ${frame.frameNumber}`}
                  </div>

                  {/* Dimensions and File Size */}
                  <div className="flex items-center justify-between text-[11px] text-navy-300 font-mono mt-1">
                    <span>
                      {frame.dimensions
                        ? `${frame.dimensions.width}×${frame.dimensions.height}`
                        : '1920×1080'}
                    </span>
                    <span>{frame.size}</span>
                  </div>

                  {/* Checksum Hash or Depth */}
                  <div className="text-[10px] font-mono text-navy-400 truncate mt-1 flex items-center justify-between">
                    {frame.depth ? (
                      <span className="text-navy-500 font-semibold">Depth: {frame.depth}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-navy-300 truncate">
                        <Hash size={10} className="text-navy-200 flex-shrink-0" />
                        <span className="truncate">{frame.checksum}</span>
                      </span>
                    )}
                    {frame.swathWidth && (
                      <span className="text-ocean font-medium">{frame.swathWidth}</span>
                    )}
                  </div>

                  {/* Coordinates / Timestamp */}
                  {frame.coordinates && (
                    <div className="text-[10px] font-mono text-ocean-700 truncate mt-1 flex items-center gap-1" title={frame.coordinates}>
                      <MapPin size={10} className="flex-shrink-0 text-ocean" />
                      <span className="truncate">{frame.coordinates}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-2.5 pt-2 border-t border-navy-50 flex items-center justify-between text-[10px]">
                  {isValid && (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                      <CheckCircle2 size={10} /> Valid
                    </span>
                  )}
                  {isRejected && (
                    <span className="flex items-center gap-1 font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 font-mono">
                      <XCircle size={10} /> Rejected
                    </span>
                  )}
                  {isWarning && (
                    <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-mono">
                      <AlertTriangle size={10} /> Warn
                    </span>
                  )}
                  {isDuplicate && (
                    <span className="flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-mono">
                      Duplicate
                    </span>
                  )}

                  {hasCsvMetadata ? (
                    <span className="font-mono text-[9px] text-emerald-700 font-medium bg-emerald-50/80 px-1 rounded">
                      Meta Matched
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] text-navy-300">
                      Auto Indexed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
