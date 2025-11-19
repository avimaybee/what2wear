import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Plus, Search, Upload, X, Trash2, Filter, AlertTriangle, Clock, Heart, Thermometer, ScanLine } from 'lucide-react';
import { RetroButton, RetroInput, RetroCard, RetroWindow, RetroSelect, RetroSlider } from '@/components/retro-ui';
import { ClothingItem, ClothingType, ClothingMaterial, Season } from '@/types/retro';

interface WardrobeGridProps {
    items: ClothingItem[];
    onAddItem: (item: Partial<ClothingItem>, file?: File) => void;
    onDelete: (id: string) => void;
    isAdding: boolean;
    onOpenAdd: () => void;
    onCloseAdd: () => void;
    onToggleFavorite: (id: string) => void;
    onAnalyzeImage?: (base64: string) => Promise<Partial<ClothingItem> | null>;
}

export const WardrobeGrid: React.FC<WardrobeGridProps> = ({ items, onAddItem, onDelete, isAdding, onOpenAdd, onCloseAdd, onToggleFavorite, onAnalyzeImage }) => {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ClothingType>('Top');
  const [newItemMaterial, setNewItemMaterial] = useState<ClothingMaterial>('Cotton');
  const [newItemInsulation, setNewItemInsulation] = useState<number>(5);
  const [newItemSeasons, setNewItemSeasons] = useState<Season[]>([]);
  const [newItemStyleTags, setNewItemStyleTags] = useState<string[]>([]);

  const categories: ClothingType[] = ['Top', 'Bottom', 'Shoes', 'Outerwear', 'Accessory', 'Dress'];
  const tabs = ['ALL', ...categories];

  const filteredItems = items.filter(item => {
    const matchesCategory = activeTab === 'ALL' || item.category === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.style_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: Partial<ClothingItem> = {
        name: newItemName,
        category: newItemCategory,
        material: newItemMaterial,
        insulation_value: newItemInsulation,
        season_tags: newItemSeasons.length > 0 ? newItemSeasons : ['All Season'],
        image_url: previewUrl || 'https://picsum.photos/200/300?grayscale',
        style_tags: newItemStyleTags,
        dress_code: ['Casual'],
        wear_count: 0,
        is_favorite: false,
        created_at: new Date().toISOString()
    };
    onAddItem(newItem, selectedFile || undefined);
    resetForm();
  };

  const resetForm = () => {
      setPreviewUrl(null);
      setSelectedFile(null);
      setNewItemName('');
      setNewItemCategory('Top');
      setNewItemMaterial('Cotton');
      setNewItemInsulation(5);
      setNewItemSeasons([]);
      setNewItemStyleTags([]);
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

  const processFile = (file: File) => {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setPreviewUrl(base64);
        
        // Trigger Auto-Analysis
        if (onAnalyzeImage && base64) {
            setIsAnalyzing(true);
            const result = await onAnalyzeImage(base64);
            if (result) {
                if (result.name) setNewItemName(result.name);
                if (result.category) setNewItemCategory(result.category);
                if (result.material) setNewItemMaterial(result.material as ClothingMaterial);
                if (result.insulation_value !== undefined) setNewItemInsulation(result.insulation_value);
                if (result.season_tags) setNewItemSeasons(result.season_tags as Season[]);
                if (result.style_tags) setNewItemStyleTags(result.style_tags);
            }
            setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmDelete = () => {
      if (itemToDelete) {
          onDelete(itemToDelete);
          setItemToDelete(null);
      }
  }
  
  const formatLastWorn = (isoDate: string | null) => {
      if (!isoDate) return 'NEVER';
      const date = new Date(isoDate);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const isYesterday = new Date(today.setDate(today.getDate() - 1)).toDateString() === date.toDateString();

      if (isToday) return "TODAY";
      if (isYesterday) return "YESTERDAY";
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const toggleSeason = (season: Season) => {
      if (newItemSeasons.includes(season)) {
          setNewItemSeasons(prev => prev.filter(s => s !== season));
      } else {
          setNewItemSeasons(prev => [...prev, season]);
      }
  }

  return (
    <div className="flex flex-col h-full relative">
        {/* Redesigned Search Toolbar */}
        <div className="bg-[#FDFFB6] border-2 border-black p-2 md:p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 md:mb-6 flex flex-col md:flex-row gap-2 md:gap-4 items-center">
             <div className="flex-1 w-full bg-white border-2 border-black h-10 md:h-12 flex items-center px-3 shadow-inner focus-within:ring-2 focus-within:ring-[#FF99C8] transition-all">
                <Search size={18} className="text-black opacity-50 mr-3 md:w-[22px] md:h-[22px]" />
                <input 
                    type="text" 
                    placeholder="SEARCH DATABASE..." 
                    className="w-full h-full bg-transparent outline-none font-mono font-bold text-sm md:text-lg placeholder:text-gray-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <RetroButton className="h-10 md:h-12 px-6 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 flex-1 md:flex-auto" title="Filter">
                    <Filter size={18} /> <span className="md:hidden text-xs">FILTER</span>
                </RetroButton>
             </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 px-2 -mb-[2px] z-10 no-scrollbar pb-1">
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(activeTab === tab ? 'ALL' : tab)}
                    className={`
                        px-4 md:px-6 py-1.5 md:py-2 font-mono font-bold text-xs md:text-sm whitespace-nowrap border-2 border-black transition-all rounded-t-lg text-black
                        ${activeTab === tab 
                            ? 'bg-white border-b-white relative z-20 translate-y-[2px]' 
                            : 'bg-[#e5e5e5] hover:bg-[#d4d4d4] relative top-[4px]'
                        }
                    `}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* Grid */}
        <div className="bg-white border-2 border-black p-2 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[400px] z-0 relative">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                
                {/* Add New Button */}
                <button 
                    onClick={onOpenAdd}
                    className="border-2 border-dashed border-black p-4 flex flex-col items-center justify-center gap-2 md:gap-3 min-h-[240px] hover:bg-[#FFF8E7] transition-colors group relative overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-5 pointer-events-none z-0" 
                        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}>
                    </div>
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#A0C4FF] border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                        <Plus size={20} strokeWidth={3} className="text-black md:w-[28px] md:h-[28px]" />
                    </div>
                    <span className="font-mono font-bold text-xs md:text-sm text-gray-600 group-hover:text-black z-10 bg-white/50 px-2 border border-transparent group-hover:border-black">UPLOAD.EXE</span>
                </button>

                {filteredItems.map((item) => (
                    <RetroCard key={item.id} className="flex flex-col h-full group relative p-2 md:p-2">
                        
                        {/* Favorite Toggle */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(item.id);
                            }}
                            className="absolute top-2 right-2 z-20 transition-transform hover:scale-110"
                        >
                             <Heart size={18} className={item.is_favorite ? "fill-red-500 text-red-500" : "text-black/50 fill-white"} />
                        </button>

                        {/* Delete Button */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(item.id);
                            }}
                            className="absolute top-2 left-2 z-20 bg-[#FF8E72] border-2 border-black p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            title="Delete Item"
                        >
                            <Trash2 size={12} className="text-white" />
                        </button>

                        <div className="aspect-square border-2 border-black mb-2 overflow-hidden bg-gray-100 relative">
                            <Image src={item.image_url} alt={item.name} fill className="w-full h-full object-cover md:grayscale md:group-hover:grayscale-0 transition-all duration-300" />
                            <div className="absolute bottom-1 left-1 bg-white border border-black px-1 py-0.5 text-[8px] font-mono font-bold uppercase">
                                {item.category}
                            </div>
                            {item.last_worn && formatLastWorn(item.last_worn) === 'TODAY' && (
                                <div className="absolute top-1 left-1 bg-[#CAFFBF] border border-black px-1 py-0.5 text-[8px] font-mono font-bold uppercase animate-pulse">
                                    WORN TODAY
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col flex-1">
                            <h4 className="font-bold text-xs md:text-sm leading-tight line-clamp-1 text-black mb-1">{item.name}</h4>
                            
                            <div className="flex justify-between items-center text-[10px] font-mono text-gray-600 mb-1">
                                <div className="flex items-center gap-1">
                                    <Clock size={10} />
                                    <span>{formatLastWorn(item.last_worn)}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 border border-black px-1">
                                    <span>XP: {item.wear_count}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 mb-2">
                                 <div className="flex items-center gap-0.5">
                                    <Thermometer size={10} />
                                    <span>Lvl.{item.insulation_value}</span>
                                 </div>
                                 <span>|</span>
                                 <span>{item.material}</span>
                            </div>

                            <div className="mt-auto pt-2 border-t-2 border-black border-dashed flex flex-wrap gap-1">
                                {item.style_tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[8px] md:text-[9px] bg-[#CAFFBF] px-1 border border-black uppercase text-black">{tag}</span>
                                ))}
                                {item.season_tags.slice(0,1).map(tag => (
                                    <span key={tag} className="text-[8px] md:text-[9px] bg-[#A0C4FF] px-1 border border-black uppercase text-black">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </RetroCard>
                ))}
            </div>
        </div>

        {/* Add Item Modal */}
        {isAdding && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="max-w-md w-full animate-in zoom-in-95 duration-200">
                    <RetroWindow title="NEW_ITEM_WIZARD" onClose={onCloseAdd}>
                        <form onSubmit={handleSaveItem} className="space-y-4 p-2 max-h-[80vh] overflow-y-auto">
                            
                            {/* Image Upload */}
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileSelect} 
                                accept="image/*" 
                                className="hidden" 
                            />
                            <div 
                                onClick={triggerFileInput}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                className={`
                                    border-2 border-black border-dashed 
                                    ${previewUrl ? 'p-0' : 'p-6 bg-[#f9f9f9] hover:bg-[#fff]'} 
                                    flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-colors relative overflow-hidden min-h-[150px]
                                `}
                            >
                                {previewUrl ? (
                                    <>
                                        <Image src={previewUrl} alt="Preview" width={300} height={192} className="w-full h-48 object-cover" />
                                        
                                        {/* Scanning Overlay */}
                                        {isAnalyzing && (
                                            <div className="absolute inset-0 bg-green-900/40 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                                                <ScanLine size={48} className="text-[#CAFFBF] animate-bounce mb-2" />
                                                <span className="font-mono font-bold text-white animate-pulse bg-black px-2">SCANNING...</span>
                                            </div>
                                        )}

                                        <button 
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-2 right-2 bg-[#FF8E72] border-2 border-black p-1 hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10"
                                        >
                                            <X size={16} className="text-black" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={32} className="text-gray-400" />
                                        <span className="font-mono text-xs text-gray-500">CLICK OR DRAG TO UPLOAD</span>
                                        <span className="font-mono text-[9px] bg-[#CAFFBF] border border-black px-1">AI VISION ENABLED</span>
                                    </>
                                )}
                            </div>
                            
                            <div>
                                <label className="font-bold font-mono text-xs uppercase block mb-1">Item Name {isAnalyzing && <span className="animate-pulse">...</span>}</label>
                                <RetroInput 
                                    placeholder="e.g. Vintage Denim Jacket" 
                                    required 
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    disabled={isAnalyzing}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold font-mono text-xs uppercase block mb-1">Category</label>
                                    <RetroSelect value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value as ClothingType)} disabled={isAnalyzing}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </RetroSelect>
                                </div>
                                <div>
                                    <label className="font-bold font-mono text-xs uppercase block mb-1">Material</label>
                                    <RetroSelect value={newItemMaterial} onChange={(e) => setNewItemMaterial(e.target.value as ClothingMaterial)} disabled={isAnalyzing}>
                                        {['Cotton', 'Polyester', 'Wool', 'Leather', 'Denim', 'Linen', 'Synthetic', 'Gore-Tex', 'Other'].map(m => 
                                            <option key={m} value={m}>{m}</option>
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
                                disabled={isAnalyzing}
                            />

                            <div>
                                <label className="font-bold font-mono text-xs uppercase block mb-1">Seasons</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Spring', 'Summer', 'Autumn', 'Winter'].map((season) => (
                                        <button
                                            type="button"
                                            key={season}
                                            onClick={() => toggleSeason(season as Season)}
                                            disabled={isAnalyzing}
                                            className={`px-2 py-1 border-2 border-black font-mono text-xs ${newItemSeasons.includes(season as Season) ? 'bg-[#CAFFBF]' : 'bg-white'}`}
                                        >
                                            {season}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {newItemStyleTags.length > 0 && (
                                <div>
                                    <label className="font-bold font-mono text-xs uppercase block mb-1">Detected Tags</label>
                                    <div className="flex flex-wrap gap-1">
                                        {newItemStyleTags.map(tag => (
                                            <span key={tag} className="text-[9px] bg-[#e5e5e5] border border-black px-1">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <RetroButton type="submit" className="w-full py-2" disabled={isAnalyzing}>
                                    {isAnalyzing ? 'PROCESSING IMAGE...' : 'SAVE TO DATABASE'}
                                </RetroButton>
                            </div>
                        </form>
                    </RetroWindow>
                </div>
            </div>
        )}

        {/* Delete Confirmation */}
        {itemToDelete && (
             <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <RetroWindow title="CONFIRM_DELETION.SYS" onClose={() => setItemToDelete(null)} className="bg-[#FF8E72]" icon={<AlertTriangle size={14} />}>
                        <div className="p-4 bg-white flex flex-col gap-4 text-center">
                            <h3 className="font-black text-lg">PERMANENT DELETE?</h3>
                            <p className="font-mono text-xs text-gray-600">This item will be removed from the wardrobe matrix forever. This action cannot be undone.</p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <RetroButton variant="neutral" onClick={() => setItemToDelete(null)}>CANCEL</RetroButton>
                                <RetroButton variant="danger" onClick={confirmDelete}>DELETE</RetroButton>
                            </div>
                        </div>
                    </RetroWindow>
                </div>
             </div>
        )}
    </div>
  );
};
