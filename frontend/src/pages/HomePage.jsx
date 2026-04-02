import { useNavigate } from 'react-router-dom';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import Upload from '../components/Upload';
import AnalysisHistory from '../components/AnalysisHistory';

export default function HomePage() {
  const navigate = useNavigate();
  const { analyses, uploadVideo, selectAnalysis, status, reset } = useAnalysisContext();

  const handleUpload = async (file) => {
    const analysisId = await uploadVideo(file);
    if (analysisId) {
      navigate(`/analysis/${analysisId}`);
    }
  };

  const handleSelect = (analysisId) => {
    selectAnalysis(analysisId);
    navigate(`/analysis/${analysisId}`);
  };

  return (
    <div className="mt-8">
      <Upload onUpload={handleUpload} />
      {analyses.length > 0 && (
        <div className="mt-8">
          <AnalysisHistory
            analyses={analyses}
            activeId={null}
            onSelect={handleSelect}
            onNewAnalysis={reset}
          />
        </div>
      )}
    </div>
  );
}
