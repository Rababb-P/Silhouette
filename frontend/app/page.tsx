"use client"

import { useState } from "react"
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

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="mx-auto max-w-[1800px] px-4 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Camera Preview */}
          <div>
            <CameraPreview selectedVibe={selectedVibe} />
          </div>

          {/* Right Column - Body Model */}
          <div>
            <BodyModel 
              selectedBodyPart={selectedBodyPart}
              onBodyPartSelect={setSelectedBodyPart}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onRemoveAnnotation={handleRemoveAnnotation}
            />
          </div>
        </div>

        {/* Second Row - Style Controls */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3" />
          <div className="lg:col-span-4">
            <StyleVibeSelector 
              selectedVibe={selectedVibe} 
              onVibeSelect={setSelectedVibe} 
            />
          </div>
          <div className="lg:col-span-5">
            <StyleRecommendation 
              selectedVibe={selectedVibe}
              selectedBodyPart={selectedBodyPart}
            />
          </div>
        </div>

        {/* Bottom Section - Outfit Video Previews */}
        <div className="mt-8">
          <OutfitPreviews selectedVibe={selectedVibe} />
        </div>
      </div>
    </main>
  )
}
