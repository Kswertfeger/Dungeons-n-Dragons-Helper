import os
import pathlib
import tempfile
from inference_sdk import InferenceHTTPClient

ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY", "")
ROBOFLOW_MODEL_ID = os.environ.get("ROBOFLOW_MODEL_ID", "dice-number-detection/4")

_client = None


def _get_client() -> InferenceHTTPClient:
    global _client
    if _client is None:
        _client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=ROBOFLOW_API_KEY,
        )
    return _client


def predict_dice(image_bytes: bytes) -> list:
    """
    Sends image to Roboflow inference API and returns a list of detected
    dice face values (integers 1–6), one per detected die.
    """
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name
    try:
        result = _get_client().infer(tmp_path, model_id=ROBOFLOW_MODEL_ID)
    finally:
        pathlib.Path(tmp_path).unlink(missing_ok=True)

    values = []
    for pred in result.get("predictions", []):
        try:
            values.append(int(pred["class"]))
        except (KeyError, ValueError):
            pass
    return values
