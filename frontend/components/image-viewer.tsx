"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import type { ImageData, BoundingBox } from "@/components/dashboard"
import { Pencil, MousePointer } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"

interface ImageViewerProps {
  imageData: ImageData
  selectedBox: string | null
  onBoxSelect: (boxId: string) => void
  onBoxUpdate: (box: BoundingBox) => void
  onAddBox: (box: Omit<BoundingBox, "id">) => void
}

export function ImageViewer({ imageData, selectedBox, onBoxSelect, onBoxUpdate, onAddBox }: ImageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawMode, setDrawMode] = useState(false)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  // Calculate the scale factor to fit the image in the container
  useEffect(() => {
    if (!containerRef.current || !imageData) return

    const containerWidth = containerRef.current.clientWidth
    const imageWidth = imageData.width

    const newScale = containerWidth / imageWidth
    setScale(newScale)
  }, [imageData, containerRef])

  // Draw the image and bounding boxes on the canvas
  useEffect(() => {
    if (!canvasRef.current || !imageData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions based on the scaled image
    canvas.width = imageData.width * scale
    canvas.height = imageData.height * scale

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw the image
    const img = new Image()
    img.src = imageData.url
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Draw bounding boxes
      imageData.boxes.forEach((box) => {
        const isSelected = box.id === selectedBox

        // Scale box coordinates
        const x = box.x * scale
        const y = box.y * scale
        const width = box.width * scale
        const height = box.height * scale

        // Set box style based on selection and defect status
        ctx.strokeStyle = box.isDefect ? "#ef4444" : isSelected ? "#3b82f6" : "#10b981"
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.strokeRect(x, y, width, height)

        // Draw label background
        ctx.fillStyle = box.isDefect
          ? "rgba(239, 68, 68, 0.8)"
          : isSelected
            ? "rgba(59, 130, 246, 0.8)"
            : "rgba(16, 185, 129, 0.8)"
        const labelWidth = ctx.measureText(box.label).width + 10
        ctx.fillRect(x, y - 25, labelWidth, 20)

        // Draw label text
        ctx.fillStyle = "white"
        ctx.font = "14px Arial"
        ctx.fillText(box.label, x + 5, y - 10)
      })
    }
  }, [imageData, selectedBox, scale])

  const getMousePosition = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!drawMode) {
      // Select box mode
      const pos = getMousePosition(e)
      const clickedBox = findBoxAtPosition(pos)

      if (clickedBox) {
        onBoxSelect(clickedBox.id)
      }
    } else {
      // Draw new box mode
      setIsDrawing(true)
      setStartPoint(getMousePosition(e))
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawMode) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const currentPoint = getMousePosition(e)

    // Clear canvas and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redraw the image
    const img = new Image()
    img.src = imageData.url
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Draw existing boxes
    imageData.boxes.forEach((box) => {
      const isSelected = box.id === selectedBox
      ctx.strokeStyle = box.isDefect ? "#ef4444" : isSelected ? "#3b82f6" : "#10b981"
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.strokeRect(box.x * scale, box.y * scale, box.width * scale, box.height * scale)

      // Draw label
      ctx.fillStyle = box.isDefect
        ? "rgba(239, 68, 68, 0.8)"
        : isSelected
          ? "rgba(59, 130, 246, 0.8)"
          : "rgba(16, 185, 129, 0.8)"
      const labelWidth = ctx.measureText(box.label).width + 10
      ctx.fillRect(box.x * scale, box.y * scale - 25, labelWidth, 20)

      ctx.fillStyle = "white"
      ctx.font = "14px Arial"
      ctx.fillText(box.label, box.x * scale + 5, box.y * scale - 10)
    })

    // Draw the new box being created
    const width = currentPoint.x - startPoint.x
    const height = currentPoint.y - startPoint.y

    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.strokeRect(startPoint.x * scale, startPoint.y * scale, width * scale, height * scale)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawMode) return

    setIsDrawing(false)

    const endPoint = getMousePosition(e)
    const width = Math.abs(endPoint.x - startPoint.x)
    const height = Math.abs(endPoint.y - startPoint.y)

    // Only add box if it has a minimum size
    if (width > 20 && height > 20) {
      const x = Math.min(startPoint.x, endPoint.x)
      const y = Math.min(startPoint.y, endPoint.y)

      onAddBox({
        x,
        y,
        width,
        height,
        label: "New Part",
        confidence: 1.0,
      })
    }

    // Turn off draw mode after creating a box
    setDrawMode(false)
  }

  const findBoxAtPosition = (pos: { x: number; y: number }) => {
    return imageData.boxes.find((box) => {
      return pos.x >= box.x && pos.x <= box.x + box.width && pos.y >= box.y && pos.y <= box.y + box.height
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center p-2 bg-muted/50 rounded-t-md">
        <div className="text-sm text-muted-foreground">
          {imageData.width} × {imageData.height}px
        </div>
        <div className="flex items-center gap-2">
          <Toggle pressed={!drawMode} onPressedChange={() => setDrawMode(false)} aria-label="Select mode">
            <MousePointer className="h-4 w-4" />
            <span className="ml-2">Select</span>
          </Toggle>
          <Toggle pressed={drawMode} onPressedChange={() => setDrawMode(true)} aria-label="Draw mode">
            <Pencil className="h-4 w-4" />
            <span className="ml-2">Draw</span>
          </Toggle>
        </div>
      </div>

      <div ref={containerRef} className="relative overflow-auto border bg-background" style={{ maxHeight: "70vh" }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
          className="cursor-crosshair"
        />
      </div>
    </div>
  )
}

