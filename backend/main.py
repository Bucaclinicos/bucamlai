from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import datos, modelos, asociacion, gemini, pareto, metricas, clima, auth

app = FastAPI(title="BUCAMLAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(datos.router, prefix="/datos", tags=["Datos"])
app.include_router(modelos.router, prefix="/modelos", tags=["Modelos ML"])
app.include_router(asociacion.router, prefix="/asociacion", tags=["Asociacion"])
app.include_router(gemini.router, prefix="/gemini", tags=["Gemini IA"])
app.include_router(pareto.router, prefix="/pareto", tags=["Pareto ABC"])
app.include_router(metricas.router, prefix="/metricas", tags=["Metricas"])
app.include_router(clima.router,   prefix="/clima",    tags=["Clima"])


@app.get("/")
def root():
    return {"mensaje": "BUCAMLAI API corriendo", "docs": "/docs"}
