"use client"

import React, { useState } from 'react'
import { ImageUploader } from "@/components/image-uploader"
import { ImageViewer } from "@/components/image-viewer"
import { PartsPanel } from "@/components/parts-panel"
import { ResultsPanel } from "@/components/results-panel"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"

export type BoundingBox = {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  confidence?: number
  isDefect?: boolean
}

export type ImageData = {
  url: string
  width: number
  height: number
  boxes: BoundingBox[]
}

export default function Dashboard() {
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("upload")

  const handleImageUpload = async (file: File) => {
    setUploadedFile(file);
    const imageUrl = URL.createObjectURL(file)
    const img = new Image()
    img.src = imageUrl

    await new Promise((resolve) => {
      img.onload = () => {
        setImageData({
          url: imageUrl,
          width: img.width,
          height: img.height,
          boxes: [],
        })
        setActiveTab("annotate")
        resolve(null)
      }
    })
  }

  const handleProcessImage = async () => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile!);

      const response = await fetch("http://localhost:8000/predict/", {
        method: "POST",
        body: formData,
        headers: {
          // Remove Content-Type header to let browser set it with boundary
          'Accept': 'application/json',
        },
        mode: 'cors'  // Add explicit CORS mode
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Process successful response
        const newBoxes = data.predictions.boxes.map((box: number[], index: number) => ({
          id: `box-${Date.now()}-${index}`,
          x: box[0],
          y: box[1],
          width: box[2] - box[0],
          height: box[3] - box[1],
          label: data.predictions.class_names[index],
          confidence: data.predictions.scores[index]
        }));

        setImageData((prevImageData) => ({
          ...prevImageData!,
          boxes: [...prevImageData!.boxes, ...newBoxes]
        }));
        setActiveTab("results"); // Switch to the "Results" tab
      }
    } catch (error) {
      console.error("Error processing image:", error);
      // Add error handling UI feedback here
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBoxSelect = (boxId: string) => {
    setSelectedBox(boxId === selectedBox ? null : boxId)
  }

  const handleBoxUpdate = (updatedBox: BoundingBox) => {
    if (!imageData) return

    setImageData({
      ...imageData,
      boxes: imageData.boxes.map((box) => (box.id === updatedBox.id ? updatedBox : box)),
    })
  }

  const handleAddBox = (newBox: Omit<BoundingBox, "id">) => {
    if (!imageData) return

    const id = Date.now().toString()

    setImageData({
      ...imageData,
      boxes: [...imageData.boxes, { ...newBox, id }],
    })

    setSelectedBox(id)
  }

  const handleDeleteBox = (boxId: string) => {
    if (!imageData) return

    setImageData({
      ...imageData,
      boxes: imageData.boxes.filter((box) => box.id !== boxId),
    })

    if (selectedBox === boxId) {
      setSelectedBox(null)
    }
  }

  const handleSaveResults = () => {
    // In a real app, you would send the final results to your backend
    console.log("Saving results:", imageData)
    alert("Results saved successfully!")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Car Parts Labeling & Defect Detection"
        text="Upload an image of a vehicle to identify and label its parts and detect defects."
      >
        {imageData && (
          <Button onClick={handleSaveResults} disabled={isProcessing}>
            <Save className="mr-2 h-4 w-4" />
            Save Results
          </Button>
        )}
      </DashboardHeader>
      <Separator />

      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="md:col-span-5 lg:col-span-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="annotate" disabled={!imageData}>
              Annotate
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!imageData?.boxes.length}>
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="p-4 border rounded-md">
            <ImageUploader onUpload={handleImageUpload} isUploading={isProcessing} />
          </TabsContent>

          <TabsContent value="annotate" className="border rounded-md">
            {imageData && (
              <div className="relative">
                <ImageViewer
                  imageData={imageData}
                  selectedBox={selectedBox}
                  onBoxSelect={handleBoxSelect}
                  onBoxUpdate={handleBoxUpdate}
                  onAddBox={handleAddBox}
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg font-medium">Processing image...</span>
                  </div>
                )}
                <div className="p-4 flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("upload")}>
                    Back to Upload
                  </Button>
                  <Button onClick={handleProcessImage} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Detect Parts"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="border rounded-md">
            {imageData && imageData.boxes.length > 0 && (
              <ResultsPanel imageData={imageData} onBoxSelect={handleBoxSelect} selectedBox={selectedBox} />
            )}
          </TabsContent>
        </Tabs>

        <div className="md:col-span-2 lg:col-span-1">
          {imageData && (
            <PartsPanel
              boxes={imageData.boxes}
              selectedBox={selectedBox}
              onBoxSelect={handleBoxSelect}
              onBoxUpdate={handleBoxUpdate}
              onDeleteBox={handleDeleteBox}
            />
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

