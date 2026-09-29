import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CheckCircle2,
  Terminal,
  Activity,
  ArrowRight,
  Cpu,
  Copy,
  Check,
  Loader2,
  Anchor,
  Compass,
  FileSpreadsheet,
} from 'lucide-react';
import { usePipeline, PIPELINE_STAGES } from '@/context/PipelineContext';

export default function MissionPipelineExecutionModal() {
  const navigate = useNavigate();
  const {
    pipelineState,
    currentStageIndex,
    progressPercent,
    logs,
    isModalOpen,
    setIsModalOpen,
  } = usePipeline();

  const [logFilter, setLogFilter] = useState<'all' | 'process' | 'success' | 'warn'>('all');
  const [copiedLogs, setCopiedLogs] = useState(false);

  const logBoxRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Ensure modal starts at top so Survey Processing Status (Image 2) is visible first
  useEffect(() => {
    if (isModalOpen && modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [isModalOpen]);

  // Auto-scroll ONLY the internal log container, never scrolling the outer modal window
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs, logFilter]);

  // Support closing modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, setIsModalOpen]);

  if (!isModalOpen) return null;

  const isCompleted = pipelineState === 'completed';

  const handleGoToSonarAnalysis = () => {
    setIsModalOpen(false);
    navigate('/sonar-analysis');
  };

  const handleGoToReports = () => {
    setIsModalOpen(false);
    navigate('/reports');
  };

  const handleCopyLogs = () => {
    const formattedLogs = logs
      .map((l) => `[${l.timestamp}] [${l.stage}] [${l.type.toUpperCase()}] ${l.text}`)
      .join('\n');
    navigator.clipboard.writeText(formattedLogs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && isCompleted) {
          setIsModalOpen(false);
        }
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in select-none font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-white border border-slate-300 rounded-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
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
                    isCompleted
                      ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700'
                      : 'bg-amber-900/80 text-amber-200 border-amber-700 animate-pulse'
                  }`}
                >
                  {isCompleted ? 'SYSTEM STATUS: OPERATIONAL' : 'SYSTEM STATUS: PROCESSING'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                Marine Debris Intelligence • Sector 4B Survey Dataset (15 Sonar Frames)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
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
                        isCompleted ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                      }`}
                    />
                    <span>{isCompleted ? 'COMPLETED' : 'PROCESSING'}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Processing Stages</div>
                  <div className="mt-1 font-bold text-[#082B52]">
                    {isCompleted ? '6 / 6 Complete' : `${currentStageIndex + 1} / 6 Active`}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Frames Processed</div>
                  <div className="mt-1 font-bold text-[#082B52]">
                    {isCompleted ? '15 / 15 Frames' : `${Math.min(15, Math.max(1, Math.round(((currentStageIndex + 1) / 6) * 15)))} / 15 Frames`}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Reliability Index</div>
                  <div
                    className={`mt-1 font-bold ${
                      isCompleted ? 'text-emerald-700' : 'text-amber-600'
                    }`}
                  >
                    {isCompleted
                      ? '89 / 100'
                      : pipelineState === 'running'
                      ? 'Calculating...'
                      : 'Pending'}
                  </div>
                </div>
              </div>
            </div>

            {/* Restrained Horizontal Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-[#082B52]">
                <span>Overall Workflow Synthesis</span>
                <span className="font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-xs overflow-hidden border border-slate-300">
                <div
                  className="h-full bg-[#082B52] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
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
                <div className="font-bold text-[#082B52] mt-0.5">SN-2026-09-IN</div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#64748B] uppercase">Survey Area</div>
                <div className="font-semibold text-[#082B52] mt-0.5 truncate" title="Arabian Sea Corridor - Sector 4B">
                  Arabian Sea Corridor
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#64748B] uppercase">Survey Platform</div>
                <div className="font-semibold text-[#082B52] mt-0.5">RV Sagar Nidhi</div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#64748B] uppercase">Sonar System</div>
                <div className="font-semibold text-[#082B52] mt-0.5">EdgeTech 4200</div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#64748B] uppercase">Acoustic Frequency</div>
                <div className="font-semibold text-[#082B52] mt-0.5">600 kHz</div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#64748B] uppercase">Swath Width</div>
                <div className="font-semibold text-[#082B52] mt-0.5">100 m</div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#64748B] uppercase">Center Coordinates</div>
                <div className="font-semibold text-[#082B52] mt-0.5">28.6139° N, 77.2090° E</div>
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
                {isCompleted ? '6 / 6 Completed' : `${currentStageIndex} of 6 Completed`}
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
                  {PIPELINE_STAGES.map((stage, idx) => {
                    const isPast = idx < currentStageIndex || isCompleted;
                    const isCurrent = idx === currentStageIndex && !isCompleted;

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
                          {stage.name}
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

          {/* Section 4: Processing Activity Table (Execution Console) */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-xs overflow-hidden">
            {/* Console Header Bar */}
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

              {/* Controls: Filter & Copy */}
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
            <div ref={logBoxRef} className="max-h-44 overflow-y-auto divide-y divide-slate-200 text-xs scrollbar-thin">
              <div className="sticky top-0 bg-slate-50 border-b border-slate-300 text-[#082B52] font-bold text-[10px] uppercase tracking-wider grid grid-cols-12 px-3 py-1.5 select-none">
                <span className="col-span-2">TIME</span>
                <span className="col-span-3">MODULE</span>
                <span className="col-span-5">EVENT DESCRIPTION</span>
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
                      <span className="col-span-3 font-bold text-[#082B52]">{log.stage}</span>
                      <span className="col-span-5 text-[#082B52] font-medium">{log.text}</span>
                      <span className="col-span-2 text-right">
                        {log.type === 'success' ? (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-xs border border-emerald-300">
                            COMPLETED
                          </span>
                        ) : log.type === 'warn' ? (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-xs border border-amber-300">
                            WARNING
                          </span>
                        ) : isProcessingItem && !isCompleted && isLatest ? (
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
            {isCompleted ? (
              <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-700" />
                SYSTEM VERIFIED • All 6 workflow stages synthesized successfully. Reliability Index: 89/100.
              </span>
            ) : (
              <span className="text-[#082B52] font-bold flex items-center gap-1.5 animate-pulse">
                <Activity size={15} />
                PROCESSING • Executing autonomous marine survey pipeline across 15 sonar pings...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isCompleted ? (
              <>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  title="Close modal and stay on current page"
                >
                  <X size={14} />
                  <span>Close Window</span>
                </button>
                <button
                  onClick={handleGoToReports}
                  className="w-full sm:w-auto px-4 py-2 rounded-xs bg-slate-700 hover:bg-slate-800 text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  View Reports (Layer 06)
                </button>
                <button
                  onClick={handleGoToSonarAnalysis}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xs bg-[#082B52] hover:bg-[#051c37] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <span>Proceed to Sonar Analysis (Layer 02)</span>
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
}
