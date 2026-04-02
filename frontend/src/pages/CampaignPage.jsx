import { useParams } from 'react-router-dom';
import { Breadcrumb } from '../components/ui';

// Placeholder for SP5 — Campaign page with video grid, insights, trends
export default function CampaignPage() {
  const { id } = useParams();

  return (
    <div className="mt-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: `Campaign ${id}` },
      ]} />
      <div className="mt-8 flex flex-col items-center justify-center min-h-[400px] text-text-ghost">
        <p className="text-lg font-display">Campaign workspace coming in SP5</p>
        <p className="text-sm mt-2">Campaign ID: {id}</p>
      </div>
    </div>
  );
}
