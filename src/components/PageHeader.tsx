import React from 'react';

interface PageHeaderProps {
  step?: string;
  total?: string;
  title: string;
  subtitle: string;
  rightElement?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, rightElement }: PageHeaderProps) {
  return (
    <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-navy tracking-tight mb-0.5">{title}</h1>
        <p className="text-xs text-navy-400 max-w-3xl leading-relaxed">{subtitle}</p>
      </div>

      {rightElement}
    </div>
  );
}

