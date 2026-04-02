import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="font-display text-6xl font-bold text-text-ghost">404</h1>
      <p className="font-body text-lg text-text-dim">This page doesn't exist.</p>
      <Link to="/">
        <Button variant="secondary">Back to Home</Button>
      </Link>
    </div>
  );
}
