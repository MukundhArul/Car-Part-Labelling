"use client"

import type React from "react"

import { useState } from "react"
import type { BoundingBox } from "@/components/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface PartsPanelProps {
  boxes: BoundingBox[]
  selectedBox: string | null
  onBoxSelect: (boxId: string) => void
  onBoxUpdate: (box: BoundingBox) => void
  onDeleteBox: (boxId: string) => void
}

export function PartsPanel({ boxes, selectedBox, onBoxSelect, onBoxUpdate, onDeleteBox }: PartsPanelProps) {
  const [editingLabel, setEditingLabel] = useState("")

  const selectedBoxData = selectedBox ? boxes.find((box) => box.id === selectedBox) : null

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingLabel(e.target.value)
  }

  const handleLabelSave = () => {
    if (!selectedBoxData || !editingLabel) return

    onBoxUpdate({
      ...selectedBoxData,
      label: editingLabel,
    })

    setEditingLabel("")
  }

  const handleDefectToggle = (checked: boolean) => {
    if (!selectedBoxData) return

    onBoxUpdate({
      ...selectedBoxData,
      isDefect: checked,
    })
  }

  const handleBoxClick = (boxId: string) => {
    onBoxSelect(boxId)

    // Pre-fill the editing label with the current label
    const box = boxes.find((b) => b.id === boxId)
    if (box) {
      setEditingLabel(box.label)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Parts List</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-2">
            {boxes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No parts detected yet. Upload an image and run detection or manually add parts.
              </p>
            ) : (
              boxes.map((box) => (
                <div
                  key={box.id}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    box.id === selectedBox ? "bg-primary/10 border border-primary/50" : "hover:bg-muted"
                  }`}
                  onClick={() => handleBoxClick(box.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{box.label}</div>
                    {box.isDefect && (
                      <Badge variant="destructive" className="text-xs">
                        Defect
                      </Badge>
                    )}
                  </div>
                  {box.confidence && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {(box.confidence * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        {selectedBoxData ? (
          <div className="space-y-4">
            <h3 className="font-medium">Edit Selected Part</h3>

            <div className="space-y-2">
              <Label htmlFor="part-label">Part Label</Label>
              <div className="flex gap-2">
                <Input
                  id="part-label"
                  value={editingLabel}
                  onChange={handleLabelChange}
                  placeholder={selectedBoxData.label}
                />
                <Button size="sm" onClick={handleLabelSave} disabled={!editingLabel}>
                  Save
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between space-y-0">
              <Label htmlFor="defect-toggle">Mark as Defect</Label>
              <Switch
                id="defect-toggle"
                checked={selectedBoxData.isDefect || false}
                onCheckedChange={handleDefectToggle}
              />
            </div>

            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => onDeleteBox(selectedBoxData.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Part
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Select a part to edit its properties</p>
        )}
      </CardContent>
    </Card>
  )
}

