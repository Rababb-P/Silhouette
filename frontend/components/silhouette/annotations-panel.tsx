"use client"

import { useState } from "react"
import { X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Annotation {
  id: string
  bodyPart: string
  comment: string
  position: { x: number; y: number }
  timestamp: number
}

interface AnnotationsPanelProps {
  annotations: Annotation[]
  selectedBodyPart: string | null
  onAddAnnotation: (bodyPart: string, comment: string) => void
  onRemoveAnnotation: (id: string) => void
}

const bodyPartColors: Record<string, { bg: string; text: string; line: string }> = {
  head: { bg: "bg-blue-50", text: "text-blue-900", line: "stroke-blue-400" },
  torso: { bg: "bg-purple-50", text: "text-purple-900", line: "stroke-purple-400" },
  arms: { bg: "bg-pink-50", text: "text-pink-900", line: "stroke-pink-400" },
  legs: { bg: "bg-green-50", text: "text-green-900", line: "stroke-green-400" },
  feet: { bg: "bg-orange-50", text: "text-orange-900", line: "stroke-orange-400" },
}

const bodyPartLabels: Record<string, string> = {
  head: "Head",
  torso: "Torso",
  arms: "Arms",
  legs: "Legs",
  feet: "Feet",
}

export function AnnotationsPanel({
  annotations,
  selectedBodyPart,
  onAddAnnotation,
  onRemoveAnnotation,
}: AnnotationsPanelProps) {
  const [commentText, setCommentText] = useState("")
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set())

  const handleAddComment = () => {
    if (selectedBodyPart && commentText.trim()) {
      onAddAnnotation(selectedBodyPart, commentText)
      setCommentText("")
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedAnnotations)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedAnnotations(newExpanded)
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

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6">
      <h2 className="mb-6 font-serif text-lg text-foreground">Styling Notes</h2>

      {/* Comment Input Section */}
      {selectedBodyPart ? (
        <div className="mb-6 rounded-lg border border-border/50 bg-background/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div
              className={cn(
                "h-3 w-3 rounded-full",
                bodyPartColors[selectedBodyPart]?.bg || "bg-gray-300"
              )}
            />
            <p className="text-sm font-medium text-foreground">
              Add note for {bodyPartLabels[selectedBodyPart]}
            </p>
          </div>
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
              className="flex-1 rounded border border-border/50 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <Button
              variant="default"
              size="sm"
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-dashed border-border/50 bg-background/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Select a body part to add styling notes
          </p>
        </div>
      )}

      {/* Annotations List */}
      <div className="space-y-4">
        {Object.entries(groupedAnnotations).length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 bg-background/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No styling notes yet. Select a body part and add your first note.
            </p>
          </div>
        ) : (
          Object.entries(groupedAnnotations).map(([bodyPart, items]) => (
            <div key={bodyPart} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    bodyPartColors[bodyPart]?.bg || "bg-gray-300"
                  )}
                />
                <h3 className="text-sm font-semibold text-foreground">
                  {bodyPartLabels[bodyPart]}
                </h3>
                <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2 pl-4">
                {items.map((annotation) => (
                  <div
                    key={annotation.id}
                    className={cn(
                      "rounded-lg border border-border/50 p-3 transition-all",
                      bodyPartColors[bodyPart]?.bg || "bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "flex-1 text-sm",
                          bodyPartColors[bodyPart]?.text || "text-gray-900"
                        )}
                      >
                        {annotation.comment}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onRemoveAnnotation(annotation.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {Object.entries(groupedAnnotations).length > 0 && (
        <div className="mt-6 border-t border-border/30 pt-4">
          <p className="text-xs text-muted-foreground">
            Total notes: <span className="font-semibold">{annotations.length}</span>
          </p>
        </div>
      )}
    </div>
  )
}
