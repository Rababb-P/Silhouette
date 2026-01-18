"use client"

import { useState, useEffect } from "react"
import { Sparkles, RefreshCw, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface StyleRecommendationProps {
  selectedVibe: string
  selectedBodyPart: string | null
}

const recommendations: Record<string, Record<string, string>> = {
  street: {
    default: "Layer an oversized graphic tee under a cropped bomber for effortless edge.",
    head: "A structured cap or beanie adds instant street credibility to any look.",
    torso: "Try an oversized hoodie with a contrast zip-up layered underneath.",
    arms: "Roll up sleeves or add statement watches for subtle detail.",
    legs: "Wide-leg cargo pants with a tapered ankle create the perfect silhouette.",
    feet: "Chunky sneakers or high-top classics complete the urban aesthetic.",
  },
  formal: {
    default: "A well-fitted navy blazer transforms any outfit into polished perfection.",
    head: "Keep hair sleek and minimal—let the outfit speak for itself.",
    torso: "Invest in quality fabric—a crisp white shirt is always timeless.",
    arms: "French cuffs with subtle cufflinks add refined sophistication.",
    legs: "Tailored trousers with a clean break at the ankle elongate the frame.",
    feet: "Oxford shoes in cognac or black leather anchor formal attire elegantly.",
  },
  sporty: {
    default: "Mix technical fabrics with casual pieces for elevated athleisure appeal.",
    head: "A performance cap with mesh panels keeps you cool and camera-ready.",
    torso: "Compression base layers under loose tops create dynamic proportions.",
    arms: "Quarter-zip pullovers offer both function and streamlined style.",
    legs: "Joggers with tapered cuts balance comfort with a polished look.",
    feet: "Lightweight trainers in monochrome tones keep the focus on form.",
  },
}

export function StyleRecommendation({ selectedVibe, selectedBodyPart }: StyleRecommendationProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [currentRecommendation, setCurrentRecommendation] = useState("")
  const [displayedText, setDisplayedText] = useState("")
  const [manualStyle, setManualStyle] = useState("")

  const getRecommendation = () => {
    const vibeRecs = recommendations[selectedVibe] || recommendations.street
    return vibeRecs[selectedBodyPart || "default"] || vibeRecs.default
  }

  // Update recommendation when vibe or body part changes
  useEffect(() => {
    const newRec = getRecommendation()
    setCurrentRecommendation(newRec)
    setDisplayedText("")
    
    // Typewriter effect
    let index = 0
    const interval = setInterval(() => {
      if (index <= newRec.length) {
        setDisplayedText(newRec.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 20)

    return () => clearInterval(interval)
  }, [selectedVibe, selectedBodyPart])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setDisplayedText("")
    
    setTimeout(() => {
      const newRec = getRecommendation()
      setCurrentRecommendation(newRec)
      setIsRefreshing(false)
      
      // Typewriter effect
      let index = 0
      const interval = setInterval(() => {
        if (index <= newRec.length) {
          setDisplayedText(newRec.slice(0, index))
          index++
        } else {
          clearInterval(interval)
        }
      }, 20)
    }, 600)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentRecommendation)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Manual mode - show free text input
  if (selectedVibe === "manual") {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <Sparkles className="h-4 w-4 text-foreground" />
            </div>
            <h2 className="font-serif text-lg text-foreground">Add Your Style</h2>
          </div>
        </div>

        {/* Free Text Input */}
        <div className="relative rounded-xl border border-border/30 bg-background/50 p-4">
          <textarea
            value={manualStyle}
            onChange={(e) => setManualStyle(e.target.value)}
            placeholder="Describe your personal style, preferences, or any specific looks you want to achieve..."
            className="w-full min-h-[120px] resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          
          {/* Character count */}
          <div className="mt-2 flex justify-end">
            <span className="text-xs text-muted-foreground">
              {manualStyle.length} characters
            </span>
          </div>

          {/* Subtle corner accent */}
          <div className="absolute -right-px -top-px h-4 w-4 border-r border-t border-foreground/20 rounded-tr-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
            <Sparkles className="h-4 w-4 text-foreground" />
          </div>
          <h2 className="font-serif text-lg text-foreground">AI Stylist</h2>
        </div>
        {selectedBodyPart && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs capitalize text-muted-foreground">
            {selectedBodyPart}
          </span>
        )}
      </div>

      {/* Recommendation Card */}
      <div className="relative rounded-xl border border-border/30 bg-background/50 p-4">
        {/* Recommendation Text */}
        <p className="min-h-[60px] text-sm leading-relaxed text-foreground">
          {displayedText}
          <span className={cn(
            "ml-0.5 inline-block h-4 w-0.5 bg-foreground",
            displayedText.length === currentRecommendation.length ? "animate-pulse" : ""
          )} />
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4 transition-transform duration-500",
                      isRefreshing && "animate-spin"
                    )} />
                    <span className="sr-only">Refresh recommendation</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="tooltip-content text-foreground">
                  <p>New suggestion</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleCopy}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="sr-only">Copy recommendation</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="tooltip-content text-foreground">
                  <p>{isCopied ? "Copied!" : "Copy text"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <span className="text-xs text-muted-foreground">
            Powered by AI
          </span>
        </div>

        {/* Subtle corner accent */}
        <div className="absolute -right-px -top-px h-4 w-4 border-r border-t border-foreground/20 rounded-tr-xl" />
      </div>
    </div>
  )
}
