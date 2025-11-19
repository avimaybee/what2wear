import React from 'react';
import { RetroWindow, RetroSlider, RetroToggle } from '@/components/retro-ui';
import { Sliders, User } from 'lucide-react';
import { UserPreferences } from '@/types/retro';

interface SettingsPageProps {
    onLogout: () => void;
    preferences: UserPreferences;
    onUpdate: (prefs: Partial<UserPreferences>) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ preferences, onUpdate }) => {
    const availableVibes = ['Streetwear', 'Vintage', 'Minimalist', 'Y2K', 'Gorpcore', 'Business', 'Techwear'];

    const toggleVibe = (vibe: string) => {
        const current = preferences.styles || [];
        if (current.includes(vibe)) {
            onUpdate({ styles: current.filter(v => v !== vibe) });
        } else {
            onUpdate({ styles: [...current, vibe] });
        }
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Algorithm Tuning Column */}
            <div className="flex flex-col gap-6">
                <RetroWindow title="ALGORITHM_TUNING.CFG" icon={<Sliders size={14} />}>
                    <div className="space-y-6 p-2">
                        <div className="bg-[#FFF8E7] border border-black p-3 text-xs font-mono text-gray-600 mb-4">
                            Adjusting these values will directly impact the recommendation engine&apos;s output variance.
                        </div>

                        <RetroSlider 
                            label="Repeat Avoidance (Days)" 
                            min="0" max="30" 
                            value={preferences.variety_days || 0}
                            onChange={(e) => onUpdate({ variety_days: parseInt(e.target.value) })}
                            minLabel="Ignore" maxLabel="Strict"
                        />

                        <RetroSlider 
                            label="Temp Sensitivity" 
                            min="-2" max="2" 
                            value={preferences.temperature_sensitivity || 0}
                            onChange={(e) => onUpdate({ temperature_sensitivity: parseInt(e.target.value) })}
                            minLabel="Cold" maxLabel="Hot"
                        />

                        <div className="border-t-2 border-black border-dashed pt-4">
                            <label className="font-bold font-mono text-xs uppercase mb-2 block">Experimental Features</label>
                            <div className="space-y-2">
                                <RetroToggle label="Texture Matching AI" checked={true} onChange={()=>{}} />
                                <RetroToggle label="Color Theory Enforcement" checked={true} onChange={()=>{}} />
                            </div>
                        </div>
                    </div>
                </RetroWindow>
            </div>

            {/* Style Profile & Account Column */}
            <div className="flex flex-col gap-6">
                <RetroWindow title="USER_DNA_PROFILE" icon={<User size={14} />}>
                    <div className="p-2 space-y-6">
                        
                        {/* Gender Context - Removed as it's not in UserPreferences interface yet, or I need to add it */}
                        {/* 
                        <div>
                             <label className="font-bold font-mono text-xs uppercase mb-2 block">Gender Context</label>
                             <div className="flex border-2 border-black bg-white">
                                {['MASC', 'FEM', 'NEUTRAL'].map(g => (
                                    <button 
                                        key={g}
                                        onClick={() => onUpdate({ gender: g as any })}
                                        className={`flex-1 py-2 font-mono text-xs font-bold hover:bg-gray-100 ${preferences.gender === g ? 'bg-[#FF99C8] text-black' : 'text-gray-500'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                             </div>
                        </div>
                        */}

                        <div>
                            <label className="font-bold font-mono text-xs uppercase mb-2 block">Active Aesthetics</label>
                            <div className="flex flex-wrap gap-2">
                                {availableVibes.map(vibe => (
                                    <button
                                        key={vibe}
                                        onClick={() => toggleVibe(vibe)}
                                        className={`
                                            px-2 py-1 text-xs font-mono border border-black transition-all
                                            ${preferences.styles?.includes(vibe) 
                                                ? 'bg-[#FDFFB6] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold' 
                                                : 'bg-white hover:bg-gray-100 text-gray-500'
                                            }
                                        `}
                                    >
                                        {vibe}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </RetroWindow>
            </div>
        </div>
    );
};
