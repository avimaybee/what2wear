import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, ScanLine, Loader2 } from 'lucide-react';
import { RetroButton, RetroInput, RetroWindow, RetroSelect, RetroSlider, RetroToggle } from '@/components/retro-ui';
import { ClothingItem, ClothingType, ClothingMaterial, Season } from '@/types/retro';
import { processImageUpload } from '@/lib/imageProcessor';
import { dataUrlToFile } from '@/lib/utils';

interface WardrobeItemFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Partial<ClothingItem>, file?: File) => void;
    initialItem?: ClothingItem | null;
    onAnalyzeImage?: (base64: string) => Promise<Partial<ClothingItem> | null>;
}

export const WardrobeItemForm: React.FC<WardrobeItemFormProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialItem, 
    onAnalyzeImage 
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [processedFile, setProcessedFile] = useState<File | null>(null);

    // Processing State
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [processStatus, setProcessStatus] = useState<string>('IDLE');
    const [removeBgEnabled, setRemoveBgEnabled] = useState(true);

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Form State
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState<ClothingType>('Top');
    const [newItemMaterial, setNewItemMaterial] = useState<ClothingMaterial>('Cotton');
    const [newItemInsulation, setNewItemInsulation] = useState<number>(5);
    const [newItemSeasons, setNewItemSeasons] = useState<Season[]>([]);
    const [newItemStyleTags, setNewItemStyleTags] = useState<string[]>([]);
    const [newItemPattern, setNewItemPattern] = useState<string>('');
    const [newItemFit, setNewItemFit] = useState<string>('Regular');

    const categories: ClothingType[] = ['Top', 'Bottom', 'Shoes', 'Outerwear', 'Accessory', 'Dress'];

    useEffect(() => {
        if (isOpen) {
            if (initialItem) {
                setNewItemName(initialItem.name);
                setNewItemCategory(initialItem.category);
                setNewItemMaterial(initialItem.material as ClothingMaterial);
                setNewItemInsulation(initialItem.insulation_value);
                setNewItemSeasons(initialItem.season_tags as Season[]);
                setNewItemStyleTags(initialItem.style_tags);
                setNewItemPattern(initialItem.pattern || '');
                setNewItemFit(initialItem.fit || 'Regular');
                setPreviewUrl(initialItem.image_url);
                setProcessedFile(null);
            } else {
                resetForm();
            }
        }
    }, [isOpen, initialItem]);

    const resetForm = () => {
        setPreviewUrl(null);
        setNewItemName('');
        setNewItemCategory('Top');
        setNewItemMaterial('Cotton');
        setNewItemInsulation(5);
        setNewItemSeasons([]);
        setNewItemStyleTags([]);
        setNewItemPattern('');
        setNewItemFit('Regular');
        setRemoveBgEnabled(true);
        setIsProcessingImage(false);
        setProcessedFile(null);
    };

    const handleSaveItem = (e: React.FormEvent) => {
        e.preventDefault();
        const itemPayload: Partial<ClothingItem> = {
            name: newItemName,
            category: newItemCategory,
            material: newItemMaterial,
            insulation_value: newItemInsulation,
            season_tags: newItemSeasons.length > 0 ? newItemSeasons : ['All Season'],
            image_url: previewUrl || 'https://picsum.photos/200/300',
            style_tags: newItemStyleTags,
            pattern: newItemPattern || 'Solid',
            fit: newItemFit,
            dress_code: ['Casual'],
        };

        const resolvedFile = processedFile ?? undefined;

        if (initialItem) {
            onSave({ ...itemPayload, id: initialItem.id }, resolvedFile);
        } else {
            onSave({ ...itemPayload, wear_count: 0, is_favorite: false, created_at: new Date().toISOString() }, resolvedFile);
        }
        
        onClose();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const processFile = async (file: File) => {
        setIsProcessingImage(true);
        setProcessStatus('INITIALIZING');
        const originalName = file.name || 'wardrobe-item.webp';

        try {
            const optimizedBase64 = await processImageUpload(file, {
                removeBackground: removeBgEnabled,
                maxWidth: 1024,
                quality: 0.8,
                onProgress: (status, percent) => setProcessStatus(`${status} ${percent}%`)
            });

            setPreviewUrl(optimizedBase64);
            try {
                const optimizedFile = dataUrlToFile(optimizedBase64, originalName);
                setProcessedFile(optimizedFile);
            } catch (conversionError) {
                console.error('Failed to convert optimized image to file', conversionError);
                setProcessedFile(file);
            }
            setIsProcessingImage(false);

            // Trigger Auto-Analysis only for new items if not editing
            if (onAnalyzeImage && optimizedBase64 && !initialItem) {
                setIsAnalyzing(true);
                const result = await onAnalyzeImage(optimizedBase64);
                if (result) {
                    if (result.name) setNewItemName(result.name);
                    if (result.category) setNewItemCategory(result.category);
                    if (result.material) setNewItemMaterial(result.material as ClothingMaterial);
                    if (result.insulation_value !== undefined) setNewItemInsulation(result.insulation_value);
                    if (result.season_tags) setNewItemSeasons(result.season_tags as Season[]);
                    if (result.style_tags) setNewItemStyleTags(result.style_tags);
                    if (result.pattern) setNewItemPattern(result.pattern);
                    if (result.fit) setNewItemFit(result.fit);
                }
                setIsAnalyzing(false);
            }

        } catch (error) {
            console.error(error);
            setIsProcessingImage(false);
            // Fallback to simple read if pipeline fails
            const reader = new FileReader();
            reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
            reader.readAsDataURL(file);
            setProcessedFile(file);
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        setProcessedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleSeason = (season: Season) => {
        if (newItemSeasons.includes(season)) {
            setNewItemSeasons(prev => prev.filter(s => s !== season));
        } else {
            setNewItemSeasons(prev => [...prev, season]);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="max-w-md w-full animate-in zoom-in-95 duration-200">
                <RetroWindow title={initialItem ? "UPDATE_ITEM.EXE" : "NEW_ITEM_WIZARD"} onClose={onClose}>
                    <form onSubmit={handleSaveItem} className="space-y-4 p-2 max-h-[80vh] overflow-y-auto">
                        
                        {/* Image Upload */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileSelect} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        
                        <div className="flex justify-between items-center px-1">
                            <label className="font-bold font-mono text-xs uppercase text-[var(--text)]">Item Image</label>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-[var(--text-muted)]">AI REMOVE BG:</span>
                                <RetroToggle 
                                    label=""
                                    checked={removeBgEnabled}
                                    onChange={setRemoveBgEnabled}
                                />
                            </div>
                        </div>

                        <div 
                            onClick={triggerFileInput}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className={`
                                border-2 border-[var(--border)] border-dashed 
                                ${previewUrl ? 'p-0' : 'p-6 bg-[var(--bg-secondary)] hover:bg-[var(--bg-main)]'} 
                                flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-colors relative overflow-hidden min-h-[180px]
                            `}
                        >
                            {previewUrl ? (
                                <>
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            fill
                                            sizes="100vw"
                                            className="object-contain bg-[var(--bg-tertiary)]"
                                        />
                                    </div>
                                    
                                    {/* Scanning/Processing Overlay */}
                                    {(isAnalyzing || isProcessingImage) && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm p-4">
                                            {isProcessingImage ? (
                                                <>
                                                    <Loader2 size={32} className="text-[var(--accent-blue)] animate-spin mb-2" />
                                                    <span className="font-mono font-bold text-[var(--accent-blue)] bg-black px-2 border border-[var(--accent-blue)] text-xs animate-pulse">{processStatus}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ScanLine size={32} className="text-[#00ff41] animate-bounce mb-2" />
                                                    <span className="font-mono font-bold text-[#00ff41] animate-pulse bg-black px-2 text-xs">ANALYZING METADATA...</span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <button 
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute top-2 right-2 bg-[var(--accent-orange)] border-2 border-[var(--border)] p-1 hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_var(--border)] z-10"
                                    >
                                        <X size={16} className="text-white" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    {isProcessingImage ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 size={32} className="text-[var(--text-muted)] animate-spin" />
                                            <span className="font-mono text-xs mt-2 text-[var(--text)]">{processStatus}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={32} className="text-[var(--text-muted)]" />
                                            <span className="font-mono text-xs text-[var(--text-muted)]">CLICK OR DRAG TO UPLOAD</span>
                                            <span className="font-mono text-[9px] bg-[var(--accent-green)] border border-[var(--border)] px-1 text-[var(--text)] mt-1">
                                                {removeBgEnabled ? 'BG REMOVAL ACTIVE' : 'AUTO-OPTIMIZE ON'}
                                            </span>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        
                        <div>
                            <label className="font-bold font-mono text-xs uppercase block mb-1 text-[var(--text)]">Item Name {isAnalyzing && <span className="animate-pulse">...</span>}</label>
                            <RetroInput 
                                placeholder="e.g. Vintage Denim Jacket" 
                                required 
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                disabled={isAnalyzing || isProcessingImage}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="font-bold font-mono text-xs uppercase block mb-1 text-[var(--text)]">Category</label>
                                <RetroSelect value={newItemCategory} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItemCategory(e.target.value as ClothingType)} disabled={isAnalyzing || isProcessingImage}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </RetroSelect>
                            </div>
                            <div>
                                <label className="font-bold font-mono text-xs uppercase block mb-1 text-[var(--text)]">Material</label>
                                <RetroSelect value={newItemMaterial} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItemMaterial(e.target.value as ClothingMaterial)} disabled={isAnalyzing || isProcessingImage}>
                                    {['Cotton', 'Polyester', 'Wool', 'Leather', 'Denim', 'Linen', 'Synthetic', 'Gore-Tex', 'Other'].map(m => 
                                        <option key={m} value={m}>{m}</option>
                                    )}
                                </RetroSelect>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="font-bold font-mono text-xs uppercase block mb-1 text-[var(--text)]">Pattern</label>
                                <RetroSelect value={newItemPattern} onChange={(e) => setNewItemPattern(e.target.value)} disabled={isAnalyzing || isProcessingImage}>
                                    {['Solid', 'Striped', 'Plaid', 'Floral', 'Graphic', 'Camo', 'Polka Dot', 'Other'].map(p => 
                                        <option key={p} value={p}>{p}</option>
                                    )}
                                </RetroSelect>
                            </div>
                            <div>
                                <label className="font-bold font-mono text-xs uppercase block mb-1 text-[var(--text)]">Fit</label>
                                <RetroSelect value={newItemFit} onChange={(e) => setNewItemFit(e.target.value)} disabled={isAnalyzing || isProcessingImage}>
                                    {['Regular', 'Slim', 'Oversized', 'Loose', 'Tight', 'Tailored'].map(f => 
                                        <option key={f} value={f}>{f}</option>
                                    )}
                                </RetroSelect>
                            </div>
                        </div>

                        <RetroSlider 
                            label={`Insulation Value (Warmth: ${newItemInsulation}/10)`} 
                            min="0" max="10" 
                            value={newItemInsulation}
                            onChange={(e) => setNewItemInsulation(parseInt(e.target.value))}
                            minLabel="Light" maxLabel="Heavy"
                            disabled={isAnalyzing || isProcessingImage}
                        />

                        <div>
                            <label className="font-bold font-mono text-xs uppercase block mb-1 text-[var(--text)]">Seasons</label>
                            <div className="flex flex-wrap gap-2">
                                {['Spring', 'Summer', 'Autumn', 'Winter'].map((season) => (
                                    <button
                                        type="button"
                                        key={season}
                                        onClick={() => toggleSeason(season as Season)}
                                        disabled={isAnalyzing || isProcessingImage}
                                        className={`px-2 py-1 border-2 border-[var(--border)] font-mono text-xs ${newItemSeasons.includes(season as Season) ? 'bg-[var(--accent-green)] text-[var(--text)]' : 'bg-[var(--bg-secondary)] text-[var(--text)]'}`}
                                    >
                                        {season}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {newItemStyleTags.length > 0 && (
                            <div>
                                <label className="font-bold font-mono text-xs uppercase block mb-1 text-[var(--text)]">Detected Tags</label>
                                <div className="flex flex-wrap gap-1">
                                    {newItemStyleTags.map(tag => (
                                        <span key={tag} className="text-[9px] bg-[var(--bg-main)] border border-[var(--border)] px-1 text-[var(--text)]">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <RetroButton type="submit" className="w-full py-2" disabled={isAnalyzing || isProcessingImage}>
                                {isAnalyzing ? 'PROCESSING IMAGE...' : (initialItem ? 'UPDATE ITEM' : 'SAVE TO DATABASE')}
                            </RetroButton>
                        </div>
                    </form>
                </RetroWindow>
            </div>
        </div>
    );
};
