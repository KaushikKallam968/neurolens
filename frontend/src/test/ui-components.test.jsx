import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  Badge,
  Tooltip,
  Modal,
  Skeleton,
  SkeletonText,
  Breadcrumb,
} from '../components/ui';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-primary');
  });

  it('supports disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('accepts className for composition', () => {
    render(<Button className="my-class">Test</Button>);
    expect(screen.getByRole('button').className).toContain('my-class');
  });
});

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Content</p></Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies padding by default', () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild.className).toContain('p-5');
  });

  it('removes padding when padding=false', () => {
    const { container } = render(<Card padding={false}>Test</Card>);
    expect(container.firstChild.className).not.toContain('p-5');
  });
});

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Required field" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
  });

  it('sets aria-invalid on error', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success').className).toContain('text-score-high');
  });
});

describe('Tooltip', () => {
  it('renders children', () => {
    render(<Tooltip content="Help text"><button>Hover me</button></Tooltip>);
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('renders when open', () => {
    render(<Modal open={true} onClose={() => {}} title="Test Modal"><p>Body</p></Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Modal open={false} onClose={() => {}} title="Hidden"><p>Body</p></Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has close button with aria-label', () => {
    render(<Modal open={true} onClose={() => {}} title="Test"><p>Body</p></Modal>);
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test"><p>Body</p></Modal>);
    await userEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Skeleton', () => {
  it('renders with loading status', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('SkeletonText', () => {
  it('renders correct number of lines', () => {
    render(<SkeletonText lines={4} />);
    expect(screen.getByRole('status', { name: 'Loading text' }).children).toHaveLength(4);
  });
});

describe('Breadcrumb', () => {
  it('renders items', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Campaign' },
        ]} />
      </MemoryRouter>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Campaign')).toBeInTheDocument();
  });

  it('marks last item as current page', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Analysis' },
        ]} />
      </MemoryRouter>
    );
    expect(screen.getByText('Analysis')).toHaveAttribute('aria-current', 'page');
  });

  it('has nav with aria-label', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={[{ label: 'Home' }]} />
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });
});
