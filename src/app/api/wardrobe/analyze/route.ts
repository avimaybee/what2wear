/**
 * Clothing Analysis API Endpoint
 * POST /api/wardrobe/analyze
 * 
 * Uses Gemini 2.5 Flash API to automatically detect clothing properties from images
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface AnalysisResult {
  name: string;
  type: "Outerwear" | "Top" | "Bottom" | "Footwear" | "Accessory" | "Headwear";
  color: string;
  material: string;
  season_tags: string[];
  dress_code: ("Casual" | "Business Casual" | "Formal" | "Athletic" | "Loungewear")[];
  insulation_value: number;
  // Enhanced properties for better AI outfit recommendations
  pattern?: string; // e.g., "Solid", "Striped", "Plaid", "Floral", "Polka Dot"
  fit?: string; // e.g., "Slim", "Regular", "Loose", "Oversized"
  style?: string; // e.g., "Modern", "Vintage", "Streetwear", "Classic", "Minimalist"
  occasion?: string[]; // e.g., ["Work", "Casual Outing", "Formal Event", "Sports"]
  description?: string; // Detailed AI-generated description for outfit matching
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { imageUrl, storagePath } = body;

    if (!imageUrl && !storagePath) {
      return NextResponse.json(
        { success: false, error: "Image URL or storage path is required" },
        { status: 400 }
      );
    }

    // Fetch the image as base64
    let base64Image: string;
    let mimeType: string;
    
    try {
      if (storagePath) {
        // Use Supabase client to download from storage (most reliable)
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('clothing_images')
          .download(storagePath);
        
        if (downloadError || !fileData) {
          console.error("Supabase download error:", downloadError);
          throw new Error(`Failed to download image from storage: ${downloadError?.message || 'Unknown error'}`);
        }
        
        const arrayBuffer = await fileData.arrayBuffer();
        base64Image = Buffer.from(arrayBuffer).toString('base64');
        mimeType = fileData.type || 'image/jpeg';
      } else if (imageUrl.includes('supabase.co')) {
        // Extract storage path from URL and use Supabase client
        const urlParts = imageUrl.split('/storage/v1/object/public/clothing_images/');
        if (urlParts.length === 2) {
          const path = urlParts[1];
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('clothing_images')
            .download(path);
          
          if (downloadError || !fileData) {
            throw new Error(`Failed to download from storage: ${downloadError?.message}`);
          }
          
          const arrayBuffer = await fileData.arrayBuffer();
          base64Image = Buffer.from(arrayBuffer).toString('base64');
          mimeType = fileData.type || 'image/jpeg';
        } else {
          throw new Error('Invalid Supabase storage URL format');
        }
      } else {
        // For external URLs
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        base64Image = Buffer.from(imageBuffer).toString('base64');
        mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
      }
    } catch (fetchError) {
      console.error("Error fetching image:", fetchError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` 
        },
        { status: 400 }
      );
    }

  // Use Gemini 2.5 Flash to analyze the clothing item (project requirement)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are an expert fashion stylist analyzing clothing items for an AI wardrobe system. 

Analyze this clothing image thoroughly and extract ALL relevant properties to help AI create perfect outfit combinations later.

Return ONLY valid JSON with no markdown, code blocks, or explanations. Use these exact fields:

{
  "name": "descriptive name including color and type (e.g., 'Navy Blue Cotton Crew Neck T-Shirt')",
  "type": "EXACTLY one of: Outerwear, Top, Bottom, Footwear, Accessory, Headwear",
  "color": "primary color name (e.g., 'Navy Blue', 'Black', 'White', 'Olive Green')",
  "material": "primary material (e.g., 'Cotton', 'Denim', 'Leather', 'Wool', 'Polyester')",
  "pattern": "pattern type (e.g., 'Solid', 'Striped', 'Plaid', 'Floral', 'Graphic Print', 'Polka Dot')",
  "fit": "fit style (e.g., 'Slim Fit', 'Regular Fit', 'Loose Fit', 'Oversized', 'Tailored')",
  "style": "fashion style (e.g., 'Modern', 'Vintage', 'Streetwear', 'Classic', 'Minimalist', 'Sporty')",
  "season_tags": ["array of applicable seasons: Spring, Summer, Fall, Winter"],
  "dress_code": ["array of suitable dress codes: Casual, Business Casual, Formal, Athletic, Loungewear"],
  "occasion": ["suitable occasions: Work, Casual Outing, Date Night, Formal Event, Sports, Home"],
  "insulation_value": number from 1-5 (1=very light/summer, 3=medium, 5=very warm/winter),
  "description": "2-3 sentence detailed description explaining: visual characteristics, styling suggestions, what it pairs well with, and any standout features that will help AI match it with other items"
}

Be specific and detailed. The description field is CRITICAL for AI outfit generation - include texture, visual weight, formality level, and complementary items.

Return ONLY the JSON object.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const content = result.response.text();
    
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the AI response
    let analysis: AnalysisResult;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Error analyzing clothing:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze clothing",
      },
      { status: 500 }
    );
  }
}
