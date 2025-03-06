"use client"

import type { ImageData } from "@/components/dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ResultsPanelProps {
  imageData: ImageData
  selectedBox: string | null
  onBoxSelect: (boxId: string) => void
}

export function ResultsPanel({ imageData, selectedBox, onBoxSelect }: ResultsPanelProps) {
  // Count defects
  const defectCount = imageData.boxes.filter((box) => box.isDefect).length

  // Group parts by type
  const partTypes = [...new Set(imageData.boxes.map((box) => box.label))]
  const partsByType = partTypes.map((type) => {
    const parts = imageData.boxes.filter((box) => box.label === type)
    const defects = parts.filter((part) => part.isDefect)
    return {
      type,
      count: parts.length,
      defects: defects.length,
    }
  })

  const handleExportResults = () => {
    // Create a JSON file with the results
    const resultsData = {
      timestamp: new Date().toISOString(),
      imageDimensions: {
        width: imageData.width,
        height: imageData.height,
      },
      detectedParts: imageData.boxes.map((box) => ({
        id: box.id,
        label: box.label,
        position: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        confidence: box.confidence,
        isDefect: box.isDefect || false,
      })),
    }

    // Create and download the file
    const blob = new Blob([JSON.stringify(resultsData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    a.download = `car-parts-analysis-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative p-4">
        <canvas
          id="results-canvas"
          className="w-full rounded-md border"
          style={{
            backgroundImage: `url(${imageData.url})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            height: "400px",
          }}
        />
      </div>

      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            <Button size="sm" onClick={handleExportResults}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-muted p-3 rounded-md">
              <div className="text-sm text-muted-foreground">Total Parts</div>
              <div className="text-2xl font-bold">{imageData.boxes.length}</div>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <div className="text-sm text-muted-foreground">Defects Found</div>
              <div className="text-2xl font-bold text-destructive">{defectCount}</div>
            </div>
          </div>

          <h4 className="font-medium mb-2">Parts Summary</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {partsByType.map((part) => (
                <div key={part.type} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                  <div>
                    <span className="font-medium">{part.type}</span>
                    <span className="text-sm text-muted-foreground ml-2">({part.count})</span>
                  </div>
                  {part.defects > 0 && (
                    <Badge variant="destructive">
                      {part.defects} Defect{part.defects > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

