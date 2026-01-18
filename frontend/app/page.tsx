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

  // Handle capture from camera preview
  const handleCapture = (data: { snapshot: string, overshootData: any }) => {
    console.log('Capture received:', data)
    setCaptureData(data)
  }

  // Handle preferences saved from body model
  const handleSavePreferences = (prefs: { bodyPart: string, comment: string }[]) => {
    console.log('Preferences saved:', prefs)
    setPreferences(prefs)
  }

  // Generate recommendations when all data is available
  const generateRecommendations = async () => {
    if (!captureData) {
      alert('Please capture an image first')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('http://localhost:3000/api/recommendation', {
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

  // Auto-generate recommendations when capture and preferences are available
  useEffect(() => {
    if (captureData && selectedVibe && selectedVibe !== 'manual') {
      // Wait a bit for preferences to be saved
      const timer = setTimeout(() => {
        generateRecommendations()
      }, 1000)

      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureData, selectedVibe, preferences.length])

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
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
        </div>
      </div>
    </main>
  )
}
