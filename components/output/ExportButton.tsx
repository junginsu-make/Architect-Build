import React from 'react';
import type { DeliverableFormat, ExportTarget } from '../../types/deliverable';

interface ExportButtonProps {
  format: DeliverableFormat;
  target: ExportTarget;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

const ExportButton: React.FC<ExportButtonProps> = ({
  label,
  icon,
  disabled = false,
  disabledReason,
  onClick,
  variant = 'outline',
}) => {
  const baseClasses = 'flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all relative group';
  const variantClasses = {
    primary: 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg shadow-slate-200',
    secondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
    outline: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
  };
  const disabledClasses = 'opacity-40 cursor-not-allowed hover:bg-transparent';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ''}`}
      title={disabled ? disabledReason : undefined}
    >
      {icon}
      <span>{label}</span>
      {disabled && disabledReason && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {disabledReason}
        </span>
      )}
    </button>
  );
};

export default ExportButton;
