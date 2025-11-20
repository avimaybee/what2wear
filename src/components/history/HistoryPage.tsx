import React from 'react';
import { RetroWindow, RetroButton, RetroImage } from '@/components/retro-ui';
import { Outfit } from '@/types/retro';
import { Calendar, Star, Trash2, RotateCcw, Tag } from 'lucide-react';

interface HistoryPageProps {
    history: Outfit[];
    onDelete: (id: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onDelete }) => {
  return (
    <RetroWindow title="OUTFIT_LOGS.DB" className="h-full" icon={<Calendar size={14} />}>
        <div className="space-y-6 p-2 max-w-3xl mx-auto h-full overflow-y-auto">
            {history.length === 0 ? (
                <div className="text-center py-12 font-mono text-[var(--text-muted)]">
                    <p>NO LOGS FOUND.</p>
                    <p>START TRACKING YOUR FITS.</p>
                </div>
            ) : (
                history.map((log) => (
                    <div key={log.id} className="bg-[var(--bg-secondary)] border-2 border-[var(--border)] shadow-[6px_6px_0px_0px_var(--border)] p-1 relative group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_var(--border)] transition-all duration-200">
                        
                        {/* File Tab Styling */}
                        <div className="absolute -top-7 left-4 bg-[var(--accent-pink)] border-2 border-[var(--border)] border-b-0 px-3 py-1 z-0">
                            <span className="font-mono font-bold text-xs text-[var(--text)] mix-blend-hard-light">{log.outfit_date}</span>
                        </div>

                        <div className="relative z-10 bg-[var(--bg-secondary)] p-4 border-2 border-transparent">
                            <div className="flex flex-col md:flex-row gap-6">
                                
                                {/* Visual Stack of Items */}
                                <div className="flex-shrink-0 w-full md:w-1/3">
                                    <div className="grid grid-cols-2 gap-2 bg-[var(--bg-tertiary)] p-2 border-2 border-[var(--border)] border-dashed">
                                        {log.items.slice(0, 4).map((item, i) => (
                                            <div key={i} className="aspect-square border border-[var(--border)] overflow-hidden bg-[var(--bg-main)] relative">
                                                <RetroImage 
                                                    src={item.image_url} 
                                                    alt={item.name} 
                                                    containerClassName="w-full h-full border-0"
                                                />
                                            </div>
                                        ))}
                                        {log.items.length > 4 && (
                                            <div className="absolute bottom-2 right-2 bg-black text-white text-[10px] font-mono px-1 border border-[var(--border)]">
                                                +{log.items.length - 4} MORE
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-black text-lg uppercase text-[var(--text)]">LOG #{log.id}</h3>
                                            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                                                <span className="bg-[var(--accent-yellow)] px-1 border border-[var(--border)] text-[var(--text)] font-bold">
                                                    {(log.weather_snapshot?.condition as string) || 'N/A'}, {(log.weather_snapshot?.temp as string) || '?'}°C
                                                </span>
                                                {log.rating !== undefined && (
                                                    <div className="flex items-center gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={10} className={i < (log.rating || 0) ? "fill-[var(--text)] text-[var(--text)]" : "text-[var(--text-muted)] opacity-30"} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <RetroButton 
                                            variant="danger" 
                                            className="p-1.5"
                                            onClick={() => {
                                                if(window.confirm("Delete this log entry?")) onDelete(log.id);
                                            }}
                                            title="Delete Log"
                                        >
                                            <Trash2 size={14} />
                                        </RetroButton>
                                    </div>

                                    <div className="mb-4">
                                         <p className="font-mono text-xs text-[var(--text-muted)] mb-1">ITEMS WORN:</p>
                                         <div className="flex flex-wrap gap-1">
                                            {log.items.map(item => (
                                                <span key={item.id} className="text-[10px] border border-[var(--border)] px-1 py-0.5 bg-[var(--accent-green)] flex items-center gap-1 text-[var(--text)]">
                                                    <Tag size={8} /> {item.name}
                                                </span>
                                            ))}
                                         </div>
                                    </div>

                                    <div className="mt-auto pt-3 border-t-2 border-[var(--border)] border-dashed flex justify-end">
                                        <RetroButton className="flex items-center gap-2 text-xs py-1.5" variant="primary">
                                            <RotateCcw size={12} /> WEAR THIS AGAIN
                                        </RetroButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </RetroWindow>
  );
};

