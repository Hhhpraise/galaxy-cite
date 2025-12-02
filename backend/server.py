from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import asyncio
import json
from datetime import datetime
import uvicorn

from api.paper_analyzer import PaperAnalyzer, Paper
from api.similarity_engine import SimilarityEngine
from api.graph_builder import GraphBuilder

app = FastAPI(title="GalaxyCite API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
paper_analyzer = PaperAnalyzer()
similarity_engine = SimilarityEngine()
graph_builder = GraphBuilder()


class PaperRequest(BaseModel):
    input_type: str  # "doi", "arxiv", "title"
    value: str
    depth: int = 2
    max_papers: int = 100


@app.post("/api/analyze")
async def analyze_paper(request: PaperRequest):
    """Main endpoint: Analyze paper and build citation galaxy"""
    try:
        # Step 1: Fetch paper
        paper = await paper_analyzer.fetch_paper(
            request.value,
            request.input_type
        )

        # Step 2: Get references and build network
        network = await paper_analyzer.build_citation_network(
            paper.id,
            depth=request.depth,
            max_papers=request.max_papers
        )

        # Step 3: Calculate similarities
        enhanced_network = similarity_engine.enhance_with_similarity(
            network,
            top_k=10
        )

        # Step 4: Prepare visualization data
        galaxy_data = graph_builder.build_galaxy_structure(
            enhanced_network,
            layout="spherical",
            central_paper_id=paper.id
        )

        return JSONResponse({
            "success": True,
            "paper": {
                "id": paper.id,
                "title": paper.title,
                "abstract": paper.abstract,
                "authors": paper.authors,
                "year": paper.year,
                "citation_count": paper.citation_count,
                "url": paper.url,
                "doi": paper.doi,
                "arxiv_id": paper.arxiv_id,
                "fields": paper.fields
            },
            "network": enhanced_network,
            "galaxy": galaxy_data,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/examples")
async def get_examples():
    """Return example papers for quick testing"""
    examples = [
        {
            "id": "1706.03762",
            "title": "Attention Is All You Need",
            "type": "arxiv",
            "description": "The original Transformer paper"
        },
        {
            "id": "10.1038/s41586-020-2649-2",
            "title": "A guide to deep learning in healthcare",
            "type": "doi",
            "description": "Nature Medicine review"
        },
        {
            "id": "10.1126/science.1249098",
            "title": "The Human Brain Project",
            "type": "doi",
            "description": "Large-scale neuroscience research"
        }
    ]
    return examples


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)