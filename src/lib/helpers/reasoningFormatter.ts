/**
 * Formatting utilities for outfit reasoning text
 * Transforms technical reasoning into natural, conversational language
 */

/**
 * Transform clinical/technical reasoning text into natural, conversational language
 * that sounds like a friendly style advisor rather than an algorithm output
 */
export function formatReasoningForUser(detailedReasoning: string): string {
  if (!detailedReasoning) return '';

  let formatted = detailedReasoning;

  // Replace clinical opening phrases with conversational ones
  formatted = formatted.replace(
    /Color harmony: The pieces form a cohesive palette \(score \d+\/100\)\. This creates a clean, visually balanced look\./g,
    "I've selected colors that work beautifully together, creating a cohesive and visually balanced look that feels effortless."
  );

  formatted = formatted.replace(
    /Color pairing: The outfit mixes a neutral base with an accent color \(score \d+\/100\), giving a subtle contrast that feels intentional\./g,
    "I've mixed a neutral base with a pop of accent color to add visual interest while keeping the overall look balanced and intentional."
  );

  formatted = formatted.replace(
    /Color note: There are multiple accent colors \(score \d+\/100\)\. This produces a more eclectic, expressive look; you can simplify by choosing a neutral shoe or top\./g,
    "This outfit brings together multiple colors for an expressive, personalized vibe. If you prefer something simpler, try swapping to a neutral shoe or top."
  );

  // Material harmony rewrites
  formatted = formatted.replace(
    /Material & texture: The fabrics and textures work together \(\d+\/100\), adding depth without feeling busy\./g,
    "The fabrics and textures complement each other nicely, adding visual depth without overwhelming the eye."
  );

  formatted = formatted.replace(
    /Material note: The outfit mixes contrasting textures \(\d+\/100\)\. This can be stylish when balanced, but pay attention to comfort\./g,
    "I've mixed different textures here for added interest. Just make sure you're comfortable with how they feel together."
  );

  // Style alignment rewrites
  formatted = formatted.replace(
    /Style alignment: Items share complementary style cues(?:\s*\([^)]+\))?\s*\(score \d+\/100\), so the outfit reads as a single look\./g,
    (match) => {
      const tagMatch = match.match(/\(([^)]+)\)\s*\(score/);
      if (tagMatch) {
        return `These pieces share a common style vibe (think ${tagMatch[1]}), so they naturally work together as a cohesive outfit.`;
      }
      return "These pieces share a common style vibe, so they naturally work together as a cohesive outfit.";
    }
  );

  formatted = formatted.replace(
    /Style note: The outfit blends different style elements \(score \d+\/100\)\. This can create a personalized hybrid look\./g,
    "This outfit mixes different style elements for a personalized, hybrid look that's uniquely yours."
  );

  // Fit balance rewrites
  formatted = formatted.replace(
    /Fit balance: The silhouettes complement each other \(fit score \d+\/100\), creating a flattering proportion\./g,
    "The silhouettes complement each other well, creating proportions that are naturally flattering."
  );

  formatted = formatted.replace(
    /Fit note: Silhouettes are less balanced \(fit score \d+\/100\)\. Consider swapping to a slimmer or looser piece for improved balance\./g,
    "The proportions here are a bit unbalanced. Try swapping to a slimmer or looser piece to dial in the fit."
  );

  // Weather/temperature rewrites - make more natural
  formatted = formatted.replace(
    /Temperature & protection: Selected to match a feels-like temperature of ([\d.]+)°C with an estimated insulation level of ([\d.]+) \(target ([\d.]+)\)\./g,
    (_, temp) => {
      const tempNum = parseFloat(temp);
      let tempDesc = "moderate";
      if (tempNum < 16) tempDesc = "cold";
      else if (tempNum > 35) tempDesc = "warm";
      else if (tempNum < 24) tempDesc = "cool";
      
      return `These pieces are chosen for today's ${tempDesc} weather (feels like ${temp}°C), keeping you comfortable without overdoing it.`;
    }
  );

  // Safety alerts rewrites
  formatted = formatted.replace(
    /Safety & alerts: The recommendation considered active alerts \(([^)]+)\), adding protection where appropriate\./g,
    (_, alerts) => `I've also factored in today's weather alerts (${alerts}) to make sure you're prepared.`
  );

  // Confidence score rewrites
  formatted = formatted.replace(
    /Recommendation confidence: (\d+)% based on color, style, fit and your preferences\./g,
    (_, score) => {
      const scoreNum = parseInt(score);
      let confidencePhrase = "I'm fairly confident";
      if (scoreNum >= 85) confidencePhrase = "I'm really confident";
      else if (scoreNum >= 70) confidencePhrase = "I'm confident";
      else if (scoreNum < 60) confidencePhrase = "I think";
      
      return `${confidencePhrase} this outfit works well with your style preferences and today's conditions.`;
    }
  );

  return formatted;
}

/**
 * Extracts a short preview of reasoning (first ~150 chars) for compact displays
 */
export function getReasoningPreview(detailedReasoning: string, maxLength: number = 150): string {
  if (!detailedReasoning) return '';
  
  const formatted = formatReasoningForUser(detailedReasoning);
  const firstParagraph = formatted.split('\n\n')[0] || formatted;
  
  if (firstParagraph.length <= maxLength) return firstParagraph;
  
  // Find last complete sentence within maxLength
  const truncated = firstParagraph.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > 0) {
    return truncated.slice(0, lastPeriod + 1);
  }
  
  return truncated.trim() + '…';
}
