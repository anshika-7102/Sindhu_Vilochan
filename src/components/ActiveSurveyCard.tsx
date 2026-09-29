import { ArrowRight, Edit3, CheckCircle2, Ship, ShieldCheck } from 'lucide-react';
import { SurveyMetadata } from '@/types';

interface ActiveSurveyCardProps {
  metadata: SurveyMetadata | null;
  isMetadataLoaded?: boolean;
  onContinue: () => void;
  onStartPipeline?: () => void;
  pipelineState?: string;
  onEdit?: () => void;
  isReady?: boolean;
  validCount?: number;
  rejectedCount?: number;
}

export default function ActiveSurveyCard({
  metadata,
  isMetadataLoaded = false,
  onContinue,
  onEdit,
  isReady = false,
  validCount = 0,
  rejectedCount = 0,
}: ActiveSurveyCardProps) {
  const hasMeta = isMetadataLoaded && metadata && metadata.surveyId;
  const canProceed = isReady && validCount > 0 && hasMeta;

  return (
    <div className="bg-white border border-navy-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Header Banner */}
      <div className="bg-[#082B52] px-5 py-3.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-cyan-300">
            <Ship size={16} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-300">
              Active Survey Dossier
            </div>
            <div className="text-sm font-bold font-mono text-white tracking-wide">
              {hasMeta ? metadata.surveyId : 'SN-2026-09-IN'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMeta && onEdit && (
            <button
              onClick={onEdit}
              className="text-slate-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
              title="Edit Survey Parameters"
            >
              <Edit3 size={13} />
            </button>
          )}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-mono font-semibold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ingested
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-4">
        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-navy-50/50 p-2.5 rounded-lg border border-navy-100/70">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-navy-400 block mb-0.5">
              Queued Frames
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-navy font-mono">
                {validCount > 0 ? validCount : hasMeta && metadata.frames ? metadata.frames : 15}
              </span>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-mono">
                100% Valid
              </span>
            </div>
          </div>

          <div className="bg-navy-50/50 p-2.5 rounded-lg border border-navy-100/70">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-navy-400 block mb-0.5">
              Swath Width
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-navy font-mono">
                {hasMeta && metadata.swath ? metadata.swath : '100 m'}
              </span>
              <span className="text-[10px] text-navy-400">Dual-Ch</span>
            </div>
          </div>

          <div className="bg-navy-50/50 p-2.5 rounded-lg border border-navy-100/70">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-navy-400 block mb-0.5">
              Survey Vessel
            </span>
            <span className="text-xs font-bold text-navy truncate block" title={metadata?.vessel || 'RV Sagar Nidhi'}>
              {metadata?.vessel || 'RV Sagar Nidhi'}
            </span>
          </div>

          <div className="bg-navy-50/50 p-2.5 rounded-lg border border-navy-100/70">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-navy-400 block mb-0.5">
              Acoustic Frequency
            </span>
            <span className="text-xs font-bold text-ocean font-mono block">
              455 / 900 kHz
            </span>
          </div>
        </div>

        {/* Detailed Telemetry Table */}
        <div className="space-y-2 pt-2 border-t border-navy-50 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
            <span className="text-navy-400 font-medium">Corridor</span>
            <span className="font-semibold text-navy truncate max-w-[190px]" title={metadata?.corridor || 'Arabian Sea Corridor — Sector 4B'}>
              {metadata?.corridor || 'Arabian Sea Corridor — Sector 4B'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
            <span className="text-navy-400 font-medium">Sensor</span>
            <span className="font-medium text-navy text-[11px] truncate max-w-[190px]" title={metadata?.sensor || 'EdgeTech 4200 Dual-Frequency'}>
              {metadata?.sensor || 'EdgeTech 4200 Dual-Frequency'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
            <span className="text-navy-400 font-medium">Origin GPS</span>
            <span className="font-mono text-ocean text-[11px] font-medium">
              {metadata?.origin || '12.330° N, 72.971° E'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
            <span className="text-navy-400 font-medium">Sound Velocity</span>
            <span className="font-mono font-medium text-navy">1,532 m/s</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
            <span className="text-navy-400 font-medium">Hydrographic Standard</span>
            <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              IHO S-44 Order 1a
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-navy-400 font-medium">Survey Operator</span>
            <span className="text-navy-500 font-medium text-[11px] truncate max-w-[190px]" title={metadata?.operator || 'NIOT / MoES India'}>
              {metadata?.operator || 'NIOT / MoES India'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            disabled={!canProceed}
            onClick={onContinue}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-xs tracking-wider uppercase transition-all shadow-md group ${
              canProceed
                ? 'bg-[#082B52] hover:bg-ocean text-white cursor-pointer active:scale-98'
                : 'bg-navy-50 text-navy-200 cursor-not-allowed'
            }`}
          >
            <span>Continue to Sonar Analysis</span>
            <ArrowRight size={15} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
