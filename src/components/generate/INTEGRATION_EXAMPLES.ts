/**
 * Task 4 Integration Examples
 * Shows how to use the outfit generation system in different components
 *
 * NOTE: This is a reference file with code examples.
 * Copy the relevant code into your components as needed.
 */

// ============================================================================
// Example 1: Using OutfitGenerator component directly (in a .tsx file)
// ============================================================================
// 'use client';
// import { OutfitGenerator } from '@/components/generate/OutfitGenerator';
//
// export function DashboardExample() {
//   const items = [
//     {
//       id: '1',
//       imageUrl: 'https://...',
//       type: 'Top',
//       colors: ['navy'],
//       material: 'cotton',
//       styleTags: ['casual'],
//     },
//     {
//       id: '2',
//       imageUrl: 'https://...',
//       type: 'Bottom',
//       colors: ['black'],
//       material: 'denim',
//       styleTags: ['casual'],
//     },
//     {
//       id: '3',
//       imageUrl: 'https://...',
//       type: 'Footwear',
//       colors: ['white'],
//       material: 'canvas',
//       styleTags: ['casual'],
//     },
//   ];
//
//   return (
//     <OutfitGenerator
//       recommendationId="rec_123"
//       items={items}
//       silhouette="female"
//       stylePreset="photorealistic"
//       onGenerationComplete={(previewUrls, finalUrls) => {
//         console.log('Generated:', { previewUrls, finalUrls });
//       }}
//       onError={(error) => {
//         console.error('Generation failed:', error);
//       }}
//     />
//   );
// }

// ============================================================================
// Example 2: Using useOutfitGenerator hook (in a .tsx file)
// ============================================================================
// 'use client';
// import { useOutfitGenerator } from '@/lib/hooks/useOutfitGenerator';
// import { Button } from '@/components/ui/button';
//
// export function HookExample() {
//   const { generateOutfit, previewUrls, finalUrls, isLoading, error } =
//     useOutfitGenerator({
//       recommendationId: 'rec_123',
//       silhouette: 'female',
//       onPreviewReady: (urls) => console.log('Previews ready:', urls),
//       onFinalReady: (urls) => console.log('Final ready:', urls),
//       onError: (error) => console.error('Error:', error),
//     });
//
//   const items = [...]; // Get items from props or state
//
//   return (
//     <Button onClick={() => generateOutfit(items, 'photorealistic')}>
//       {isLoading ? 'Generating...' : 'Generate Outfit'}
//     </Button>
//   );
// }

// ============================================================================
// Example 3: Integration with DashboardClient
// ============================================================================
// In dashboard-client.tsx, add to the render section around outfit display:
//
// import { OutfitGenerator } from '@/components/generate/OutfitGenerator';
//
// {recommendation?.items && (
//   <OutfitGenerator
//     key={recommendation.id}
//     recommendationId={recommendation.id}
//     items={recommendation.items}
//     silhouette={userPreferences?.preferredSilhouette || 'neutral'}
//     stylePreset={userPreferences?.preferredStyles?.[0] || 'photorealistic'}
//     onGenerationComplete={(previewUrls, finalUrls) => {
//       // Update UI with generated images
//       setGeneratedImageUrls(finalUrls || previewUrls);
//     }}
//     onError={(error) => {
//       // Show error toast
//       toast.error(error);
//     }}
//   />
// )}


// ============================================================================
// Example 4: API usage - Direct fetch (for server components)
// ============================================================================
// async function generateOutfitDirect(
//   recommendationId: string,
//   items: any[]
// ) {
//   const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate/outfit-visual`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       recommendationId,
//       items,
//       silhouette: 'female',
//       stylePreset: 'photorealistic',
//       previewCount: 3,
//       previewQuality: 'medium',
//     }),
//   });
//
//   const data = await response.json();
//
//   if (!data.success) {
//     throw new Error(data.error?.message || 'Generation failed');
//   }
//
//   return {
//     jobId: data.jobId,
//     previewUrls: data.previewUrls,
//     seed: data.seed,
//   };
// }

// ============================================================================
// Example 5: Polling for full-resolution completion
// ============================================================================
// async function pollForCompletion(
//   jobId: string,
//   maxAttempts: number = 60 // Max 5 minutes at 5-second intervals
// ) {
//   let attempts = 0;
//
//   while (attempts < maxAttempts) {
//     const response = await fetch(`/api/generate/outfit-visual/${jobId}`);
//     const data = await response.json();
//
//     if (data.status === 'completed' && data.finalUrls) {
//       return { success: true, finalUrls: data.finalUrls };
//     }
//
//     if (data.status === 'failed') {
//       return { success: false, error: data.errorMessage };
//     }
//
//     // Wait 5 seconds before polling again
//     await new Promise((resolve) => setTimeout(resolve, 5000));
//     attempts++;
//   }
//
//   return { success: false, error: 'Polling timeout' };
// }

// ============================================================================
// Example 6: Full workflow (server action or API route)
// ============================================================================
// async function fullGenerationWorkflow(
//   recommendationId: string,
//   items: any[]
// ) {
//   try {
//     // Step 1: Generate outfit (preview returns immediately, 2-8 seconds)
//     console.log('Step 1: Initiating generation...');
//     const generation = await generateOutfitDirect(recommendationId, items);
//     console.log('Preview ready:', generation.previewUrls);
//
//     // Step 2: Display preview to user
//     displayOutfitImages(generation.previewUrls, true);
//
//     // Step 3: Poll for full-resolution (typically 2-3 minutes)
//     console.log('Step 3: Polling for full-resolution...');
//     const result = await pollForCompletion(generation.jobId);
//
//     if (result.success) {
//       console.log('Full-resolution ready:', result.finalUrls);
//       displayOutfitImages(result.finalUrls, false);
//     } else {
//       console.error('Full-resolution generation failed:', result.error);
//     }
//   } catch (error) {
//     console.error('Workflow error:', error);
//     throw error;
//   }
// }
//
// function displayOutfitImages(urls: string[], isPreview: boolean) {
//   console.log(`Displaying ${isPreview ? 'preview' : 'final'} images:`, urls);
//   // Update UI with image URLs
// }

// ============================================================================
// NEXT STEPS
// ============================================================================
// 1. Apply database migration: supabase/migration_20251112_add_outfit_visuals.sql
// 2. Set GEMINI_API_KEY in .env.local (required for API calls)
// 3. Update DashboardClient to use OutfitGenerator component
// 4. Configure Redis URL for production worker queuing (optional for MVP)
// 5. Test with real Gemini API credentials

// ============================================================================
// KEY FILES CREATED
// ============================================================================
// Core Implementation:
// - app/src/app/api/generate/outfit-visual/route.ts (POST endpoint)
// - app/src/app/api/generate/outfit-visual/[jobId]/route.ts (polling endpoint)
// - app/src/lib/helpers/nanoBananaClient.ts (Gemini API integration)
// - app/src/lib/helpers/storageClient.ts (Supabase storage)
// - app/src/lib/workers/outfitGenerationWorker.ts (background jobs)
//
// Frontend:
// - app/src/components/generate/OutfitGenerator.tsx (React component)
// - app/src/lib/hooks/useOutfitGenerator.ts (custom hook)
//
// Database:
// - supabase/migration_20251112_add_outfit_visuals.sql (schema)
