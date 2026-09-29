import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from '@/pages/Landing';
import AppLayout from '@/components/AppLayout';
import SurveyIngestion from '@/pages/SurveyIngestion';
import SonarAnalysis from '@/pages/SonarAnalysis';
import EvidenceIntelligence from '@/pages/EvidenceIntelligence';
import HumanReview from '@/pages/HumanReview';
import DebrisHotspots from '@/pages/DebrisHotspots';
import Reports from '@/pages/Reports';
import MissionReportPrint from '@/pages/MissionReportPrint';
import { PipelineProvider } from '@/context/PipelineContext';

function App() {
  return (
    <PipelineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/print-report" element={<MissionReportPrint />} />
          <Route element={<AppLayout />}>
            <Route path="/survey-ingestion" element={<SurveyIngestion />} />
            <Route path="/sonar-analysis" element={<SonarAnalysis />} />
            <Route path="/evidence-intelligence" element={<EvidenceIntelligence />} />
            <Route path="/human-review" element={<HumanReview />} />
            <Route path="/debris-hotspots" element={<DebrisHotspots />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PipelineProvider>
  );
}

export default App;
