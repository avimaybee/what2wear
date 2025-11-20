"use client";

import { useState, useEffect } from "react";
import { TemplatesPage as TemplatesPageComponent } from "@/components/templates/TemplatesPage";
import { OutfitTemplate } from "@/types/retro";
import { toast } from "@/components/ui/toaster";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<(OutfitTemplate & { requirements?: string[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/templates");
        const result = await response.json();
        
        if (result.success) {
          // Map DB fields to UI fields if necessary
          const mappedTemplates = result.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            styleTags: t.style_tags,
            coverImage: t.cover_image,
            requirements: t.requirements
          }));
          setTemplates(mappedTemplates);
        } else {
          console.error("Failed to fetch templates:", result.error);
          toast.error("Failed to load templates.");
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Error loading templates.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleApply = (template: OutfitTemplate) => {
    console.log("Applying template:", template);
    toast.success(`Applied template: ${template.name}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--border)]"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 md:p-8 overflow-y-auto bg-[var(--bg-primary)] min-h-screen text-[var(--text)]">
        <div className="max-w-7xl mx-auto">
            <TemplatesPageComponent templates={templates} onApply={handleApply} />
        </div>
    </div>
  );
}
