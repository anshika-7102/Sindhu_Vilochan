import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const LAYER_TRANSITION_INFO: Record<string, { step: string; title: string; detail: string }> = {
  '/survey-ingestion': {
    step: 'LAYER 01',
    title: 'Survey Ingestion & Telemetry',
    detail: 'Synchronizing dual-frequency EdgeTech 4200 acoustic telemetry...',
  },
  '/sonar-analysis': {
    step: 'LAYER 02',
    title: 'Sonar Waterfall & Feature Detection',
    detail: 'Loading CLAHE contrast stream & PatchCore anomaly activations...',
  },
  '/evidence-intelligence': {
    step: 'LAYER 03',
    title: 'Multi-Modal Evidence Intelligence',
    detail: 'Correlating acoustic shadow geometry, shape & contextual tensors...',
  },
  '/human-review': {
    step: 'LAYER 04',
    title: 'Human-in-the-Loop Review Queue',
    detail: 'Fetching operator QA triage & high-priority sonar contacts...',
  },
  '/debris-hotspots': {
    step: 'LAYER 05',
    title: 'DBSCAN Spatial Hotspot Clustering',
    detail: 'Computing spatial density clusters (ε = 450m) & polygon overlays...',
  },
  '/reports': {
    step: 'LAYER 06',
    title: 'Mission Intelligence & GIS Export',
    detail: 'Compiling Survey Reliability Index (89/100) & mission dossier...',
  },
};

export default function AppLayout() {
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname);
  const mainRef = useRef<HTMLElement>(null);
  const [isSwitchingLayer, setIsSwitchingLayer] = useState<boolean>(false);
  const [transitionInfo, setTransitionInfo] = useState<{ step: string; title: string; detail: string }>(() => {
    return (
      LAYER_TRANSITION_INFO[location.pathname] || {
        step: 'LAYER PROCESSING',
        title: 'Synchronizing Acoustic Layer',
        detail: 'Connecting to hydrographic telemetry sensors...',
      }
    );
  });

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      const info = LAYER_TRANSITION_INFO[location.pathname] || {
        step: 'LAYER PROCESSING',
        title: 'Synchronizing Acoustic Layer',
        detail: 'Connecting to hydrographic telemetry sensors...',
      };
      setTransitionInfo(info);
      setIsSwitchingLayer(true);

      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }

      const timer = setTimeout(() => {
        setIsSwitchingLayer(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <div className="h-screen w-screen bg-mist flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <div className="flex-1 h-full relative overflow-hidden">
          {isSwitchingLayer && (
            <div className="absolute inset-0 z-50 bg-mist/85 backdrop-blur-[2px] flex items-center justify-center animate-fade-in pointer-events-auto">
              <div className="bg-white border border-navy-100 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col items-center text-center">
                {/* Sindhu Vilochan Ocean Spinner */}
                <div className="relative w-12 h-12 mb-3.5">
                  <div className="w-12 h-12 rounded-full border-2 border-navy-100"></div>
                  <div className="w-12 h-12 rounded-full border-2 border-ocean border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-ocean-50 text-ocean text-[10px] font-mono font-bold tracking-wider mb-2 uppercase border border-ocean-100/50">
                  {transitionInfo.step}
                </div>

                <h4 className="text-sm font-bold text-navy mb-1 tracking-tight">
                  {transitionInfo.title}
                </h4>
                <p className="text-xs text-navy-300 font-mono leading-relaxed">
                  {transitionInfo.detail}
                </p>

                {/* Pulsing Progress Bar */}
                <div className="w-full bg-navy-50 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-ocean animate-pulse rounded-full w-3/4"></div>
                </div>
              </div>
            </div>
          )}
          <main ref={mainRef} className="w-full h-full overflow-y-auto overflow-x-hidden contour-bg">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
