import React from 'react';
import { Landmark } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Logo = ({ size = 'md' }) => (
  <span className="flex items-center gap-2.5">
    <span
      className={cn(
        'flex items-center justify-center bg-accent text-on-accent',
        size === 'lg' ? 'h-9 w-9 rounded-control' : 'h-8 w-8 rounded-[9px]'
      )}
    >
      <Landmark className="w-[18px] h-[18px]" aria-hidden="true" />
    </span>
    <span className={cn('font-bold tracking-tight text-fg', size === 'lg' ? 'text-lg' : 'text-[17px]')}>LedgerX</span>
  </span>
);
