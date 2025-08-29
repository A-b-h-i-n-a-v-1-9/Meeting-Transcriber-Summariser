from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import subprocess
import whisper
import os
import shutil
import logging

app = FastAPI()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load Whisper once
model = whisper.load_model("base")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class TranscriptInput(BaseModel):
    transcript: str

class FileNameInput(BaseModel):
    fileName: str

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        save_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return {"fileName": file.filename, "filePath": save_path}
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/transcribe")
async def transcribe(payload: FileNameInput):
    try:
        file_path = os.path.join(UPLOAD_DIR, payload.fileName)
        if not os.path.exists(file_path):
            return JSONResponse({"error": "File not found"}, status_code=404)

        result = model.transcribe(file_path)
        return {"transcript": result["text"]}
    except Exception as e:
        logger.error(f"Transcribe error: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/summarize")
async def summarize(payload: TranscriptInput):
    try:
        transcript = payload.transcript
        logger.info(f"Summarizing transcript: {transcript[:50]}...")
        result = subprocess.run(
            ["ollama", "run", "llama3:latest"],
            input=(
                "You are a meeting assistant. "
                "Summarize this transcript in 3-5 sentences and list 3 key insights. "
                "Respond in plain text only:\n\n"
                f"{transcript}"
            ),
            text=True,
            capture_output=True,
            check=True,
            timeout=60,
            encoding='utf-8'  # Explicitly set encoding
        )
        cleaned = "\n".join([l for l in result.stdout.splitlines() if not l.strip().startswith(">>>")])
        if not cleaned.strip():
            raise ValueError("No summary generated")
        return {"summary": cleaned.strip()}
    except subprocess.CalledProcessError as e:
        logger.error(f"Ollama error: {str(e)} - stdout: {e.stdout}, stderr: {e.stderr}")
        return JSONResponse({"error": f"Ollama failed: {str(e)}"}, status_code=500)
    except UnicodeDecodeError as e:
        logger.error(f"Encoding error: {str(e)} - Falling back to default handling")
        return {"summary": f"Summary unavailable due to encoding issue: {str(e)}"}
    except Exception as e:
        logger.error(f"Summarize error: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

# Add CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)