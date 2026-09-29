import { useState, useRef, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  Sliders,
  Compass,
  Download,
  CheckCircle2,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { SurveyMetadata, IngestedImage } from '@/types';

interface IngestedImagePreviewProps {
  images: IngestedImage[];
  selectedImageIndex: number;
  onSelectImage: (index: number) => void;
  metadata: SurveyMetadata;
  onContinue: () => void;
  onAddMore?: () => void;
  onRemoveImage?: (id: string) => void;
}

export default function IngestedImagePreview({
  images,
  selectedImageIndex,
  onSelectImage,
  metadata,
  onContinue,
}: IngestedImagePreviewProps) {
  const [filterMode, setFilterMode] = useState<'normal' | 'sonar-blue' | 'sonar-amber' | 'grayscale'>('normal');
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom & Pan States (Supports 2-finger touch pinch, wheel zoom, and drag pan)
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [selectedImageIndex]);

  if (images.length === 0) return null;

  const currentImage = images[selectedImageIndex] || images[0];

  const filterClasses = {
    normal: '',
    'sonar-blue': 'hue-rotate-180 contrast-125 saturate-150',
    'sonar-amber': 'sepia contrast-125 saturate-200 brightness-95',
    grayscale: 'grayscale contrast-125',
  };

  const handlePrev = () => {
    if (selectedImageIndex > 0) {
      onSelectImage(selectedImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex < images.length - 1) {
      onSelectImage(selectedImageIndex + 1);
    }
  };

  const isDualChannel =
    currentImage.swathSide === 'Dual-channel' ||
    (currentImage.imageMetadata?.scan_side &&
      currentImage.imageMetadata.scan_side.toLowerCase().includes('dual')) ||
    currentImage.name.toLowerCase().includes('seabed') ||
    currentImage.name.toLowerCase().includes('swath');

  // Zoom Control Handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.3, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // 2-Finger Touch Pinch Zoom & Touch Pan
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistRef.current = dist;
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - panPosition.x,
        y: e.touches[0].clientY - panPosition.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchDistRef.current;
      touchDistRef.current = currentDist;
      setZoomLevel((prev) => Math.min(Math.max(prev * ratio, 1), 4));
    } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    touchDistRef.current = null;
    setIsDragging(false);
  };

  // Mouse Drag Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Trackpad & Mouse Wheel Zoom
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      setZoomLevel((prev) => {
        const next = Math.min(Math.max(prev * zoomFactor, 1), 4);
        if (next === 1) setPanPosition({ x: 0, y: 0 });
        return next;
      });
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
      {/* Header Bar - Fixed height (h-16) and locked controls position */}
      <div className="px-6 h-16 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4 flex-nowrap overflow-hidden">
        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-ocean-100 text-ocean flex items-center justify-center flex-shrink-0">
            <Layers size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 flex-shrink-0">
                Ingested Sonar Imagery ({images.length} {images.length === 1 ? 'Frame' : 'Frames'})
              </h3>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex-shrink-0">
                <CheckCircle2 size={12} strokeWidth={2.2} />
                Ingestion Complete
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono flex items-center gap-2 truncate">
              <span className="truncate max-w-[360px] lg:max-w-[500px]">
                Frame {String(selectedImageIndex + 1).padStart(2, '0')} of {String(images.length).padStart(2, '0')}: {currentImage.displayName || `Image ${selectedImageIndex + 1}`} • {currentImage.size} • Swath: {currentImage.swathWidth || metadata.swath}
              </span>
              {currentImage.imageMetadata && Object.keys(currentImage.imageMetadata).length > 0 && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                  CSV Linked
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Frame stepper & Controls - Locked right position */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Frame Stepper */}
          {images.length > 1 && (
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs mr-1">
              <button
                onClick={handlePrev}
                disabled={selectedImageIndex === 0}
                className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
                title="Previous Frame"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-mono font-semibold text-slate-700">
                {selectedImageIndex + 1} / {images.length}
              </span>
              <button
                onClick={handleNext}
                disabled={selectedImageIndex === images.length - 1}
                className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
                title="Next Frame"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-bold text-ocean">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 4}
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            {zoomLevel > 1 && (
              <button
                onClick={handleResetZoom}
                className="p-1 ml-0.5 text-slate-400 hover:text-slate-700"
                title="Reset Zoom"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* Palette selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
            <span className="px-2 text-slate-400 font-medium flex items-center gap-1">
              <Sliders size={12} /> Palette:
            </span>
            <button
              onClick={() => setFilterMode('normal')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                filterMode === 'normal' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setFilterMode('sonar-blue')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                filterMode === 'sonar-blue' ? 'bg-ocean text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ocean
            </button>
            <button
              onClick={() => setFilterMode('sonar-amber')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                filterMode === 'sonar-amber' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Amber
            </button>
            <button
              onClick={() => setFilterMode('grayscale')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                filterMode === 'grayscale' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gray
            </button>
          </div>

          {/* Metric Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showGrid
                ? 'bg-ocean-50 border-ocean-200 text-ocean'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Sonar Metric Grid"
          >
            <Compass size={14} />
            <span className="hidden sm:inline">Grid</span>
          </button>

          {/* Fullscreen view */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs transition-colors"
            title="Toggle Expanded View"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Sonar Viewport with 2-Finger Pinch Zoom & Pan Support */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleResetZoom}
        className={`relative bg-slate-950 overflow-hidden select-none transition-all ${
          isFullscreen ? 'h-[75vh]' : 'h-[440px]'
        } ${zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
      >
        <img
          src={currentImage.url}
          alt={`Sonar frame ${currentImage.frameNumber}`}
          style={{
            transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
          }}
          className={`w-full h-full object-contain transition-transform duration-100 ${filterClasses[filterMode]}`}
        />

        {/* Scan line textures & animation */}
        <div className="absolute inset-0 scan-line pointer-events-none opacity-40" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="w-full h-0.5 bg-ocean-300/30 animate-scan-sweep" />
        </div>

        {/* Metric Grid Overlay - All telemetry and channel indicators positioned at the BOTTOM of image */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none border border-ocean-400/20 flex flex-col justify-end p-3">
            {/* Center Nadir Line - Rendered strictly for Dual-channel / full-swath frames */}
            {isDualChannel && (
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-ocean-400/40 border-r border-dashed border-ocean-300/60 flex items-center justify-center pointer-events-none">
                <span className="bg-slate-950/80 text-[10px] font-mono text-ocean-300 px-1 py-0.5 rounded rotate-90 transform origin-center uppercase tracking-widest">
                  Nadir Track
                </span>
              </div>
            )}

            {/* Telemetry Data & Channel Indicators positioned at the BOTTOM of the image */}
            <div className="flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-ocean-200 border border-ocean-500/30">
                  PORT (50m)
                </div>
                <div className="bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 border border-slate-700/50 flex items-center gap-2">
                  <span>POS: <span className="text-ocean-300 font-bold">{currentImage.coordinates || metadata.origin}</span></span>
                  {currentImage.depth && (
                    <span className="text-slate-400">| DEPTH: <span className="text-emerald-300 font-bold">{currentImage.depth}</span></span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 border border-slate-700/50">
                  FRAME {String(selectedImageIndex + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')} • SWATH: <span className="text-emerald-400 font-bold">{currentImage.swathWidth || metadata.swath}</span> • {currentImage.sensor || metadata.sensor}
                </div>
                <div className="bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-ocean-200 border border-ocean-500/30">
                  STARBOARD (50m)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Next Steps - Fixed height (h-14) and locked layout to prevent height jumps */}
      <div className="px-6 h-14 bg-white border-t border-slate-100 flex items-center justify-between gap-4 flex-nowrap overflow-hidden">
        <div className="flex items-center gap-5 text-xs text-slate-500 flex-nowrap overflow-hidden flex-1 min-w-0">
          <div className="flex-shrink-0">
            <span className="text-slate-400">Survey ID:</span>{' '}
            <span className="font-mono font-semibold text-slate-700">{metadata.surveyId}</span>
          </div>
          <div className="flex-shrink-0">
            <span className="text-slate-400">Total Frames:</span>{' '}
            <span className="font-semibold text-slate-700 font-mono">{images.length}</span>
          </div>
          <div className="truncate max-w-[200px]">
            <span className="text-slate-400">Active Frame:</span>{' '}
            <span className="font-mono text-slate-700 truncate">{currentImage.displayName || `Image ${selectedImageIndex + 1}`}</span>
          </div>
          {currentImage.coordinates && (
            <div className="flex-shrink-0 hidden md:block">
              <span className="text-slate-400">Position:</span>{' '}
              <span className="font-mono text-ocean-700 font-medium">{currentImage.coordinates}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <a
            href={currentImage.url}
            download={currentImage.name}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Download Active Frame"
          >
            <Download size={13} />
            Download Frame
          </a>

          <button
            onClick={onContinue}
            className="px-5 py-2.5 bg-[#0066f5] hover:bg-[#0055d4] text-white rounded-lg font-semibold text-xs flex items-center gap-2 shadow-sm transition-all group"
          >
            <span>Continue to Sonar Analysis</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
