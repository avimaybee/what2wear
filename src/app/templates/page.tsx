"use client";

import { TemplatesPage as TemplatesPageComponent } from "@/components/templates/TemplatesPage";
import { OutfitTemplate } from "@/types/retro";
import { toast } from "@/components/ui/toaster";

export default function TemplatesPage() {
  const handleApply = (template: OutfitTemplate) => {
    console.log("Applying template:", template);
    toast.success(`Applied template: ${template.name}`);
  };

  return (
      <TemplatesPageComponent onApply={handleApply} />
  );
}
