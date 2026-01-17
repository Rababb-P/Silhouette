"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, CameraOff, Maximize2, RotateCcw, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface CameraPreviewProps {
  selectedVibe: string
}

export function CameraPreview({ selectedVibe }: CameraPreviewProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
        
        // Simulate analysis after camera starts
        setTimeout(() => {
          setIsAnalyzing(true)
          setTimeout(() => setIsAnalyzing(false), 2000)
        }, 1000)
      }
    } catch (err) {
      console.log("Camera access denied or not available:", err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setIsStreaming(false)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const vibeOverlayColor = {
    street: "from-zinc-900/20",
    formal: "from-neutral-900/20",
    sporty: "from-stone-900/20",
  }[selectedVibe] || "from-zinc-900/20"

  return (
    <div className="relative flex flex-col">
      {/* Main Preview Container */}
      <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/50 bg-card">
        {/* Video/Placeholder */}
        {isStreaming ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-background">
            <div className="relative mb-6">
              <div className="h-32 w-24 rounded-full border-2 border-dashed border-muted-foreground/30" />
              <div className="absolute -bottom-2 left-1/2 h-20 w-28 -translate-x-1/2 rounded-b-3xl border-2 border-t-0 border-dashed border-muted-foreground/30" />
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Enable camera for live try-on
            </p>
            <Button
              onClick={startCamera}
              className="gap-2 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300"
            >
              <Camera className="h-4 w-4" />
              Start Camera
            </Button>
          </div>
        )}

        {/* Vibe Overlay Effect */}
        {isStreaming && (
          <div className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent transition-all duration-500",
            vibeOverlayColor
          )} />
        )}

        {/* Scanning Animation */}
        {isAnalyzing && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-foreground/50 to-transparent animate-scan-line" />
          </div>
        )}

        {/* Corner Frames */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-foreground/30" />
          <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-foreground/30" />
          <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-foreground/30" />
          <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-foreground/30" />
        </div>

        {/* Status Indicator */}
        {isStreaming && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-foreground">LIVE</span>
          </div>
        )}

        {/* Vibe Badge */}
        {isStreaming && (
          <div className="absolute right-4 top-4 rounded-full border border-border/50 bg-background/80 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {selectedVibe}
            </span>
          </div>
        )}

        {/* Bottom Controls */}
        {isStreaming && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all duration-300"
                    onClick={() => {
                      setIsAnalyzing(true)
                      setTimeout(() => setIsAnalyzing(false), 2000)
                    }}
                  >
                    <Scan className="h-4 w-4" />
                    <span className="sr-only">Analyze</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="tooltip-content text-foreground">
                  <p>Analyze outfit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-300"
                    onClick={stopCamera}
                  >
                    <CameraOff className="h-5 w-5" />
                    <span className="sr-only">Stop camera</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="tooltip-content text-foreground">
                  <p>Stop camera</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all duration-300"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span className="sr-only">Fullscreen</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="tooltip-content text-foreground">
                  <p>Fullscreen</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Camera Switch (for mobile) */}
      {isStreaming && (
        <div className="mt-4 flex justify-center md:hidden">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Switch Camera
          </Button>
        </div>
      )}
    </div>
  )
}
