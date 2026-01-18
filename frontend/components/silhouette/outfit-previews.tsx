"use client"

import { useState, useEffect } from "react"
import { Play, Pause, Heart, Download, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface OutfitPreviewsProps {
  selectedVibe: string
  generatedOutfits?: Array<{
    name: string
    description: string
    dataUrl: string
    items: string[]
    style: string
  }>
  isGenerating?: boolean
  onGenerate?: () => void
}

const outfitsByVibe = {
  street: [
    { id: 1, name: "Urban Oversized", thumbnail: "gradient-1", duration: "0:08" },
    { id: 2, name: "Layered Streetwear", thumbnail: "gradient-2", duration: "0:12" },
  ],
  formal: [
    { id: 1, name: "Classic Tailored", thumbnail: "gradient-1", duration: "0:10" },
    { id: 2, name: "Modern Minimalist", thumbnail: "gradient-2", duration: "0:08" },
  ],
  sporty: [
    { id: 1, name: "Performance Fit", thumbnail: "gradient-1", duration: "0:09" },
    { id: 2, name: "Athletic Luxe", thumbnail: "gradient-2", duration: "0:11" },
  ],
}

export function OutfitPreviews({ selectedVibe, generatedOutfits = [], isGenerating = false, onGenerate }: OutfitPreviewsProps) {
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  
  // Use generated outfits if available, otherwise use default
  const outfits = generatedOutfits.length > 0 
    ? generatedOutfits.map((outfit, index) => ({
        id: `generated-${index}`,
        name: outfit.name,
        thumbnail: outfit.dataUrl,
        description: outfit.description,
        items: outfit.items,
        style: outfit.style,
        duration: null
      }))
    : (outfitsByVibe[selectedVibe as keyof typeof outfitsByVibe] || outfitsByVibe.street).map(outfit => ({
        ...outfit,
        thumbnail: outfit.thumbnail,
        description: null,
        items: [],
        style: selectedVibe
      }))

  const toggleLike = (id: string | number) => {
    const idStr = String(id)
    setLikedIds(prev => {
      const next = new Set(prev)
      if (next.has(idStr)) {
        next.delete(idStr)
      } else {
        next.add(idStr)
      }
      return next
    })
  }

  const gradientStyles: Record<string, string> = {
    "gradient-1": "from-zinc-700 via-zinc-800 to-zinc-900",
    "gradient-2": "from-neutral-600 via-neutral-700 to-neutral-800",
    "gradient-3": "from-stone-600 via-stone-700 to-stone-800",
    "gradient-4": "from-gray-600 via-gray-700 to-gray-800",
    "gradient-5": "from-zinc-600 via-zinc-700 to-zinc-800",
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 h-full flex flex-col">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-foreground">AI-Generated Outfits</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {generatedOutfits.length > 0 
                ? `Showing ${generatedOutfits.length} generated ${selectedVibe} looks`
                : `Preview yourself in curated ${selectedVibe} looks`}
            </p>
          </div>
          {onGenerate && generatedOutfits.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <Sparkles className={cn("h-4 w-4", isGenerating && "animate-spin")} />
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto">
        {outfits.map((outfit) => {
          const isPlaying = playingId === outfit.id
          const isHovered = hoveredId === outfit.id
          const isLiked = likedIds.has(outfit.id)

          return (
            <div
              key={outfit.id}
              className="group relative"
              onMouseEnter={() => setHoveredId(outfit.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Video Container */}
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border/50 bg-muted">
                {/* Generated Image or Gradient Placeholder */}
                {outfit.thumbnail && outfit.thumbnail.startsWith('data:image') ? (
                  <img
                    src={outfit.thumbnail}
                    alt={outfit.name}
                    className={cn(
                      "h-full w-full object-cover transition-all duration-500",
                      isPlaying && "scale-105"
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br transition-all duration-500",
                      gradientStyles[outfit.thumbnail] || gradientStyles["gradient-1"],
                      isPlaying && "scale-105"
                    )}
                  />
                )}

                {/* Animated shimmer effect when playing */}
                {isPlaying && (
                  <div className="absolute inset-0 animate-shimmer opacity-30" />
                )}

                {/* Silhouette placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative opacity-30">
                    <div className="h-16 w-12 rounded-full bg-foreground/20" />
                    <div className="absolute -bottom-1 left-1/2 h-14 w-16 -translate-x-1/2 rounded-b-2xl bg-foreground/20" />
                  </div>
                </div>

                {/* Play/Pause Button */}
                <button
                  onClick={() => setPlayingId(isPlaying ? null : outfit.id)}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-300",
                    isHovered || isPlaying ? "opacity-100" : "opacity-0"
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm transition-transform duration-300 hover:scale-110">
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-foreground" />
                    ) : (
                      <Play className="h-5 w-5 text-foreground ml-0.5" />
                    )}
                  </div>
                </button>

                {/* Duration Badge or Description */}
                {outfit.duration ? (
                  <div className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
                    {outfit.duration}
                  </div>
                ) : outfit.description ? (
                  <div className="absolute bottom-2 left-2 right-2 rounded bg-background/90 px-2 py-1.5 text-xs text-foreground backdrop-blur-sm max-h-20 overflow-y-auto">
                    {outfit.description}
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div
                  className={cn(
                    "absolute right-2 top-2 flex flex-col gap-1 transition-all duration-300",
                    isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                  )}
                >
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLike(outfit.id)
                          }}
                        >
                          <Heart
                            className={cn(
                              "h-3.5 w-3.5 transition-all duration-300",
                              isLiked ? "fill-foreground text-foreground scale-110" : "text-muted-foreground"
                            )}
                          />
                          <span className="sr-only">Like</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="tooltip-content text-foreground">
                        <p>{isLiked ? "Unlike" : "Like"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="sr-only">Download</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="tooltip-content text-foreground">
                        <p>Download</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Progress bar when playing */}
                {isPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-foreground/20">
                    <div className="h-full w-1/3 bg-foreground animate-[grow_8s_linear_infinite]" />
                  </div>
                )}
              </div>

              {/* Outfit Name */}
              <p className="mt-2 text-center text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-300 truncate">
                {outfit.name}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
