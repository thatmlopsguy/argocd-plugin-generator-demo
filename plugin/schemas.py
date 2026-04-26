from pydantic import BaseModel


# --- Plugin (ArgoCD) ---
class PluginInputParameters(BaseModel):
    organization: str | None = None
    project: str | None = None
    environment: str | None = None


class PluginInput(BaseModel):
    parameters: PluginInputParameters | None = None


class PluginRequest(BaseModel):
    input: PluginInput | None = None


class PluginParameterOutput(BaseModel):
    tenant: str
    project: str
    environment: str
    status: str
    repo_url: str | None = None
    chart: str | None = None
    target_revision: str | None = None


class PluginResponse(BaseModel):
    output: dict
