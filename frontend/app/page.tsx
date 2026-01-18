"use client"

import { useState } from "react"
import { Header } from "@/components/silhouette/header"
import { CameraPreview } from "@/components/silhouette/camera-preview"
import { StyleVibeSelector } from "@/components/silhouette/style-vibe-selector"
import { OutfitPreviews } from "@/components/silhouette/outfit-previews"
import { StyleRecommendation } from "@/components/silhouette/style-recommendation"
import { BodyModel } from "@/components/silhouette/body-model"

export default function SilhouettePage() {
  const [selectedVibe, setSelectedVibe] = useState<string>("street")
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null)

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

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="mx-auto max-w-[1800px] px-4 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Camera Preview */}
          <div className="lg:col-span-5">
            <CameraPreview 
              selectedVibe={getSelectedVibe()} 
              selectedItem={getSelectedItem()}
            />
          </div>

          {/* Center Column - 3D Body Model */}
          <div className="lg:col-span-4">
            <BodyModel 
              selectedBodyPart={selectedBodyPart}
              onBodyPartSelect={setSelectedBodyPart}
            />
          </div>

          {/* Right Column - Style Controls & Previews */}
          <div className="flex flex-col gap-6 lg:col-span-3">
            <StyleVibeSelector 
              selectedVibe={selectedVibe} 
              onVibeSelect={setSelectedVibe} 
            />
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
