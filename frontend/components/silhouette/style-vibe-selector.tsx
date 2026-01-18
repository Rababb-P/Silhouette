"use client"

import { useState } from "react"
import { Flame, Briefcase, Zap, Edit3, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface StyleVibeSelectorProps {
  selectedVibe: string
  onVibeSelect: (vibe: string) => void
}

const vibes = [
  {
    id: "street",
    label: "Street",
    icon: Flame,
    description: "Urban edge, casual cool",
    keywords: ["oversized", "layered", "sneakers", "graphic"],
  },
  {
    id: "formal",
    label: "Formal",
    icon: Briefcase,
    description: "Polished, sophisticated",
    keywords: ["tailored", "minimal", "elegant", "refined"],
  },
  {
    id: "sporty",
    label: "Sporty",
    icon: Zap,
    description: "Athletic, dynamic",
    keywords: ["functional", "breathable", "technical", "active"],
  },
  {
    id: "manual",
    label: "Manual",
    icon: Edit3,
    description: "Define your own style",
    keywords: ["custom", "personal", "unique", "yours"],
  },
]

export function StyleVibeSelector({ selectedVibe, onVibeSelect }: StyleVibeSelectorProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    console.log('[STYLE_VIBE_SAVE] Starting save style vibe...')
    console.log('[STYLE_VIBE_SAVE] Selected vibe:', selectedVibe)
    setIsSaving(true)
    try {
      console.log('[STYLE_VIBE_SAVE] Sending style vibe to backend...')
      const response = await fetch('/api/preferences/style-vibe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ styleVibe: selectedVibe }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to save style vibe'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorJson.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        console.error('Style vibe save error:', response.status, errorMessage)
        throw new Error(errorMessage)
      }

      const saved = await response.json()
      console.log('[STYLE_VIBE_SAVE] Style vibe saved successfully:', saved)
      console.log('[STYLE_VIBE_SAVE] Saved files:', {
        json: saved.styleVibe?.timestamp,
        text: 'latest_style_vibe.txt'
      })

      // Show success feedback
      console.log('[STYLE_VIBE_SAVE] Save completed successfully')
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (error) {
      console.error('[STYLE_VIBE_SAVE] Failed to save style vibe:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save style vibe. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-foreground">Style Vibe</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            Select one
          </span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSaved ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all duration-300",
                    isSaved && "bg-emerald-600 hover:bg-emerald-700"
                  )}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Check className={cn(
                    "h-4 w-4 transition-all duration-300",
                    isSaved && "scale-110"
                  )} />
                  {isSaved ? "Saved" : isSaving ? "Saving..." : "Save"}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="tooltip-content text-foreground">
                <p>Save style vibe preference</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {vibes.map((vibe) => {
          const isSelected = selectedVibe === vibe.id
          const Icon = vibe.icon

          return (
            <TooltipProvider key={vibe.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onVibeSelect(vibe.id)}
                    className={cn(
                      "group relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300",
                      isSelected
                        ? "border-foreground/30 bg-secondary"
                        : "border-border/50 bg-background hover:border-foreground/20 hover:bg-secondary/50"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300",
                        isSelected
                          ? "bg-foreground text-background"
                          : "bg-secondary text-muted-foreground group-hover:bg-foreground/10 group-hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <span
                        className={cn(
                          "block text-sm font-medium transition-colors duration-300",
                          isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {vibe.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {vibe.description}
                      </span>
                    </div>

                    {/* Selection indicator */}
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full transition-all duration-300",
                        isSelected ? "bg-emerald-500 scale-100" : "bg-muted-foreground/30 scale-75 group-hover:scale-100"
                      )}
                    />

                    {/* Glow effect on selected */}
                    {isSelected && (
                      <div className="absolute inset-0 -z-10 rounded-xl bg-foreground/5 blur-xl" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  className="tooltip-content max-w-[200px] text-foreground"
                >
                  <p className="mb-1 font-medium">{vibe.label} Style</p>
                  <div className="flex flex-wrap gap-1">
                    {vibe.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </div>
  )
}
