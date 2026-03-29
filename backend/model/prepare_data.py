"""
Split raw photos into train/val sets and resize to 224x224.

Expects:
    backend/data/d6/raw/1/  ← your photos of face showing 1
    backend/data/d6/raw/2/
    ...
    backend/data/d6/raw/6/

Produces:
    backend/data/d6/train/1/
    backend/data/d6/val/1/
    ... etc.

Usage (from repo root):
    python backend/model/prepare_data.py
    python backend/model/prepare_data.py --raw backend/data/d6/raw --out backend/data/d6 --val_split 0.2
"""
import os
import random
import shutil
import argparse
from PIL import Image

IMG_SIZE = (224, 224)


def prepare(raw_dir: str, out_dir: str, val_split: float = 0.2):
    for face in range(1, 7):
        face_dir = os.path.join(raw_dir, str(face))
        if not os.path.isdir(face_dir):
            print(f'  WARNING: {face_dir} not found, skipping face {face}')
            continue

        images = [
            f for f in os.listdir(face_dir)
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.heic', '.webp'))
        ]
        if not images:
            print(f'  WARNING: no images found in {face_dir}')
            continue

        random.shuffle(images)
        n_val = max(1, int(len(images) * val_split))
        splits = {'val': images[:n_val], 'train': images[n_val:]}

        for split, files in splits.items():
            dest_dir = os.path.join(out_dir, split, str(face))
            os.makedirs(dest_dir, exist_ok=True)
            for fname in files:
                src = os.path.join(face_dir, fname)
                dst = os.path.join(dest_dir, fname)
                img = Image.open(src).convert('RGB').resize(IMG_SIZE, Image.LANCZOS)
                img.save(dst)

        print(f'  Face {face}: {len(splits["train"])} train, {len(splits["val"])} val')

    print(f'\nData written to {out_dir}')


if __name__ == '__main__':
    base = os.path.join(os.path.dirname(__file__), '..', 'data', 'd6')
    parser = argparse.ArgumentParser()
    parser.add_argument('--raw',       default=os.path.join(base, 'raw'))
    parser.add_argument('--out',       default=base)
    parser.add_argument('--val_split', type=float, default=0.2)
    args = parser.parse_args()
    prepare(os.path.normpath(args.raw), os.path.normpath(args.out), args.val_split)
