from fastapi import FastAPI

from routers import plugin

app = FastAPI(title="ArgoCD Plugin Generator")

app.include_router(plugin.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=4355)
