import { Routes, Route } from 'react-router-dom';
import StationPage from './pages/StationPage';
import JobStatusPage from './pages/JobStatusPage';

export default function App() {
  return (
    <Routes>
      <Route path="/station/:stationId" element={<StationPage />} />
      <Route path="/job/:jobId" element={<JobStatusPage />} />
      <Route path="*" element={<StationPage />} />
    </Routes>
  );
}
