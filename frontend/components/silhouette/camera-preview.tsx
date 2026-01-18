"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, CameraOff, Maximize2, RotateCcw, Scan, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
// @ts-ignore - Overshoot SDK types may not be available
import { RealtimeVision } from '@overshoot/sdk'

interface CameraPreviewProps {
  selectedVibe: string
  selectedItem?: string
  onCapture?: (data: { snapshot: string, overshootData: any }) => void
}

export function CameraPreview({ selectedVibe, selectedItem, onCapture }: CameraPreviewProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [lastOvershootData, setLastOvershootData] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 }
      })
      console.log('Camera stream obtained:', stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
        console.log('Camera started successfully')
        
        // Simulate analysis after camera starts
        setTimeout(() => {
          setIsAnalyzing(true)
          setTimeout(() => setIsAnalyzing(false), 2000)
        }, 1000)
      } else {
        console.error('Video element not found')
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

  const analyzeStyle = async () => {
    if (!streamRef.current) return

    setIsAnalyzing(true)
    chunksRef.current = []

    recorderRef.current = new MediaRecorder(streamRef.current, {
      mimeType: 'video/mp4'
    })

    recorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorderRef.current.onstop = async () => {
      console.log('Starting analysis with selectedItem:', selectedItem, 'selectedVibe:', selectedVibe)
      
      const blob = new Blob(chunksRef.current, { type: 'video/mp4' })
      const videoFile = new File([blob], 'capture.mp4', { type: 'video/mp4' })

      const results: any[] = []

      // Create dynamic prompt based on selections
      const itemLabels = ['shoes', 'tops', 'bottoms']
      const styleLabels = ['formal', 'streetwear', 'active']
      
      const selectedItemLabel = selectedItem && itemLabels.includes(selectedItem) ? selectedItem : null
      const selectedStyleLabel = selectedVibe && styleLabels.includes(selectedVibe) ? selectedVibe : null

      console.log('Selected item label:', selectedItemLabel, 'Selected style label:', selectedStyleLabel)

      let prompt = 'Analyze the person\'s style and body type.'
      
      if (selectedItemLabel) {
        prompt = `Analyze the person's ${selectedItemLabel} and body type. Focus specifically on their ${selectedItemLabel}.`
      }
      
      if (selectedStyleLabel) {
        prompt += ` Consider ${selectedStyleLabel} style preferences.`
      }

      prompt += ` Output a JSON object with exactly three properties: "colour" (string describing the dominant color), "style" (must be one of: formal, streetwear, active), "item" (must be one of: shoes, tops, bottoms).`
      
      if (selectedItemLabel) {
        prompt += ` Set "item" to "${selectedItemLabel}".`
      }
      
      if (selectedStyleLabel) {
        prompt += ` Set "style" to "${selectedStyleLabel}".`
      }
      
      prompt += ' Choose appropriate values to change their outfit and make them look nice.'

      console.log('Generated prompt:', prompt)

      // Get API key from environment or use backend endpoint
      const vision = new RealtimeVision({
        apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
        apiKey: process.env.NEXT_PUBLIC_OVERSHOOT_API_KEY || 'ovs_cc96a9b34f5fa6805c6579f6f50c9aa0',
        prompt: prompt,
        model: 'Qwen/Qwen3-VL-8B-Instruct',
        source: { type: 'video', file: videoFile },
        onResult: (result: any) => {
          console.log('Realtime result:', result.result)
          results.push(result.result)
        }
      })

      try {
        await vision.start()
        // Wait for processing to complete
        setTimeout(async () => {
          await vision.stop()
          const finalResult = results[results.length - 1] || 'No results'
          console.log('Final analysis result:', finalResult)
          
          // Try to parse JSON from the result
          try {
            let parsedResult = finalResult
            if (typeof finalResult === 'string') {
              // Try to extract JSON from string
              const jsonMatch = finalResult.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                parsedResult = JSON.parse(jsonMatch[0])
              }
            }
            setLastOvershootData(parsedResult)
          } catch (parseError) {
            console.error('Failed to parse Overshoot result:', parseError)
            setLastOvershootData({ text: finalResult })
          }
          
          setIsAnalyzing(false)
        }, 5000)
      } catch (error) {
        console.error('Analysis failed:', error)
        setIsAnalyzing(false)
      }
    }

    recorderRef.current.start()
    setTimeout(() => {
      if (recorderRef.current) {
        recorderRef.current.stop()
      }
    }, 2000)
  }

  const captureSnapshot = async () => {
    if (!videoRef.current || !isStreaming || !lastOvershootData) {
      console.warn('Cannot capture: camera not streaming or no Overshoot data')
      return
    }

    setIsCapturing(true)

    try {
      // Create canvas to capture video frame
      const canvas = canvasRef.current || document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Draw current video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      
      // Convert canvas to base64 image
      const snapshot = canvas.toDataURL('image/png')

      // Prepare data to send
      const captureData = {
        snapshot,
        overshootData: lastOvershootData
      }

      // Send to backend to save
      const response = await fetch('http://localhost:3000/api/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(captureData),
      })

      if (!response.ok) {
        throw new Error('Failed to save capture')
      }

      const savedData = await response.json()
      console.log('Capture saved:', savedData)

      // Notify parent component
      if (onCapture) {
        onCapture(captureData)
      }

      // Show success feedback
      alert('Capture saved successfully!')
    } catch (error) {
      console.error('Capture failed:', error)
      alert('Failed to capture. Please try again.')
    } finally {
      setIsCapturing(false)
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
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "h-full w-full object-cover",
            !isStreaming && "hidden"
          )}
        />
        {!isStreaming && (
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
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all duration-300"
                  onClick={analyzeStyle}
                  disabled={!isStreaming || isAnalyzing}
                >
                  <Scan className="h-4 w-4" />
                  <span className="sr-only">Analyze</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="tooltip-content text-foreground">
                <p>{!isStreaming ? "Start camera first" : isAnalyzing ? "Analyzing..." : "Analyze outfit"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Capture Button */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full transition-all duration-300",
                    lastOvershootData 
                      ? "bg-emerald-600 text-background hover:bg-emerald-700" 
                      : "bg-background/80 backdrop-blur-sm hover:bg-background"
                  )}
                  onClick={captureSnapshot}
                  disabled={!isStreaming || !lastOvershootData || isCapturing}
                >
                  <Save className="h-5 w-5" />
                  <span className="sr-only">Capture</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="tooltip-content text-foreground">
                <p>{!lastOvershootData ? "Analyze first" : isCapturing ? "Capturing..." : "Capture snapshot & analysis"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isStreaming && (
            <>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all duration-300"
                      onClick={stopCamera}
                    >
                      <CameraOff className="h-4 w-4" />
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
            </>
          )}
        </div>
        
        {/* Hidden canvas for snapshot capture */}
        <canvas ref={canvasRef} className="hidden" />
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
