import os

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import psycopg2
from psycopg2.extras import RealDictCursor

PLUGIN_TOKEN = os.getenv("AUTH_TOKEN")

DB_PARAMS = {
    "dbname": os.getenv("DB_NAME", "organization"),
    "user": os.getenv("DB_USER", "postgres"),
    "host": os.getenv("DB_HOST", "localhost"),
    "password": os.getenv("DB_PASSWORD", "mysecretpassword"),
    "port": os.getenv("DB_PORT", "5432"),
}

app = FastAPI()
security = HTTPBearer()


async def query_postgres():
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT tenant, status FROM organization")
            rows = cur.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Database error: {e}")
        return []


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.scheme != "Bearer" or credentials.credentials != PLUGIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid or missing token")
    return credentials


@app.post("/api/v1/getparams.execute")
async def get_params_execute(
    credentials: HTTPAuthorizationCredentials = Depends(verify_token),
):
    tenants = await query_postgres()
    return {"output": {"parameters": tenants}}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=4355)
