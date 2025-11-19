import React, { useEffect, useState } from 'react';
import { X, Minus, Square, AlertCircle, Check, Info } from 'lucide-react';

interface RetroBoxProps {
  children: React.ReactNode;
  className?: string;
  color?: string; // Tailwind color class (e.g., bg-pink-300)
  noShadow?: boolean;
}

export const RetroBox: React.FC<RetroBoxProps> = ({ children, className = '', color = 'bg-white', noShadow = false }) => {
  return (
    <div className={`${color} border-2 border-black ${noShadow ? '' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'} p-4 ${className}`}>
      {children}
    </div>
  );
};

interface RetroCardProps {
    children: React.ReactNode;
    className?: string;
    noHover?: boolean;
}

export const RetroCard: React.FC<RetroCardProps> = ({ children, className = '', noHover = false }) => {
    return (
        <div className={`
            bg-white border-2 border-black p-2 
            ${!noHover ? 'transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
            ${className}
        `}>
            {children}
        </div>
    )
}

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'neutral';
}

export const RetroButton: React.FC<RetroButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  let bgClass = 'bg-[#A0C4FF]'; // Blue default
  if (variant === 'secondary') bgClass = 'bg-[#FF99C8]'; // Pink
  if (variant === 'danger') bgClass = 'bg-[#FF8E72]'; // Orange/Red
  if (variant === 'neutral') bgClass = 'bg-white';

  return (
    <button
      className={`
        ${bgClass} 
        border-2 border-black 
        px-4 py-2 
        font-bold 
        text-black 
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
        transition-all 
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

interface RetroWindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
}

export const RetroWindow: React.FC<RetroWindowProps> = ({ title, children, className = '', onClose, icon }) => {
  return (
    <div className={`bg-[#FFF8E7] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col ${className}`}>
      {/* Window Header */}
      <div className="bg-[#FF8E72] border-b-2 border-black p-1 px-2 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 pl-1">
          {icon && <span className="text-black">{icon}</span>}
          <span className="font-bold font-mono text-sm uppercase tracking-wider text-black truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 border-2 border-black bg-white flex items-center justify-center hover:bg-gray-100 cursor-default">
            <Minus size={12} strokeWidth={4} className="text-black" />
          </div>
          <div className="w-5 h-5 border-2 border-black bg-white flex items-center justify-center hover:bg-gray-100 cursor-default">
            <Square size={10} strokeWidth={4} className="text-black" />
          </div>
          <button 
            onClick={onClose}
            className="w-5 h-5 border-2 border-black bg-[#FF99C8] flex items-center justify-center hover:bg-[#ff6b6b] transition-colors active:bg-red-500 group" 
            aria-label="Close"
          >
            <X size={14} strokeWidth={4} className="text-black group-hover:text-white" />
          </button>
        </div>
      </div>
      {/* Window Content */}
      <div className="flex-1 p-4 overflow-auto relative flex flex-col">
        {/* Stripes texture for aesthetics in background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none z-0" 
             style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }}>
        </div>
        <div className="relative z-10 flex-1 flex flex-col text-black">
            {children}
        </div>
      </div>
    </div>
  );
};

export const RetroBadge: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({ children, color = 'bg-[#FDFFB6]', className = '' }) => (
  <span className={`${color} border-2 border-black px-2 py-0.5 text-xs font-bold uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black ${className}`}>
    {children}
  </span>
);

export const RetroInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    className="w-full border-2 border-black p-2 font-mono text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FF99C8] focus:border-black placeholder:text-gray-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] disabled:bg-gray-200 disabled:cursor-not-allowed"
    {...props}
  />
);

export const RetroSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
        <select 
            className="w-full appearance-none border-2 border-black p-2 font-mono text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FF99C8] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] pr-8"
            {...props}
        >
            {props.children}
        </select>
        <div className="absolute right-2 top-3 pointer-events-none">
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-black"></div>
        </div>
    </div>
  );

interface RetroSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    minLabel?: string;
    maxLabel?: string;
}

export const RetroSlider: React.FC<RetroSliderProps> = ({ label, minLabel, maxLabel, className, ...props }) => {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label className="font-bold font-mono text-xs uppercase">{label}</label>
            <div className="relative flex items-center gap-2">
                {minLabel && <span className="text-[10px] font-mono">{minLabel}</span>}
                <input 
                    type="range" 
                    className="w-full h-4 bg-white border-2 border-black appearance-none cursor-pointer accent-black
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#FF99C8] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    "
                    {...props} 
                />
                {maxLabel && <span className="text-[10px] font-mono">{maxLabel}</span>}
            </div>
        </div>
    );
};

interface RetroToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const RetroToggle: React.FC<RetroToggleProps> = ({ label, checked, onChange }) => {
    return (
        <div className="flex items-center justify-between cursor-pointer" onClick={() => onChange(!checked)}>
            <span className="font-mono text-sm">{label}</span>
            <div className={`w-12 h-6 border-2 border-black relative transition-colors ${checked ? 'bg-[#CAFFBF]' : 'bg-gray-300'}`}>
                <div className={`absolute top-[-2px] left-[-2px] w-6 h-6 bg-white border-2 border-black transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}></div>
            </div>
        </div>
    );
};

interface RetroToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const RetroToast: React.FC<RetroToastProps> = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    let bg = 'bg-[#FDFFB6]'; // Info yellow
    let icon = <Info size={18} />;
    if (type === 'success') { bg = 'bg-[#CAFFBF]'; icon = <Check size={18} />; }
    if (type === 'error') { bg = 'bg-[#FF8E72]'; icon = <AlertCircle size={18} />; }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-right-10 fade-in duration-300">
             <div className={`${bg} border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 min-w-[240px]`}>
                <div className="bg-white border-2 border-black p-1 rounded-full">
                    {icon}
                </div>
                <span className="font-mono text-sm font-bold text-black">{message}</span>
                <button onClick={onClose} className="ml-auto hover:bg-black/10 p-1 rounded">
                    <X size={14} />
                </button>
             </div>
        </div>
    );
};
