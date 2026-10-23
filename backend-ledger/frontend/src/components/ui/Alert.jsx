import React from 'react';
import { AlertTriangle, Info, Snowflake } from 'lucide-react';
import { cn } from '../../utils/cn';

const tones = {
  warning: { box: 'bg-warn-soft border-warn/30', icon: AlertTriangle, iconClass: 'text-warn' },
  info: { box: 'bg-info-soft border-info/30', icon: Info, iconClass: 'text-info' },
  frozen: { box: 'bg-info-soft border-info/30', icon: Snowflake, iconClass: 'text-info' },
};

export const Alert = ({ tone = 'info', title, children, className }) => {
  const style = tones[tone] || tones.info;
  const Icon = style.icon;

  return (
    <div role="status" className={cn('flex items-start gap-3 rounded-card border p-4', style.box, className)}>
      <Icon className={cn('w-5 h-5 shrink-0 mt-px', style.iconClass)} aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold text-fg">{title}</p>}
        {children && <div className={cn('text-muted leading-relaxed', title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
};
