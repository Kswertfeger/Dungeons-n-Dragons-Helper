import os
import io
import numpy as np
import tensorflow as tf
from PIL import Image

TFLITE_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), 'd6.tflite'))

_interpreter = None


def _get_interpreter() -> tf.lite.Interpreter:
    global _interpreter
    if _interpreter is None:
        _interpreter = tf.lite.Interpreter(model_path=TFLITE_PATH)
        _interpreter.allocate_tensors()
    return _interpreter


def predict_face(image_bytes: bytes) -> dict:
    """
    Returns {"value": int, "confidence": float} where value is 1–6.
    Raises FileNotFoundError if the model hasn't been trained/converted yet.
    """
    if not os.path.exists(TFLITE_PATH):
        raise FileNotFoundError(
            f'TFLite model not found at {TFLITE_PATH}. '
            'Run train.py then convert.py first.'
        )

    interpreter = _get_interpreter()
    input_details  = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    img = Image.open(io.BytesIO(image_bytes)).convert('RGB').resize((224, 224))
    arr = np.array(img, dtype=np.float32)[np.newaxis]  # (1, 224, 224, 3)

    interpreter.set_tensor(input_details[0]['index'], arr)
    interpreter.invoke()

    probs = interpreter.get_tensor(output_details[0]['index'])[0]  # (6,)
    face_value = int(np.argmax(probs)) + 1  # classes 0–5 → faces 1–6
    confidence = float(np.max(probs))

    return {'value': face_value, 'confidence': confidence}
