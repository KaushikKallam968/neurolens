import { Dropdown } from './ui';

const CONTENT_TYPES = [
  { value: 'short-form', label: 'Short-Form (TikTok, Reels)' },
  { value: 'ad', label: 'Advertisement' },
  { value: 'youtube', label: 'YouTube Long-Form' },
  { value: 'podcast-clip', label: 'Podcast Clip' },
  { value: 'custom', label: 'Custom (No Adjustment)' },
];

export default function ContentTypeSelector({ value = 'custom', onChange, className = '' }) {
  const selected = CONTENT_TYPES.find(t => t.value === value) || CONTENT_TYPES[4];

  return (
    <Dropdown
      trigger={selected.label}
      items={CONTENT_TYPES}
      onSelect={(item) => onChange?.(item.value)}
      className={className}
    />
  );
}

export { CONTENT_TYPES };
