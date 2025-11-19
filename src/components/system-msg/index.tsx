import React, { useEffect, useRef } from 'react';
import { RetroWindow } from '@/components/retro-ui';
import { Terminal, Activity } from 'lucide-react';

interface SystemMsgProps {
    logs: { message: string; ts: string }[];
    location?: string;
    season?: string;
    itemCount?: number;
}

export const SystemMsg: React.FC<SystemMsgProps> = ({ logs, location, season, itemCount }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <RetroWindow title="SYSTEM_MSG" icon={<Terminal size={14} />} className="h-full">
            <div className="p-3 h-full flex flex-col font-mono text-xs">
                
                {/* Status Header */}
                <div className="mb-3 pb-2 border-b border-[var(--border)] border-dashed space-y-1">
                    <div className="flex items-center gap-2">
                        <Activity size={12} className="text-[var(--accent-green)] animate-pulse" />
                        <span className="font-bold text-[var(--text)]">Analyzing local trends...</span>
                    </div>
                    <div className="pl-5 text-[var(--text-muted)] space-y-0.5">
                        <p>{`> Season: ${season || 'Unknown'}`}</p>
                        <p>{`> Location: ${location || 'Unknown'}`}</p>
                        <p>{`> Items in database: ${itemCount || 0}`}</p>
                    </div>
                </div>

                {/* Log Stream */}
                <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-2 text-[var(--text)] opacity-80 hover:opacity-100">
                            <span className="text-[var(--text-muted)] shrink-0">[{log.ts.split('T')[1].split('.')[0]}]</span>
                            <span>{log.message}</span>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <div className="mt-2 pt-2 border-t border-[var(--border)] text-[var(--text-muted)] text-[10px]">
                    _
                </div>
            </div>
        </RetroWindow>
    );
};
