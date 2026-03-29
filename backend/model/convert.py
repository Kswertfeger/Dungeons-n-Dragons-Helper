"""
Convert the trained SavedModel to a TFLite file with dynamic-range quantization.

Usage (from repo root):
    python backend/model/convert.py
"""
import os
import tensorflow as tf

MODEL_DIR    = os.path.normpath(os.path.join(os.path.dirname(__file__), 'saved_model'))
TFLITE_PATH  = os.path.normpath(os.path.join(os.path.dirname(__file__), 'd6.tflite'))


def convert():
    converter = tf.lite.TFLiteConverter.from_saved_model(MODEL_DIR)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    with open(TFLITE_PATH, 'wb') as f:
        f.write(tflite_model)

    size_kb = os.path.getsize(TFLITE_PATH) / 1024
    print(f'TFLite model saved to {TFLITE_PATH}  ({size_kb:.0f} KB)')


if __name__ == '__main__':
    convert()
