"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/silhouette/header"
import { CameraPreview } from "@/components/silhouette/camera-preview"
import { StyleVibeSelector } from "@/components/silhouette/style-vibe-selector"
import { OutfitPreviews } from "@/components/silhouette/outfit-previews"
import { StyleRecommendation } from "@/components/silhouette/style-recommendation"
import { BodyModel, type Annotation } from "@/components/silhouette/body-model"

export default function SilhouettePage() {
  const [selectedVibe, setSelectedVibe] = useState<string>("street")
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [captureData, setCaptureData] = useState<any>(null)
  const [preferences, setPreferences] = useState<{ bodyPart: string, comment: string }[]>([])
  const [generatedOutfits, setGeneratedOutfits] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPhoto, setGeneratedPhoto] = useState<string | null>(null)
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false)

  const handleAddAnnotation = (bodyPart: string, comment: string) => {
    console.log("Adding annotation for body part:", bodyPart, "Comment:", comment)
    const newAnnotation: Annotation = {
      id: `${Date.now()}-${Math.random()}`,
      bodyPart,
      comment,
      position: { x: 0, y: 0 },
      timestamp: Date.now(),
    }
    setAnnotations([...annotations, newAnnotation])
  }

  const handleRemoveAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id))
  }

  // Map body parts to item categories for Overshoot API
  const getSelectedItem = () => {
    switch (selectedBodyPart) {
      case "torso":
        return "tops"
      case "legs":
        return "bottoms"
      case "feet":
        return "shoes"
      default:
        return undefined
    }
  }

  // Map style vibes to Overshoot API labels
  const getSelectedVibe = () => {
    switch (selectedVibe) {
      case "street":
        return "streetwear"
      case "formal":
        return "formal"
      case "sporty":
        return "active"
      default:
        return "formal"
    }
  }

  // Generate photo using text files + image via Gemini
  const generatePhoto = async () => {
    console.log('[GENERATE_PHOTO] Starting photo generation...')
    console.log('[GENERATE_PHOTO] Current state - hasCaptureData:', !!captureData, 'hasPreferences:', preferences.length > 0)
    setIsGeneratingPhoto(true)
    try {
      console.log('[GENERATE_PHOTO] Requesting photo generation from backend...')
      const response = await fetch('/api/capture/generate-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to generate photo')
      }

      const data = await response.json()
      console.log('[GENERATE_PHOTO] Photo generated successfully:', data)
      console.log('[GENERATE_PHOTO] Generated image filename:', data.image?.filename)
      console.log('[GENERATE_PHOTO] Image path:', data.image?.path)
      
      if (data.image?.dataUrl) {
        console.log('[GENERATE_PHOTO] Setting generated photo in state...')
        setGeneratedPhoto(data.image.dataUrl)
        console.log('[GENERATE_PHOTO] Photo generation completed successfully')
      } else {
        console.warn('[GENERATE_PHOTO] No image data URL in response')
      }
    } catch (error) {
      console.error('[GENERATE_PHOTO] Failed to generate photo:', error)
      alert('Failed to generate photo. Make sure you have saved both a capture and preferences first.')
    } finally {
      setIsGeneratingPhoto(false)
    }
  }

  // Handle capture from camera preview
  const handleCapture = (data: { snapshot: string, overshootData: any }) => {
    console.log('Capture received:', data)
    setCaptureData(data)
    // Photo generation is now manual - only when user clicks Generate button
  }

  // Handle preferences saved from body model
  const handleSavePreferences = (prefs: { bodyPart: string, comment: string }[]) => {
    console.log('Preferences saved:', prefs)
    setPreferences(prefs)
    // Photo generation is now manual - only when user clicks Generate button
  }

  // Generate recommendations when all data is available
  const generateRecommendations = async () => {
    if (!captureData) {
      alert('Please capture an image first')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          styleVibe: selectedVibe,
          captureId: null, // Will use latest
          preferencesId: null, // Will use latest
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate recommendations')
      }

      const data = await response.json()
      console.log('Recommendations generated:', data)

      // Update generated outfits
      if (data.generatedImages && data.generatedImages.length > 0) {
        setGeneratedOutfits(data.generatedImages)
      }

    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      alert('Failed to generate recommendations. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Recommendations generation is now manual - only when user clicks Generate button in OutfitPreviews
  // Removed auto-generation useEffect to prevent unwanted generation on save

  return (
    <main className="min-h-screen bg-background">
      <Header 
        onGenerate={generatePhoto}
        isGenerating={isGeneratingPhoto}
      />
      
      <div className="mx-auto max-w-[1800px] px-4 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Camera Preview */}
          <div>
            <CameraPreview 
              selectedVibe={getSelectedVibe()} 
              selectedItem={getSelectedItem()}
              onCapture={handleCapture}
            />
          </div>

          {/* Right - Body Model */}
          <div>
            <BodyModel 
              selectedBodyPart={selectedBodyPart}
              onBodyPartSelect={setSelectedBodyPart}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onRemoveAnnotation={handleRemoveAnnotation}
              onSavePreferences={handleSavePreferences}
            />
          </div>
        </div>

        {/* Bottom Row - Style Controls and Outfit Previews */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left Column - Style Controls Stacked */}
          <div className="flex flex-col gap-6">
            <StyleVibeSelector 
              selectedVibe={selectedVibe} 
              onVibeSelect={setSelectedVibe} 
            />
            <StyleRecommendation 
              selectedVibe={selectedVibe}
              selectedBodyPart={selectedBodyPart}
            />
          </div>

          {/* Right Column - Outfit Previews */}
          <div className="lg:col-span-2 h-full">
            <OutfitPreviews 
              selectedVibe={selectedVibe} 
              generatedOutfits={generatedOutfits}
              isGenerating={isGenerating}
              onGenerate={generateRecommendations}
            />
          </div>

          {/* Generated Photo Display */}
          {generatedPhoto && (
            <div className="mt-6 w-full">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
                <h2 className="font-serif text-lg text-foreground mb-4">Generated Photo (Gemini)</h2>
                <div className="aspect-[3/4] overflow-hidden rounded-xl border border-border/50 bg-muted">
                  <img 
                    src={generatedPhoto} 
                    alt="Generated fashion photo" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  onClick={generatePhoto}
                  disabled={isGeneratingPhoto}
                  className="mt-4 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                  {isGeneratingPhoto ? 'Generating...' : 'Regenerate Photo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
