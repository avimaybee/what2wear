import React from 'react';
import { RetroWindow, RetroButton } from '@/components/retro-ui';
import { OutfitTemplate } from '@/types/retro';
import { Wand2, ArrowRight, Layers, AlertCircle } from 'lucide-react';

const MOCK_TEMPLATES: (OutfitTemplate & { requirements: string[] })[] = [
    {
        id: 't1',
        name: 'Office Core',
        description: 'Professional yet approachable. Optimized for climate-controlled environments.',
        styleTags: ['Smart', 'Minimal'],
        coverImage: 'https://picsum.photos/300/200?random=20',
        requirements: ['1x Blazer/Jacket', '1x Trousers', '1x Leather Shoes']
    },
    {
        id: 't2',
        name: 'Weekend Warrior',
        description: 'Maximum mobility for urban exploration. Durable fabrics.',
        styleTags: ['Utility', 'Street'],
        coverImage: 'https://picsum.photos/300/200?random=21',
        requirements: ['1x Cargo/Denim', '1x Hoodie', '1x Sneakers']
    },
    {
        id: 't3',
        name: 'Date Night',
        description: 'High-contrast aesthetics for evening social protocols.',
        styleTags: ['Elegant', 'Sharp'],
        coverImage: 'https://picsum.photos/300/200?random=22',
        requirements: ['1x Statement Top', '1x Dark Bottoms', '1x Accessory']
    },
    {
        id: 't4',
        name: 'Rain Defense',
        description: 'Water-resistant layering for high humidity forecasts.',
        styleTags: ['Techwear', 'Functional'],
        coverImage: 'https://picsum.photos/300/200?random=23',
        requirements: ['1x Waterproof Outer', '1x Boots', '1x Hat']
    }
];

export const TemplatesPage: React.FC<{ onApply: (template: OutfitTemplate) => void }> = ({ onApply }) => {
    return (
        <RetroWindow title="STYLE_BLUEPRINTS.LIB" className="h-full" icon={<Wand2 size={14} />}>
            <div className="p-2">
                <div className="bg-[var(--accent-blue)] border-2 border-[var(--border)] p-4 mb-6 flex items-center gap-4 shadow-[4px_4px_0px_0px_var(--border)]">
                    <div className="bg-[var(--bg-secondary)] p-2 border-2 border-[var(--border)] rounded-full">
                         <Layers size={24} className="text-[var(--text)]" />
                    </div>
                    <div>
                        <h2 className="font-black text-xl mb-1 uppercase tracking-tight text-[var(--text)]">Recipe Database</h2>
                        <p className="font-mono text-xs text-[var(--text)] font-bold opacity-80">Select a blueprint to configure the generator constraints.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {MOCK_TEMPLATES.map(template => (
                        <div key={template.id} className="relative group">
                             {/* Background Card Effect */}
                            <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 z-0 border border-[var(--border)]"></div>
                            
                            <div className="relative z-10 bg-[var(--bg-secondary)] border-2 border-[var(--border)] h-full flex flex-col">
                                <div className="border-b-2 border-[var(--border)] bg-[var(--bg-tertiary)] p-1 flex justify-between items-center relative overflow-hidden">
                                     {/* Dotted Background Pattern */}
                                     <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text) 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
                                     
                                     <span className="font-mono text-xs font-bold z-10 relative px-2 text-[var(--text)]">{template.id.toUpperCase()}_V1.0</span>
                                     <div className="flex gap-1 z-10 relative">
                                         {template.styleTags.map(tag => (
                                             <span key={tag} className="text-[9px] border border-[var(--border)] px-1 bg-[var(--bg-main)] uppercase font-bold text-[var(--text)]">{tag}</span>
                                         ))}
                                     </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 shrink-0 border-2 border-[var(--border)] bg-[var(--bg-main)]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={template.coverImage} alt={template.name} className="w-full h-full object-cover transition-all" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl uppercase leading-none mb-2 text-[var(--text)]">{template.name}</h3>
                                            <p className="font-mono text-xs text-[var(--text-muted)] leading-snug">{template.description}</p>
                                        </div>
                                    </div>

                                    <div className="bg-[var(--bg-tertiary)] p-2 border border-[var(--border)] mt-auto">
                                        <span className="block font-mono text-[10px] font-bold uppercase mb-1 border-b border-[var(--border)] border-dashed pb-1 text-[var(--text-muted)]">Ingredients Required:</span>
                                        <ul className="list-none space-y-1">
                                            {template.requirements.map((req, i) => (
                                                <li key={i} className="font-mono text-xs flex items-center gap-2 text-[var(--text)]">
                                                    <div className="w-1.5 h-1.5 bg-[var(--text)]"></div>
                                                    {req}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <RetroButton 
                                        onClick={() => onApply(template)} 
                                        className="w-full flex items-center justify-center gap-2 text-sm font-bold mt-2"
                                        variant="primary"
                                    >
                                        LOAD BLUEPRINT <ArrowRight size={14} />
                                    </RetroButton>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 text-center">
                     <button className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline flex items-center justify-center gap-1 mx-auto">
                        <AlertCircle size={12} />
                        Need a custom formula? Create New Template
                     </button>
                </div>
            </div>
        </RetroWindow>
    );
};
