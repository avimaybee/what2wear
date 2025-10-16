'use client';

import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { categorizeImage } from './actions';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Input from '../components/Input';
import { Label } from '../components/Label';

const seasons = ['spring', 'summer', 'autumn', 'winter'];
const styles = ['casual', 'formal', 'streetwear', 'sporty', 'business'];

export default function UploadForm({ user }: { user: User | null }) {
  const supabase = createClient();
  
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setImageUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Choose an image before analyzing.');
      return;
    }
    if (!user) {
      toast.error('Please log in to upload items.');
      return;
    }

    setIsAnalyzing(true);

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${user.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('clothing_images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error(uploadError.message);
      setIsAnalyzing(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('clothing_images')
      .getPublicUrl(filePath);
    
    setImageUrl(urlData.publicUrl);

    const result = await categorizeImage(urlData.publicUrl);

    if ('error' in result) {
      toast.error(result.error);
    } else {
      setCategory(result.category || '');
      setColor(result.color || '');
      setSelectedSeasons(result.season_tags || []);
      setSelectedStyles(result.style_tags || []);
      toast.success('Analysis complete. Review details and save your item.');
    }

    setIsAnalyzing(false);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageUrl || !category) {
      toast.error('Analyze an image and fill category.');
      return;
    }
    if (!user) {
      toast.error('Please log in to save items.');
      return;
    }

    setIsSaving(true);

    const { error: insertError } = await supabase.from('clothing_items').insert({
      user_id: user.id,
      image_url: imageUrl,
      category: category,
      color: color,
      season_tags: selectedSeasons,
      style_tags: selectedStyles,
    });

    if (insertError) {
      toast.error(insertError.message);
    } else {
      toast.success('Item added to your wardrobe.');
      window.location.reload();
    }

    setIsSaving(false);
  };

  const handleMultiSelectChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(event.target.selectedOptions, option => option.value);
    setter(options);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Step 1: Choose Image</Label>
          <div className="relative">
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
            />
          </div>
        </div>
        
        <Button 
          type="button" 
          onClick={handleAnalyze} 
          disabled={!file || isAnalyzing} 
          className="w-full h-12"
          variant={file ? "default" : "outline"}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Analyzing with AI...
            </>
          ) : (
            'Analyze Image with AI'
          )}
        </Button>
      </div>

      <div className={`space-y-4 pt-6 border-t border-border/50 transition-opacity duration-300 ${!imageUrl ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <Label className="text-sm font-medium">Step 2: Review & Save</Label>
        
        <div className="space-y-2">
          <Label htmlFor="category" className="text-xs text-muted-foreground">Category *</Label>
          <Input 
            type="text" 
            id="category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            placeholder="e.g., shirt, pants, jacket"
            required 
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color" className="text-xs text-muted-foreground">Color</Label>
          <Input 
            type="text" 
            id="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
            placeholder="e.g., Blue, #0000FF"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seasons" className="text-xs text-muted-foreground">Seasons</Label>
          <select 
            id="seasons" 
            multiple 
            value={selectedSeasons} 
            onChange={handleMultiSelectChange(setSelectedSeasons)} 
            className="flex min-h-[80px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-ring/30 focus:border-primary"
          >
            {seasons.map(s => <option key={s} value={s} className="capitalize py-1">{s}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="styles" className="text-xs text-muted-foreground">Styles</Label>
          <select 
            id="styles" 
            multiple 
            value={selectedStyles} 
            onChange={handleMultiSelectChange(setSelectedStyles)} 
            className="flex min-h-[80px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-ring/30 focus:border-primary"
          >
            {styles.map(s => <option key={s} value={s} className="capitalize py-1">{s}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
        </div>

        <Button 
          type="submit" 
          disabled={!imageUrl || isSaving} 
          className="w-full h-12"
          variant="success"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Add to Wardrobe'
          )}
        </Button>
      </div>
    </form>
  )
}