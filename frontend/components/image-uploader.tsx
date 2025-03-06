"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, ImageIcon, Loader2 } from "lucide-react"

interface ImageUploaderProps {
  onUpload: (file: File) => void
  isUploading: boolean
}

export function ImageUploader({ onUpload, isUploading }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        onUpload(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className={`border-2 border-dashed ${isDragging ? "border-primary" : "border-muted-foreground/25"}`}>
      <CardContent className="flex flex-col items-center justify-center p-10 text-center">
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-4"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="rounded-full bg-muted p-6">
            {isUploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div className="grid gap-1 text-center">
            <h3 className="text-xl font-semibold">Upload vehicle image</h3>
            <p className="text-sm text-muted-foreground">Drag and drop your image here or click to browse</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          <Button variant="outline" onClick={handleButtonClick} disabled={isUploading} className="mt-2">
            <Upload className="mr-2 h-4 w-4" />
            Select Image
          </Button>

          <p className="text-xs text-muted-foreground mt-2">Supported formats: JPEG, PNG, WebP</p>
        </div>
      </CardContent>
    </Card>
  )
}

