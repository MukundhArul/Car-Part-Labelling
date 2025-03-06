from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import torch
import numpy as np
from ultralytics import YOLO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Remove 3001, keep only 3000
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

model = YOLO('best-60epochs.pt')

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Car Parts Labeling API. Use the /predict/ endpoint to upload images."}

@app.get("/favicon.ico")
async def favicon():
    return JSONResponse(status_code=204)

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        results = model(img)[0]

        boxes = []
        scores = []
        class_names = []

        if hasattr(results, 'boxes'):
            for box in results.boxes:
                boxes.append(box.xyxy[0].tolist())
                scores.append(float(box.conf))
                class_names.append(results.names[int(box.cls)])

            return JSONResponse(content={
                "success": True,
                "predictions": {
                    "boxes": boxes,
                    "scores": scores,
                    "class_names": class_names
                }
            })
        else:
            return JSONResponse(
                content={"success": False, "error": "No detections found"},
                status_code=400
            )
    except Exception as e:
        return JSONResponse(
            content={"success": False, "error": str(e)},
            status_code=500
        )
