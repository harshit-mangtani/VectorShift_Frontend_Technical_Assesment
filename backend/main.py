from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dag import is_dag
from models import ParseResponse, Pipeline

app = FastAPI(title="Pipeline Parser")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse", response_model=ParseResponse)
def parse_pipeline(pipeline: Pipeline) -> ParseResponse:
    return ParseResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=is_dag(
            (node.id for node in pipeline.nodes),
            [(edge.source, edge.target) for edge in pipeline.edges],
        ),
    )
