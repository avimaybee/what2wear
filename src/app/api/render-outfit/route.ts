import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// Ensure the API key is set in your environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) // Adjusted model name based on common use cases

// Helper to fetch an image from a URL and convert it to a Gemini Part
async function urlToGoogleGenerativePart(url: string, mimeType: string): Promise<Part> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    return {
        inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType,
        },
    }
}

export async function POST(req: NextRequest) {
  try {
    const { userImageUrl, clothingItemsUrls, userId } = await req.json()

    if (!userImageUrl || !clothingItemsUrls || !Array.isArray(clothingItemsUrls) || !userId) {
      return NextResponse.json({ error: 'Missing or invalid parameters. userImageUrl, clothingItemsUrls, and userId are required.' }, { status: 400 })
    }

    // 1. Prepare the prompt and image parts for the Gemini API
    const prompt = `
      You are a virtual fashion stylist. Your task is to generate a realistic image of a person wearing a new outfit.
      You will be given an image of the person and several images of clothing items.
      Superimpose the clothing items onto the person in the image.
      The final image should be photorealistic, maintaining the person's pose, body shape, and the original background.
      The clothing should fit naturally. Do not return any text, just the final image.
    `

    const imageParts: Part[] = [
      await urlToGoogleGenerativePart(userImageUrl, 'image/jpeg'), // Assuming user image is JPEG
      ...await Promise.all(
        clothingItemsUrls.map((url) => urlToGoogleGenerativePart(url, 'image/png')) // Assuming clothing items are PNG with transparency
      ),
    ]

    // 2. Call the Gemini API
    const result = await model.generateContent([prompt, ...imageParts])
    const response = result.response

    // Check for safety ratings or blocks
    if (response.promptFeedback?.blockReason) {
        return NextResponse.json({ error: `Request blocked due to ${response.promptFeedback.blockReason}` }, { status: 400 });
    }
    if (!response.candidates || response.candidates.length === 0) {
        return NextResponse.json({ error: 'No content generated. The response may have been blocked.' }, { status: 500 });
    }

    const firstCandidate = response.candidates[0]
    const imagePart = firstCandidate.content.parts.find(part => part.inlineData?.mimeType.startsWith('image/'))

    if (!imagePart || !imagePart.inlineData) {
      console.error('Gemini API response did not contain an image.', JSON.stringify(response, null, 2))
      return NextResponse.json({ error: 'Failed to generate outfit. The model did not return a valid image.' }, { status: 500 })
    }

    // 3. Upload the generated image to Supabase Storage
    const supabase = await createClient()
    const generatedImageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
    const filePath = `generated_outfits/${userId}/${Date.now()}.png`

    const { error: uploadError } = await supabase.storage
      .from('outfits') // Bucket for generated outfits
      .upload(filePath, generatedImageBuffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading generated image to Supabase:', uploadError)
      return NextResponse.json({ error: 'Failed to save the generated outfit.' }, { status: 500 })
    }

    // 4. Get the public URL for the newly uploaded image
    const { data: { publicUrl } } = supabase.storage.from('outfits').getPublicUrl(filePath)

    if (!publicUrl) {
      return NextResponse.json({ error: 'Could not retrieve URL for the generated outfit.' }, { status: 500 })
    }

    // 5. Return the public URL to the client
    return NextResponse.json({ generatedImageUrl: publicUrl })

  } catch (error: unknown) {
    console.error('Error in render-outfit endpoint:', error)
    const message = error instanceof Error ? error.message : 'An internal server error occurred.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}