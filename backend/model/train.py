"""
Train a MobileNetV2 classifier to read d6 face values (1–6).

Requires prepared data at backend/data/d6/train/ and backend/data/d6/val/.
Run prepare_data.py first.

Usage (from repo root):
    python backend/model/train.py
"""
import os
import tensorflow as tf
from tensorflow import keras

DATA_DIR      = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'data', 'd6'))
MODEL_SAVE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), 'saved_model'))
IMG_SIZE      = (224, 224)
BATCH_SIZE    = 32
EPOCHS_HEAD   = 10   # train classification head only
EPOCHS_TUNE   = 15   # fine-tune top layers of MobileNetV2


def build_model():
    base = keras.applications.MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights='imagenet',
    )
    base.trainable = False

    inputs = keras.Input(shape=(*IMG_SIZE, 3))
    # MobileNetV2 expects pixels scaled to [-1, 1]
    x = keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base(x, training=False)
    x = keras.layers.GlobalAveragePooling2D()(x)
    x = keras.layers.Dense(128, activation='relu')(x)
    x = keras.layers.Dropout(0.3)(x)
    outputs = keras.layers.Dense(6, activation='softmax')(x)

    return keras.Model(inputs, outputs), base


def load_datasets():
    augment = keras.Sequential([
        keras.layers.RandomFlip('horizontal_and_vertical'),
        keras.layers.RandomRotation(0.2),
        keras.layers.RandomZoom(0.15),
        keras.layers.RandomBrightness(0.2),
        keras.layers.RandomContrast(0.2),
    ])

    train_ds = keras.utils.image_dataset_from_directory(
        os.path.join(DATA_DIR, 'train'),
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='categorical',
        shuffle=True,
    )
    val_ds = keras.utils.image_dataset_from_directory(
        os.path.join(DATA_DIR, 'val'),
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='categorical',
    )

    train_ds = train_ds.map(
        lambda x, y: (augment(x, training=True), y),
        num_parallel_calls=tf.data.AUTOTUNE,
    ).prefetch(tf.data.AUTOTUNE)

    return train_ds, val_ds.prefetch(tf.data.AUTOTUNE)


def train():
    train_ds, val_ds = load_datasets()
    model, base = build_model()

    # Phase 1 — classification head only
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    print('\n=== Phase 1: training head ===')
    model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_HEAD)

    # Phase 2 — unfreeze top 30 layers of MobileNetV2 and fine-tune
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(1e-5),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    print('\n=== Phase 2: fine-tuning ===')
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_TUNE,
        callbacks=[
            keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True),
            keras.callbacks.ModelCheckpoint(MODEL_SAVE_DIR, save_best_only=True),
        ],
    )

    print(f'\nModel saved to {MODEL_SAVE_DIR}')


if __name__ == '__main__':
    train()
