import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-700 border border-gray-200',
    neutral: 'bg-gray-50 text-gray-600 border border-gray-200',
    primary: 'bg-red-50 text-red-700 border border-red-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-gray-400',
    neutral: 'bg-gray-400',
    primary: 'bg-red-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium rounded gap-1',
    md: 'px-2.5 py-0.5 text-xs font-medium rounded-md gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center tracking-tight whitespace-nowrap transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const ScoreBadge: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({
  score,
  size = 'md',
}) => {
  let colorClass = 'bg-gray-100 text-gray-700 border-gray-300';
  let dotColor = 'bg-gray-500';

  if (score >= 80) {
    colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-600';
  } else if (score >= 60) {
    colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-600';
  } else if (score >= 40) {
    colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-600';
  } else {
    colorClass = 'bg-red-50 text-red-800 border-red-200';
    dotColor = 'bg-red-600';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold rounded',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-md',
    lg: 'px-3 py-1.5 text-sm font-bold rounded-md',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono border ${sizeClasses[size]} ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {score}%
    </span>
  );
};

export const CandidateStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    novo: { label: 'Novo', variant: 'default' },
    triagem: { label: 'Em Triagem', variant: 'info' },
    pre_selecionado: { label: 'Pré-selecionado', variant: 'primary' },
    entrevista: { label: 'Entrevista', variant: 'warning' },
    teste: { label: 'Em Teste', variant: 'purple' },
    aprovado: { label: 'Aprovado', variant: 'success' },
    contratado: { label: 'Contratado', variant: 'success' },
    reprovado: { label: 'Reprovado', variant: 'neutral' },
  };

  const item = map[status] || { label: status, variant: 'default' };
  return <Badge variant={item.variant} dot>{item.label}</Badge>;
};
