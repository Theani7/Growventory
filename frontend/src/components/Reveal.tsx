import { type ReactNode } from 'react';
import { useInView } from '../hooks/useInView';

type RevealVariant = 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-in' | 'blur-in';

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number; // ms
  duration?: number; // ms
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  threshold?: number;
  once?: boolean;
}

const variantClass: Record<RevealVariant, string> = {
  'fade-up': 'rv-fade-up',
  'fade-in': 'rv-fade-in',
  'slide-left': 'rv-slide-left',
  'slide-right': 'rv-slide-right',
  'scale-in': 'rv-scale-in',
  'blur-in': 'rv-blur-in',
};

export function Reveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  className = '',
  as: Tag = 'div',
  threshold = 0.15,
  once = true,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold, once });
  const Component = Tag as unknown as 'div';

  return (
    <Component
      ref={ref}
      className={`${variantClass[variant]} ${inView ? 'rv-in' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: `${duration}ms` }}
    >
      {children}
    </Component>
  );
}
