from model.predict import predict_dice


def run_pipeline(image_file) -> dict:
    image_bytes = image_file.read()
    dice = predict_dice(image_bytes)
    if not dice:
        return {"dice": [], "total": 0, "count": 0, "error": "No dice detected"}
    return {"dice": dice, "total": sum(dice), "count": len(dice)}
