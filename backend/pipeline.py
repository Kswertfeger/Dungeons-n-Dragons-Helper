from model.predict import predict_face


def run_pipeline(image_file) -> dict:
    image_bytes = image_file.read()
    result = predict_face(image_bytes)
    return {
        'dice':  [result['value']],
        'total': result['value'],
        'count': 1,
    }
