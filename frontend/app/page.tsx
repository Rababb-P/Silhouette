"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/silhouette/header"
import { CameraPreview } from "@/components/silhouette/camera-preview"
import { StyleVibeSelector } from "@/components/silhouette/style-vibe-selector"
import { StyleRecommendation } from "@/components/silhouette/style-recommendation"
import { BodyModel, type Annotation } from "@/components/silhouette/body-model"
import { Footer } from "@/components/silhouette/footer"

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
  const [textRecommendation, setTextRecommendation] = useState<string>("")

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

    setIsGenerating(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

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
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to generate recommendations')
      }

      const data = await response.json()
      console.log('Recommendations generated:', data)

      // Store text recommendation
      if (data.textRecommendation) {
        setTextRecommendation(data.textRecommendation)
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        alert('Request timed out. The server took too long to respond. Please try again.')
      } else {
        console.error('Failed to generate recommendations:', error)
        alert('Failed to generate recommendations. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate photo using the recommendation text
  const generatePhotoFromRecommendation = async () => {
    if (!textRecommendation) {
      alert('Please generate a recommendation first')
      return
    }

    setIsGeneratingPhoto(true)

    try {
      const response = await fetch('/api/recommendation/photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendationText: textRecommendation,
          styleVibe: selectedVibe,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate photo')
      }

      const data = await response.json()
      console.log('Photo generated:', data)

      // Store generated photo
      if (data.generatedPhoto) {
        setGeneratedPhoto(data.generatedPhoto)
      }

    } catch (error) {
      console.error('Failed to generate photo:', error)
      alert('Failed to generate photo. Please try again.')
    } finally {
      setIsGeneratingPhoto(false)
    }
  }

  // Recommendations generation is now manual - only when user clicks Generate button in OutfitPreviews
  // Removed auto-generation useEffect to prevent unwanted generation on save

  const scrollToContent = () => {
    const el = document.getElementById('content')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <main className="min-h-screen bg-background pt-24">
      {/* Sticky Navbar */}
      <div className="fixed top-0 left-0 w-full z-40 bg-background/90 backdrop-blur border-b border-white/10">
        <Header 
          onGenerate={generateRecommendations}
          isGenerating={isGenerating}
        />
      </div>

      {/* Landing Section */}
      <section className="h-screen flex items-center justify-center relative -mt-16">
        <div className="text-center">
          <h1 className="font-serif text-8xl md:text-9xl text-foreground mb-4 animate-fade-in flex justify-center gap-2">
            <div className="animated-text flex">
              {"Find".split("").map((char, i) => (
                <span key={`find-${i}`} className="char" tabIndex={0}>
                  <span>{char}</span>
                </span>
              ))}
            </div>
            <div className="animated-text flex">
              {"Yourself".split("").map((char, i) => (
                <span key={`yourself-${i}`} className="char" tabIndex={0}>
                  <span>{char}</span>
                </span>
              ))}
            </div>
          </h1>
          <p className="text-foreground/60 text-lg animate-fade-in-delay">
            Scroll to discover your style
          </p>
        </div>
        
        {/* Scroll indicator */}
        <button
          type="button"
          onClick={scrollToContent}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
          aria-label="Scroll to content"
        >
          <img src="/sihlote.png" alt="Scroll down" className="w-8 h-8" />
        </button>
      </section>

      <div id="content" className="mx-auto max-w-[1800px] px-4 py-6 lg:px-8 animate-slide-up">
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

        {/* Bottom Row - Style Controls */}
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

          {/* AI Panels - Always visible, show empty states when no content */}
          <div className="lg:col-span-2 grid gap-6 lg:grid-cols-2">
            {/* Generated Photo Panel */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col h-full">
              <h2 className="font-serif text-lg text-foreground mb-4">AI Photo Visualization</h2>
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-border/50 bg-muted mb-4">
                {generatedPhoto ? (
                  <img 
                    src={generatedPhoto} 
                    alt="Generated fashion photo" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Photo visualization will appear here</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1"></div>
              {generatedPhoto && (
                <button
                  onClick={generatePhoto}
                  disabled={isGeneratingPhoto}
                  className="w-full px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 font-medium"
                >
                  {isGeneratingPhoto ? 'Regenerating...' : 'Regenerate Photo'}
                </button>
              )}
            </div>

            {/* AI Recommendation Text Panel */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg text-foreground">AI Recommendations</h2>
                {textRecommendation && (
                  <button
                    onClick={generateRecommendations}
                    disabled={isGenerating}
                    className="px-3 py-1.5 rounded-lg bg-foreground/10 text-foreground hover:bg-foreground/20 disabled:opacity-50 text-sm font-medium border border-foreground/20"
                  >
                    {isGenerating ? 'Generating...' : 'Regenerate'}
                  </button>
                )}
              </div>
              <div className="flex-1 text-base text-white leading-relaxed overflow-y-auto mb-4 min-h-[600px] whitespace-pre-wrap">
                {textRecommendation ? (
                  textRecommendation.split('\n').map((line, i) => {
                    // Add extra margin for section headers
                    const isSectionHeader = /^(THE LOOK|KEY PIECES|DESIGNER'S VISION|STYLING TIP)/.test(line)
                    
                    // Convert URLs to clickable links - show in brackets
                    const urlRegex = /(https?:\/\/[^\s)\[\]]+)/g
                    const parts = line.split(urlRegex)
                    
                    return (
                      <div key={i} className={isSectionHeader ? "mt-4 font-bold italic" : ""}>
                        {parts.map((part, j) => {
                          if (part.match(urlRegex)) {
                            return (
                              <a
                                key={j}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-500 hover:text-emerald-400 underline inline-flex items-center gap-1"
                              >
                                <span>Shop Now</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )
                          }
                          // Don't render empty parts
                          return part ? <span key={j}>{part}</span> : null
                        })}
                      </div>
                    )
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">AI recommendations will appear here</p>
                    </div>
                  </div>
                )}
              </div>
              {textRecommendation && (
                <button
                  onClick={generatePhotoFromRecommendation}
                  disabled={isGeneratingPhoto || !textRecommendation}
                  className="w-full px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900 disabled:opacity-50 font-medium shadow-lg shadow-black/20 transition-all duration-200 mt-auto"
                >
                  {isGeneratingPhoto ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Visualization...
                    </span>
                  ) : (
                    'Visualize This Outfit'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      <Footer />
      </div>
    </main>
  )
}
