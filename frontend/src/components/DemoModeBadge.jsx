import { DEMO_MODE } from '../lib/supabase';
import { Badge } from './ui';

export default function DemoModeBadge() {
  if (!DEMO_MODE) return null;

  return (
    <Badge variant="warning" size="sm">
      DEMO
    </Badge>
  );
}
