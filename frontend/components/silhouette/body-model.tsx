"use client"

import { useState, useRef } from "react"
import { Info, RotateCw, ZoomIn, ZoomOut, X, Send, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface Annotation {
  id: string
  bodyPart: string
  comment: string
  position: { x: number; y: number }
  timestamp: number
}

interface BodyModelProps {
  selectedBodyPart: string | null
  onBodyPartSelect: (part: string | null) => void
  annotations?: Annotation[]
  onAddAnnotation?: (bodyPart: string, comment: string) => void
  onRemoveAnnotation?: (id: string) => void
  onSavePreferences?: (preferences: { bodyPart: string, comment: string }[]) => void
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

export function BodyModel({
  selectedBodyPart,
  onBodyPartSelect,
  annotations = [],
  onAddAnnotation,
  onRemoveAnnotation,
  onSavePreferences,
}: BodyModelProps) {
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [hoveredPart, setHoveredPart] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [showAnnotationInput, setShowAnnotationInput] = useState(false)
  const [draggedAnnotation, setDraggedAnnotation] = useState<string | null>(null)
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null)
  const [floatingInputMode, setFloatingInputMode] = useState(false)
  const [floatingInputValue, setFloatingInputValue] = useState("")
  const [floatingBodyPart, setFloatingBodyPart] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const floatingInputRef = useRef<HTMLInputElement>(null)

  const bodyPartColors: Record<string, { bg: string; border: string; text: string; line: string; dot: string }> = {
    head: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", line: "#1e40af", dot: "#1e40af" },
    torso: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900", line: "#6b21a8", dot: "#6b21a8" },
    arms: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-900", line: "#be185d", dot: "#be185d" },
    legs: { bg: "bg-green-50", border: "border-green-200", text: "text-green-900", line: "#15803d", dot: "#15803d" },
    feet: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-900", line: "#b45309", dot: "#b45309" },
  }

  const bodyPartPositions: Record<string, { y: number }> = {
    head: { y: 70 },
    torso: { y: 145 },
    arms: { y: 140 },
    legs: { y: 275 },
    feet: { y: 305 },
  }

  const handleAddComment = () => {
    if (selectedBodyPart && commentText.trim() && onAddAnnotation) {
      onAddAnnotation(selectedBodyPart, commentText)
      setCommentText("")
      setShowAnnotationInput(false)
    }
  }

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    annotationId: string
  ) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    
    if (containerRect) {
      setDraggedAnnotation(annotationId)
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedAnnotation && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const newX = e.clientX - containerRect.left - dragOffset.x
      const newY = e.clientY - containerRect.top - dragOffset.y
      
      setCustomPositions((prev) => ({
        ...prev,
        [draggedAnnotation]: {
          x: newX,
          y: newY,
        },
      }))
    }
  }

  const handleMouseUp = () => {
    setDraggedAnnotation(null)
  }

  const groupedAnnotations = annotations.reduce(
    (acc, annotation) => {
      if (!acc[annotation.bodyPart]) {
        acc[annotation.bodyPart] = []
      }
      acc[annotation.bodyPart].push(annotation)
      return acc
    },
    {} as Record<string, Annotation[]>
  )

  const handleRotate = () => {
    setRotation((prev) => prev + 45)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 1.3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.8))
  }

  const handleSave = async () => {
    try {
      // Convert annotations to preferences format
      const preferences = annotations.map(ann => ({
        bodyPart: ann.bodyPart,
        comment: ann.comment
      }))

      // Send to backend
      const response = await fetch('http://localhost:3000/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      const saved = await response.json()
      console.log('Preferences saved:', saved)

      // Notify parent component
      if (onSavePreferences) {
        onSavePreferences(preferences)
      }

      // Show success feedback
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      alert('Failed to save preferences. Please try again.')
    }
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

        {/* Save Button */}
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
              >
                <Check className={cn(
                  "h-4 w-4 transition-all duration-300",
                  isSaved && "scale-110"
                )} />
                {isSaved ? "Saved" : "Save"}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="tooltip-content text-foreground">
              <p>Lock in your customizations</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 3D Model Area with Connected Annotations */}
      <div 
        className="relative flex-1 overflow-hidden p-6" 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--border)_1px,_transparent_1px)] bg-[size:24px_24px] opacity-30" />

        {/* Annotation Connectors SVG */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          key={`svg-${Object.keys(customPositions).length}`}
        >
          {Object.entries(groupedAnnotations).map(([bodyPart, items]) => {
            const bodyPartPos = bodyPartPositions[bodyPart]?.y || 0
            const colors = bodyPartColors[bodyPart]
            return items.map((item, index) => {
              const customPos = customPositions[item.id]
              const isLeft = index % 2 === 0
              const offsetX = isLeft ? -160 : 160
              const offsetY = (index * 40) - (items.length * 20)
              
              // Get container bounds - using a fallback calculation
              const container = containerRef.current
              let bodyStartX = 300
              let bodyStartY = 150
              let containerWidth = 600
              let containerHeight = 500
              
              if (container) {
                containerWidth = container.offsetWidth || 600
                containerHeight = container.offsetHeight || 500
                bodyStartX = containerWidth / 2
                bodyStartY = (bodyPartPos / 400) * containerHeight + 24
              }
              
              // For arms, offset to left/right shoulder
              let armOffsetX = 0
              if (bodyPart === "arms") {
                armOffsetX = isLeft ? -85 : 85
                bodyStartX = bodyStartX + armOffsetX
              }
              
              // For feet, offset to left/right foot
              if (bodyPart === "feet") {
                const footOffsetX = isLeft ? -35 : 35
                bodyStartX = bodyStartX + footOffsetX
              }
              
              // Note position - match the actual note box position
              let noteX = containerWidth / 2 + offsetX
              let noteY = bodyStartY + offsetY
              
              if (customPos) {
                noteX = customPos.x + 64
                noteY = customPos.y + 20
              }
              
              return (
                <g key={`connector-${item.id}`}>
                  {/* Connection line */}
                  <line
                    x1={bodyStartX}
                    y1={bodyStartY}
                    x2={noteX}
                    y2={noteY}
                    stroke="#ffffff"
                    strokeWidth="3"
                    opacity="0.8"
                  />
                </g>
              )
            })
          })}
        </svg>

        {/* Model Container */}
        <div
          className="relative mx-auto h-full w-full max-w-[280px] transition-transform duration-500 ease-out"
          style={{
            transform: `rotateY(${rotation}deg)`,
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
              cy="55"
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
              onClick={(e) => {
                onBodyPartSelect(selectedBodyPart === "head" ? null : "head")
                setFloatingBodyPart("head")
                const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
                const containerRect = containerRef.current?.getBoundingClientRect()
                if (containerRect) {
                  setClickPosition({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                  })
                }
              }}
              onMouseEnter={() => setHoveredPart("head")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Torso */}
            <path
              d="M60 90 L140 90 L150 190 L130 200 L70 200 L50 190 Z"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "torso"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "torso"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={(e) => {
                onBodyPartSelect(selectedBodyPart === "torso" ? null : "torso")
                setFloatingBodyPart("torso")
                const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
                const containerRect = containerRef.current?.getBoundingClientRect()
                if (containerRect) {
                  setClickPosition({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                  })
                }
              }}
              onMouseEnter={() => setHoveredPart("torso")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Left Arm */}
            <path
              d="M60 90 L40 100 L20 180 L30 185 L55 115 L60 120"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "arms"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "arms"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onBodyPartSelect(selectedBodyPart === "arms" ? null : "arms")
                setFloatingBodyPart("arms")
                const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
                const containerRect = containerRef.current?.getBoundingClientRect()
                if (containerRect) {
                  setClickPosition({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                  })
                }
              }}
              onMouseEnter={() => setHoveredPart("arms")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Right Arm */}
            <path
              d="M140 90 L160 100 L180 180 L170 185 L145 115 L140 120"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "arms"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "arms"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onBodyPartSelect(selectedBodyPart === "arms" ? null : "arms")
                setFloatingBodyPart("arms")
                const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
                const containerRect = containerRef.current?.getBoundingClientRect()
                if (containerRect) {
                  setClickPosition({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                  })
                }
              }}
              onMouseEnter={() => setHoveredPart("arms")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Left Leg */}
            <path
              d="M70 200 L65 290 L55 350 L75 355 L85 295 L95 200"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "legs"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "legs"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={(e) => {
                onBodyPartSelect(selectedBodyPart === "legs" ? null : "legs")
                setFloatingBodyPart("legs")
                const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
                const containerRect = containerRef.current?.getBoundingClientRect()
                if (containerRect) {
                  setClickPosition({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                  })
                }
              }}
              onMouseEnter={() => setHoveredPart("legs")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Right Leg */}
            <path
              d="M130 200 L135 290 L145 350 L125 355 L115 295 L105 200"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                selectedBodyPart === "legs"
                  ? "fill-foreground/30 stroke-foreground stroke-2"
                  : hoveredPart === "legs"
                  ? "fill-foreground/20 stroke-foreground/60 stroke-2"
                  : "fill-foreground/5 stroke-foreground/20 stroke-1"
              )}
              onClick={(e) => {
                onBodyPartSelect(selectedBodyPart === "legs" ? null : "legs")
                setFloatingBodyPart("legs")
                const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
                const containerRect = containerRef.current?.getBoundingClientRect()
                if (containerRect) {
                  setClickPosition({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                  })
                }
              }}
              onMouseEnter={() => setHoveredPart("legs")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Left Foot */}
            <ellipse
              cx="65"
              cy="360"
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
              onClick={(e) => {
                onBodyPartSelect(selectedBodyPart === "feet" ? null : "feet")
                setFloatingBodyPart("feet")
                const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
                const containerRect = containerRef.current?.getBoundingClientRect()
                if (containerRect) {
                  setClickPosition({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                  })
                }
              }}
              onMouseEnter={() => setHoveredPart("feet")}
              onMouseLeave={() => setHoveredPart(null)}
            />

            {/* Right Foot */}
            <ellipse
              cx="135"
              cy="360"
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
              onClick={(e) => {
                onBodyPartSelect(selectedBodyPart === "feet" ? null : "feet")
                setFloatingBodyPart("feet")
                const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
                const containerRect = containerRef.current?.getBoundingClientRect()
                if (containerRect) {
                  setClickPosition({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                  })
                }
              }}
              onMouseEnter={() => setHoveredPart("feet")}
              onMouseLeave={() => setHoveredPart(null)}
            />
          </svg>

          {/* Glow effect on selected part */}
          {selectedBodyPart && (
            <div className="pointer-events-none absolute inset-0 animate-pulse-glow rounded-full opacity-30" />
          )}
        </div>

        {/* Annotation Notes - Positioned around the body */}
        <div>
          {Object.entries(groupedAnnotations).map(([bodyPart, items]) => {
            const bodyPartPos = bodyPartPositions[bodyPart]?.y || 0
            const colors = bodyPartColors[bodyPart]
            return items.map((item, index) => {
              const isLeft = index % 2 === 0
              const offsetX = isLeft ? -160 : 160
              const offsetY = (index * 40) - (items.length * 20)
              
              // Use custom position if available, otherwise calculate default
              const customPos = customPositions[item.id]
              const posX = customPos ? customPos.x : 0
              const posY = customPos ? customPos.y : 0
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "absolute rounded-lg border px-3 py-2 text-xs w-32 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all",
                    colors?.bg,
                    colors?.border,
                    colors?.text,
                    draggedAnnotation === item.id ? "cursor-grabbing shadow-lg" : "cursor-grab hover:shadow-md"
                  )}
                  style={
                    customPos
                      ? {
                          left: `${posX}px`,
                          top: `${posY}px`,
                          transform: "none",
                          zIndex: 20,
                        }
                      : {
                          left: `calc(50% + ${offsetX}px)`,
                          top: `calc(${(bodyPartPos / 400) * 100}% + ${offsetY}px)`,
                          zIndex: 20,
                        }
                  }
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 leading-tight select-none">{item.comment}</p>
                    {onRemoveAnnotation && (
                      <button
                        onClick={() => onRemoveAnnotation(item.id)}
                        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          })}
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

        {/* Floating Add Note Button / Input */}
        {floatingBodyPart && clickPosition && (
          floatingInputMode ? (
            <div
              className="absolute animate-in fade-in zoom-in-95 duration-200"
              style={{
                left: `${clickPosition.x}px`,
                top: `${clickPosition.y}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <input
                ref={floatingInputRef}
                type="text"
                value={floatingInputValue}
                onChange={(e) => setFloatingInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && floatingInputValue.trim()) {
                    // Use floatingBodyPart which was set when the body part was clicked
                    const bodyPart = floatingBodyPart || selectedBodyPart
                    if (bodyPart && onAddAnnotation) {
                      onAddAnnotation(bodyPart, floatingInputValue)
                    }                    setFloatingInputValue("")
                    setFloatingInputMode(false)
                    setClickPosition(null)
                    setFloatingBodyPart(null)
                  } else if (e.key === 'Escape') {
                    setFloatingInputMode(false)
                    setFloatingInputValue("")
                    setFloatingBodyPart(null)
                  }
                }}
                onBlur={() => {
                  setFloatingInputMode(false)
                  setFloatingInputValue("")
                  setFloatingBodyPart(null)
                }}
                placeholder="Add note..."
                className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setFloatingInputMode(true)
              }}
              className="absolute gap-2 animate-in fade-in zoom-in-95 duration-200"
              style={{
                left: `${clickPosition.x}px`,
                top: `${clickPosition.y}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              + Note
            </Button>
          )
        )}
      </div>

      {/* Footer - Body Part Pills & Input */}
      <div className="border-t border-border/30 p-4">
        {/* Body Part Pills */}
        <div className="mb-4 flex flex-wrap justify-center gap-2">
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

        {/* Annotation Input Section - Always reserve space */}
        <div className="min-h-[88px]">
          {selectedBodyPart && (
            <div className="rounded-lg border border-border/50 bg-background/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    bodyPartColors[selectedBodyPart]?.bg || "bg-gray-300"
                  )}
                />
                <p className="text-xs font-medium text-foreground">
                  Note for {bodyParts.find((p) => p.id === selectedBodyPart)?.label}
                </p>
              </div>
              {!showAnnotationInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnotationInput(true)}
                  className="w-full text-xs"
                >
                  + Note
                </Button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write your styling note..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment()
                      }
                    }}
                    autoFocus
                    className="flex-1 rounded border border-border/50 bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="gap-1 px-2"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAnnotationInput(false)
                      setCommentText("")
                    }}
                    className="px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
