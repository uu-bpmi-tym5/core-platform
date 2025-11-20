import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-muted',
        className,
      )}
      {...props}
    >
      <div
        className="h-full flex-1 rounded-full bg-primary transition-all"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

