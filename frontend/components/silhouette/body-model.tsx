"use client"

import { useState } from "react"
import { Info, RotateCw, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface BodyModelProps {
  selectedBodyPart: string | null
  onBodyPartSelect: (part: string | null) => void
}

const bodyParts = [
  {
    id: "head",
    label: "Head",
    description: "Accessories, hair, eyewear",
    position: { top: "8%", left: "50%" },
    size: { width: "22%", height: "12%" },
  },
  {
    id: "torso",
    label: "Torso",
    description: "Tops, jackets, shirts",
    position: { top: "22%", left: "50%" },
    size: { width: "30%", height: "24%" },
  },
  {
    id: "arms",
    label: "Arms",
    description: "Sleeves, watches, bracelets",
    position: { top: "28%", left: "50%" },
    size: { width: "58%", height: "20%" },
  },
  {
    id: "legs",
    label: "Legs",
    description: "Pants, shorts, skirts",
    position: { top: "48%", left: "50%" },
    size: { width: "28%", height: "32%" },
  },
  {
    id: "feet",
    label: "Feet",
    description: "Shoes, sneakers, boots",
    position: { top: "82%", left: "50%" },
    size: { width: "26%", height: "10%" },
  },
]

export function BodyModel({ selectedBodyPart, onBodyPartSelect }: BodyModelProps) {
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [hoveredPart, setHoveredPart] = useState<string | null>(null)

  const handleRotate = () => {
    setRotation((prev) => prev + 45)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 1.3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.8))
  }

  return (
    <div className="relative flex h-full flex-col rounded-2xl border border-border/50 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 p-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-lg text-foreground">Body Focus</h2>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Info</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="tooltip-content max-w-[200px] text-foreground">
                <p>Click on any body part to get personalized style recommendations for that area.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleZoomOut}
                >
                  <ZoomOut className="h-4 w-4" />
                  <span className="sr-only">Zoom out</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="tooltip-content text-foreground">
                <p>Zoom out</p>
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
                  onClick={handleZoomIn}
                >
                  <ZoomIn className="h-4 w-4" />
                  <span className="sr-only">Zoom in</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="tooltip-content text-foreground">
                <p>Zoom in</p>
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
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                  <span className="sr-only">Rotate</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="tooltip-content text-foreground">
                <p>Rotate view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 3D Model Area */}
      <div className="relative flex-1 overflow-hidden p-6">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--border)_1px,_transparent_1px)] bg-[size:24px_24px] opacity-30" />

        {/* Model Container */}
        <div
          className="relative mx-auto h-full w-full max-w-[280px] transition-transform duration-500 ease-out"
          style={{
            transform: `scale(${zoom}) rotateY(${rotation}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Human Silhouette SVG */}
          <svg
            viewBox="0 0 200 400"
            className="h-full w-full"
            fill="none"
          >
            {/* Head */}
            <ellipse
              cx="100"
              cy="40"
              rx="28"
              ry="32"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "head"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "head"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={() => onBodyPartSelect(selectedBodyPart === "head" ? null : "head")}
              onMouseEnter={() => setHoveredPart("head")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Neck */}
            <rect
              x="88"
              y="70"
              width="24"
              height="20"
              rx="4"
              className="fill-foreground/5 stroke-foreground/20 stroke-1"
            />

            {/* Torso */}
            <path
              d="M60 90 L140 90 L150 180 L130 200 L70 200 L50 180 Z"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "torso"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "torso"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={() => onBodyPartSelect(selectedBodyPart === "torso" ? null : "torso")}
              onMouseEnter={() => setHoveredPart("torso")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Left Arm */}
            <path
              d="M60 90 L40 100 L25 160 L35 165 L55 115 L60 120"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "arms"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "arms"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={() => onBodyPartSelect(selectedBodyPart === "arms" ? null : "arms")}
              onMouseEnter={() => setHoveredPart("arms")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Right Arm */}
            <path
              d="M140 90 L160 100 L175 160 L165 165 L145 115 L140 120"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "arms"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "arms"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={() => onBodyPartSelect(selectedBodyPart === "arms" ? null : "arms")}
              onMouseEnter={() => setHoveredPart("arms")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Left Leg */}
            <path
              d="M70 200 L65 320 L55 380 L75 385 L85 325 L95 200"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "legs"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "legs"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={() => onBodyPartSelect(selectedBodyPart === "legs" ? null : "legs")}
              onMouseEnter={() => setHoveredPart("legs")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Right Leg */}
            <path
              d="M130 200 L135 320 L145 380 L125 385 L115 325 L105 200"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "legs"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "legs"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={() => onBodyPartSelect(selectedBodyPart === "legs" ? null : "legs")}
              onMouseEnter={() => setHoveredPart("legs")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Left Foot */}
            <ellipse
              cx="65"
              cy="390"
              rx="18"
              ry="8"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "feet"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "feet"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={() => onBodyPartSelect(selectedBodyPart === "feet" ? null : "feet")}
              onMouseEnter={() => setHoveredPart("feet")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Right Foot */}
            <ellipse
              cx="135"
              cy="390"
              rx="18"
              ry="8"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "feet"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "feet"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={() => onBodyPartSelect(selectedBodyPart === "feet" ? null : "feet")}
              onMouseEnter={() => setHoveredPart("feet")}
              onMouseLeave={() => setHoveredPart(null)}
            />
          </svg>

          {/* Glow effect on selected part */}
          {selectedBodyPart && (
            <div className="pointer-events-none absolute inset-0 animate-pulse-glow rounded-full opacity-30" />
          )}
        </div>

        {/* Floating Labels */}
        {(hoveredPart || selectedBodyPart) && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-border/50 bg-card/90 px-4 py-2 backdrop-blur-sm transition-all duration-300">
            {bodyParts.find((p) => p.id === (hoveredPart || selectedBodyPart)) && (
              <div className="text-center">
                <p className="font-medium text-foreground">
                  {bodyParts.find((p) => p.id === (hoveredPart || selectedBodyPart))?.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bodyParts.find((p) => p.id === (hoveredPart || selectedBodyPart))?.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body Part Pills */}
      <div className="border-t border-border/30 p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {bodyParts.map((part) => (
            <button
              key={part.id}
              onClick={() => onBodyPartSelect(selectedBodyPart === part.id ? null : part.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300",
                selectedBodyPart === part.id
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
              )}
            >
              {part.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
