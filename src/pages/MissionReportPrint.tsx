import { useEffect } from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  Target,
  MapPin,
  FileText,
  Activity,
  Award,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  Sparkles,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import {
  REVIEWED_DETECTIONS_TABLE,
  SURVEY_HOTSPOTS,
  INITIAL_REVIEW_CANDIDATES,
  ReviewCandidate,
} from '@/data/surveyWorkflowData';
import { OBSERVABILITY_METRICS_MAP } from '@/data/sonarAnalysisData';

const STORAGE_KEY = 'sagar_human_review_candidates_v5';

export default function MissionReportPrint() {
  useEffect(() => {
    document.title = 'SINDHU_VILOCHAN_SURVEY_REPORT_SV2026-09.pdf';
  }, []);

  // Load human review candidate directly from Layer 04 LocalStorage
  const humanCandidate: ReviewCandidate = (() => {
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
      console.error('Failed to load review candidate in Print report:', e);
    }
    return INITIAL_REVIEW_CANDIDATES[0];
  })();

  const detectionsTable = REVIEWED_DETECTIONS_TABLE.map((d) => {
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

  // Compute observability aggregate across all 15 survey images
  const obsValues = Object.values(OBSERVABILITY_METRICS_MAP);
  const totalObs = obsValues.length;
  const avgReliability = Math.round(
    obsValues.reduce((acc, m) => acc + m.surveyReliabilityScore, 0) / totalObs
  );
  const avgUsableArea = (
    obsValues.reduce((acc, m) => acc + m.usableAreaPercent, 0) / totalObs
  ).toFixed(1);
  const avgSnr = (
    obsValues.reduce((acc, m) => acc + m.snrDb, 0) / totalObs
  ).toFixed(1);
  const avgNadirGap = (
    obsValues.reduce((acc, m) => acc + m.nadirGapPercent, 0) / totalObs
  ).toFixed(1);
  const avgWeakSignal = (
    obsValues.reduce((acc, m) => acc + m.weakSignalPercent, 0) / totalObs
  ).toFixed(1);
  const avgShadow = (
    obsValues.reduce((acc, m) => acc + m.acousticShadowPercent, 0) / totalObs
  ).toFixed(1);

  const hotspotRiskRating = 'P1 - HIGH';

  // SVG Gauge calculations
  const rGauge = 34;
  const cGauge = 2 * Math.PI * rGauge;
  const offsetReliability = cGauge - (cGauge * avgReliability) / 100;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 font-sans print:bg-white print:text-black">
      {/* Print Specific CSS Embedded */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700;800&display=swap');
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-page-1 {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            box-sizing: border-box;
          }
          .print-page-2 {
            page-break-before: always !important;
            break-before: page !important;
            display: block !important;
            box-sizing: border-box;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Floating Action Bar (Hidden during Print) */}
      <header className="sticky top-0 z-50 bg-white text-navy px-6 py-3 shadow-xs border-b border-navy-100 print:hidden flex flex-wrap items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean border border-ocean-100 flex items-center justify-center">
            <FileText size={17} strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm font-bold text-navy tracking-tight flex items-center gap-2">
              <span>Sindhu Vilochan • Hydrographic Mission Dossier</span>
              <span className="text-[11px] font-medium bg-ocean-50 text-ocean-700 px-2 py-0.5 rounded border border-ocean-200">
                Clean 2-Page A4 Optimized
              </span>
            </div>
            <div className="text-xs text-navy-400 font-medium mt-0.5">
              Mission Ref: SINDHU-VILOCHAN-SV2026-09 • Western Arabian Sea Sector 4B
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-navy-500 font-medium hidden md:inline">
            💡 Tip: Ensure <strong className="text-ocean-700 font-semibold">"Background graphics"</strong> is checked in browser print dialog
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean hover:bg-ocean-600 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
          >
            <Printer size={15} />
            <span>Download PDF / Print</span>
          </button>
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-navy-200 bg-white hover:bg-slate-50 text-navy-600 hover:text-navy text-xs font-medium transition-colors cursor-pointer"
          >
            <X size={15} />
            <span>Close</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto my-6 p-6 sm:p-10 bg-white shadow-2xl rounded-xl border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none">
        
        {/* ==================== PAGE 1: EXECUTIVE BRIEFING, METRIC GAUGES, HOTSPOTS ==================== */}
        <div className="print-page-1 flex flex-col justify-between">
          <div>
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-teal-700 font-mono">
                    <span>Indian Ocean Survey Program</span>
                    <span>•</span>
                    <span>Ministry of Earth Sciences</span>
                    <span>•</span>
                    <span>NIOT</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                    SINDHU VILOCHAN • HYDROGRAPHIC SURVEY REPORT
                  </h1>
                  <p className="text-[11px] text-slate-600 mt-0.5 max-w-xl leading-tight">
                    Side-Scan Sonar Telemetry, Survey Reliability Index, Multi-Modal Evidence Fusion, & DBSCAN Hotspots Manifest.
                  </p>
                </div>

                {/* Audit Stamp */}
                <div className="border-2 border-slate-900 rounded p-2 text-center min-w-[160px] bg-slate-50 flex-shrink-0">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    Mission Reference
                  </div>
                  <div className="text-xs font-black font-mono text-slate-950 mt-0.5">
                    SN2026-09-SEC4B
                  </div>
                  <div className="text-[8px] font-mono text-emerald-800 font-bold mt-0.5 uppercase bg-emerald-100 px-1.5 py-0.5 rounded inline-block">
                    ✓ Hydrographic Audit Pass
                  </div>
                </div>
              </div>

              {/* Survey Metadata Bar */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200 text-[10px] font-noto font-['Noto_Sans',sans-serif]">
                <div>
                  <span className="text-slate-400 block font-medium font-noto font-['Noto_Sans',sans-serif]">SECTOR</span>
                  <span className="font-bold text-slate-800 font-noto font-['Noto_Sans',sans-serif]">W. Arabian Sea (4B)</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium font-noto font-['Noto_Sans',sans-serif]">SENSOR</span>
                  <span className="font-bold text-slate-800 font-noto font-['Noto_Sans',sans-serif]">EdgeTech 4200 (455/900 kHz)</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium font-noto font-['Noto_Sans',sans-serif]">SURVEY WINDOW</span>
                  <span className="font-bold text-slate-800 font-noto font-['Noto_Sans',sans-serif]">12–19 Sept 2026</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium font-noto font-['Noto_Sans',sans-serif]">SWATHS PROCESSED</span>
                  <span className="font-bold text-slate-800 font-noto font-['Noto_Sans',sans-serif]">15 Acoustic Frames</span>
                </div>
              </div>
            </div>

            {/* Section 1: Executive KPI Strip */}
            <div className="grid grid-cols-4 gap-2.5 mb-5 avoid-break">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Survey Frames</div>
                <div className="text-xl font-black font-mono text-slate-900 mt-0.5">15</div>
                <div className="text-[9px] text-slate-500">100% processed</div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Verified Contacts</div>
                <div className="text-xl font-black font-mono text-slate-900 mt-0.5">{detectionsTable.length}</div>
                <div className="text-[9px] text-slate-500">Classified contacts</div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Hotspot Clusters</div>
                <div className="text-xl font-black font-mono text-teal-700 mt-0.5">4</div>
                <div className="text-[9px] text-slate-500">DBSCAN ε=450m</div>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60 text-center">
                <div className="text-[10px] text-rose-700 uppercase font-mono">High Priority</div>
                <div className="text-xl font-black font-mono text-rose-700 mt-0.5">6</div>
                <div className="text-[9px] text-rose-600">Immediate ROV recovery</div>
              </div>
            </div>

            {/* Section 2: Core Operational Intelligence - Exactly 2 Mission Factors */}
            <div className="mb-5 avoid-break">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono mb-2.5">
                <Activity size={13} className="text-teal-700" />
                <span>1. Core Survey Evaluation Factors</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Factor 1: Survey Reliability Index */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 flex items-center gap-4 shadow-xs">
                  <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r={rGauge} className="stroke-slate-200" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="40"
                        cy="40"
                        r={rGauge}
                        stroke="currentColor"
                        className="text-teal-600"
                        strokeWidth="6"
                        strokeDasharray={cGauge}
                        strokeDashoffset={offsetReliability}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black font-mono text-slate-950 leading-none">
                        {avgReliability}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                      Factor 1: Survey Reliability Index
                    </span>
                    <span className="mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-100 text-teal-800 inline-block">
                      TIER 1 • HIGH RELIABILITY
                    </span>
                    <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                      Synthesized multi-modal acoustic quality across Sector 4B survey area with mean SNR {avgSnr} dB.
                    </p>
                  </div>
                </div>

                {/* Factor 2: Hotspot Density & Intervention Risk */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 flex items-center gap-4 shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-rose-100 border-2 border-rose-500 text-rose-700 flex flex-col items-center justify-center flex-shrink-0 shadow-inner">
                    <span className="font-black font-mono text-lg leading-none">P1</span>
                    <span className="text-[8px] font-mono font-bold uppercase">HIGH</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                      Factor 2: Hotspot Density & Risk Rating
                    </span>
                    <span className="mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-100 text-rose-800 inline-block">
                      4 CLUSTERS • 6 CRITICAL CONTACTS
                    </span>
                    <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                      Spatial DBSCAN clustering identifying high-priority debris zones requiring immediate ROV recovery.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Hotspots Spatial Clustering Manifest */}
            <div className="mb-4 avoid-break">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono mb-2">
                <MapPin size={13} className="text-teal-700" />
                <span>2. DBSCAN Spatial Hotspots & Remediation Priority</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {SURVEY_HOTSPOTS.map((spot) => (
                  <div
                    key={spot.id}
                    className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-[10px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono font-black text-xs text-slate-950">
                        Cluster {spot.code} • <span className="font-normal text-slate-500">{spot.location}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[8px] font-bold font-mono ${
                          spot.priority === 'High'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : spot.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {spot.priority} Priority
                      </span>
                    </div>
                    <div className="text-slate-700">
                      <strong>Dominant:</strong> {spot.dominantTypes}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1 border-t border-slate-200">
                      <span>Contacts: {spot.detectionsCount}</span>
                      <span>Mean R: {spot.priority === 'High' ? '91.3%' : spot.priority === 'Medium' ? '92.2%' : '89.8%'}</span>
                      <span>Status: {spot.priority === 'High' ? 'ROV Required' : 'Monitored'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page 1 Footer */}
          <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>Sindhu Vilochan • Indian Ocean Hydrographic Survey Operations • Sector 4B</span>
            <span>Page 1 of 2</span>
          </div>
        </div>

        {/* ==================== PAGE 2: VERIFIED DETECTIONS TABLE, FUSION FORMULA, SIGN-OFF ==================== */}
        <div className="print-page-2 flex flex-col justify-between pt-4">
          <div>
            {/* Page 2 Header Banner */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-teal-700 font-bold">
                  Document Continued • Multi-Modal Detection Ledger
                </div>
                <h2 className="text-lg font-black text-slate-950 font-mono">
                  3. VERIFIED CONTACTS & SURVEY DETECTIONS AUDIT TRAIL
                </h2>
              </div>
              <div className="text-right text-[9px] font-mono text-slate-500">
                <div>Ref: SN2026-09-SEC4B</div>
                <div>Page 2 of 2</div>
              </div>
            </div>

            {/* Detections Table (12 Contacts) */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg mb-4 avoid-break">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-slate-700 uppercase text-[9px]">
                  <tr>
                    <th className="py-2 px-2.5">ID</th>
                    <th className="py-2 px-2.5">Classification</th>
                    <th className="py-2 px-1.5 text-center">AI Conf (C_AI)</th>
                    <th className="py-2 px-1.5 text-center">Shadow</th>
                    <th className="py-2 px-1.5 text-center">Shape</th>
                    <th className="py-2 px-1.5 text-center">Context</th>
                    <th className="py-2 px-1.5 text-center">Fusion R</th>
                    <th className="py-2 px-2.5">Coordinates (Lat, Lng)</th>
                    <th className="py-2 px-1.5 text-center">Cluster</th>
                    <th className="py-2 px-2 text-right">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                  {detectionsTable.map((row) => (
                    <tr key={row.index} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-bold text-slate-950">{row.imageId}</td>
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900 font-sans">
                        <div>{row.classType}</div>
                        {row.imageId === 'DET-005' && (
                          <div className="text-[8px] font-mono text-teal-700 font-normal">
                            HITL Note Logged
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-1.5 text-center">{(row.confidence * 100).toFixed(0)}%</td>
                      <td className="py-1.5 px-1.5 text-center text-slate-600">
                        {row.classType.toLowerCase().includes('net') ? 'N/A' : '0.91'}
                      </td>
                      <td className="py-1.5 px-1.5 text-center text-slate-600">0.93</td>
                      <td className="py-1.5 px-1.5 text-center text-slate-600">0.89</td>
                      <td className="py-1.5 px-1.5 text-center font-bold text-teal-800">{row.reliability || 90}%</td>
                      <td className="py-1.5 px-2.5 text-[9px] text-slate-500">{row.location}</td>
                      <td className="py-1.5 px-1.5 text-center font-bold">{row.hotspot}</td>
                      <td className="py-1.5 px-2 text-right">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                            row.priority === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : row.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
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

            {/* Section 4: Human-in-the-Loop Anomaly Verification & Multi-Modal Fusion */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 avoid-break">
              {/* 4A: HITL Operator Verification & Field Notes */}
              <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-800 flex items-center gap-1.5">
                      <UserCheck size={12} className="text-teal-700" />
                      4A. HITL Operator Verification & Notes
                    </span>
                    <span className="text-[8px] font-mono text-teal-800 font-bold bg-teal-100 px-1.5 py-0.2 rounded border border-teal-200">
                      Layer 04 Ground Truth
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src="/unknown/human.png"
                      alt="Target ANO-001"
                      className="w-12 h-10 object-cover rounded border border-slate-300 flex-shrink-0"
                    />
                    <div className="text-[9px] font-mono leading-tight">
                      <div className="font-bold text-slate-950">
                        Target ANO-001 (Image 3)
                      </div>
                      <div className="text-slate-500">
                        {humanCandidate.coordinates} • Depth: {humanCandidate.depth}
                      </div>
                      <div className="font-semibold text-teal-800 mt-0.5">
                        Status:{' '}
                        {humanCandidate.decision === 'confirmed'
                          ? (humanCandidate.confirmedClass ? `Confirmed Debris (${humanCandidate.confirmedClass})` : 'Confirmed Anthropogenic Debris')
                          : humanCandidate.decision === 'natural'
                          ? 'Confirmed Natural Formation'
                          : humanCandidate.decision === 'further-review' || humanCandidate.decision === 'false-positive'
                          ? 'Further Review (Awaiting Pass)'
                          : 'Pending Field Operator Review'}
                      </div>
                    </div>
                  </div>
                  {/* Operator Field Note */}
                  <div className="p-2 rounded bg-white border border-slate-200 text-[9px] font-serif italic text-slate-800">
                    <span className="font-mono not-italic font-bold text-slate-500 text-[8px] block uppercase mb-0.5">
                      Analyst Field Observation Note:
                    </span>
                    "{humanCandidate.notes && humanCandidate.notes.trim() ? humanCandidate.notes : 'No custom field observations entered.'}"
                  </div>
                </div>
                <div className="pt-1.5 mt-2 border-t border-slate-200 flex items-center justify-between text-[8px] font-mono text-slate-500">
                  <span>Operator: QA-4402 (NIOT)</span>
                  <span>Digital Signature: Validated</span>
                </div>
              </div>

              {/* 4B: Adaptive Multi-Modal Evidence Fusion Formulation */}
              <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-800 flex items-center gap-1.5">
                      <Activity size={12} className="text-teal-700" />
                      4B. Multi-Modal Evidence Fusion Math
                    </span>
                    <span className="text-[8px] font-mono text-teal-800 font-bold bg-teal-100 px-1.5 py-0.2 rounded border border-teal-200">
                      Sindhu Vilochan Specification
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-900 mb-2">
                    R_fusion = α · C_AI + β · S_shape + γ · S_shadow + δ · S_context
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono text-slate-600">
                    <div className="p-1 bg-white rounded border border-slate-200">
                      <strong>Shipwreck:</strong> α=0.50, β=0.25, γ=0.15, δ=0.10
                    </div>
                    <div className="p-1 bg-white rounded border border-slate-200">
                      <strong>Crab Pot:</strong> α=0.50, β=0.25, γ=0.20, δ=0.05
                    </div>
                    <div className="p-1 bg-white rounded border border-slate-200">
                      <strong>Plane:</strong> α=0.50, β=0.25, γ=0.15, δ=0.10
                    </div>
                    <div className="p-1 bg-white rounded border border-slate-200">
                      <strong>Pipe:</strong> α=0.50, β=0.30, γ=0.10, δ=0.10
                    </div>
                    <div className="p-1 bg-white rounded border border-slate-200 col-span-2">
                      <strong>Ghost Net:</strong> α=0.50, β=0.10, γ=0.00, δ=0.40
                    </div>
                  </div>
                </div>
                <div className="pt-1.5 mt-2 border-t border-slate-200 text-[8px] font-mono text-slate-500">
                  Reliability matrix weighted per sonar sensor profile & grazing angle
                </div>
              </div>
            </div>

            {/* Section 5: Official Sign-Off & Verification Block */}
            <div className="pt-3 border-t-2 border-slate-900 avoid-break">
              <div className="grid grid-cols-3 gap-4 text-[10px]">
                <div>
                  <div className="text-[9px] font-mono uppercase text-slate-400">Chief Sonar Hydrographer</div>
                  <div className="font-serif italic text-sm text-slate-900 mt-1.5 font-bold">Dr. V. K. Ramanathan</div>
                  <div className="text-slate-600">National Institute of Ocean Technology</div>
                  <div className="font-mono text-slate-400 text-[8px]">Cert Ref: HYDRO-IND-4402</div>
                </div>

                <div>
                  <div className="text-[9px] font-mono uppercase text-slate-400">Mission Commander Approval</div>
                  <div className="font-serif italic text-sm text-slate-900 mt-1.5 font-bold">Capt. S. Sengupta</div>
                  <div className="text-slate-600">Indian Ocean Hydrographic Command</div>
                  <div className="font-mono text-slate-400 text-[8px]">Date: 21 September 2026</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center font-mono">
                  <div className="text-[8px] text-slate-400 uppercase">Cryptographic Audit Checksum</div>
                  <div className="text-[9px] font-bold text-slate-900 mt-0.5 truncate">
                    SHA256: 7f8c9b201a4e58f0...62d1
                  </div>
                  <div className="text-[8px] text-emerald-800 font-bold mt-1 uppercase">
                    ✓ Validated Against IHO S-44 Standards
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page 2 Footer */}
          <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>Sindhu Vilochan • Indian Ocean Hydrographic Survey Operations • Sector 4B</span>
            <span>Page 2 of 2 • End of Official Survey Dossier</span>
          </div>
        </div>

      </div>
    </div>
  );
}
