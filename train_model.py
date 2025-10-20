import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
import os

def load_and_preprocess_data(dataset_path):
    """
    Loads and preprocesses image data using ImageDataGenerator.
    """
    # Create an ImageDataGenerator for data augmentation and normalization
    # Rescale all images by 1./255.
    datagen = ImageDataGenerator(rescale=1./255)

    # Load data from the train and validation subdirectories
    train_generator = datagen.flow_from_directory(
        os.path.join(dataset_path, 'train'),
        target_size=(150, 150),
        batch_size=32,
        class_mode='binary',
        classes=['fall', 'no_fall']
    )

    validation_generator = datagen.flow_from_directory(
        os.path.join(dataset_path, 'val'),
        target_size=(150, 150),
        batch_size=32,
        class_mode='binary',
        classes=['fall', 'no_fall']
    )
    
    return train_generator, validation_generator

def train_model(train_gen, val_gen):
    """
    Builds, compiles, and trains a CNN model.
    """
    # Build the CNN model
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=(150, 150, 3)),
        MaxPooling2D(2, 2),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(2, 2),
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D(2, 2),
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.5),
        Dense(1, activation='sigmoid')
    ])

    # Compile the model
    model.compile(
        loss='binary_crossentropy',
        optimizer='adam',
        metrics=['accuracy']
    )

    # Train the model
    model.fit(train_gen, epochs=10, validation_data=val_gen)

    # Save the trained model
    model.save('fall_detection_model.h5')
    print("Model trained and saved as 'fall_detection_model.h5'")

if __name__ == '__main__':
    # Replace 'path/to/your/dataset/images' with the actual path to your downloaded image dataset
    dataset_path = 'dataset/fall_dataset/images' # <--- This is the line to update

    # Check if the dataset path exists
    if not os.path.exists(dataset_path):
        print(f"ERROR: Dataset path '{dataset_path}' not found.")
        print("Please replace 'path/to/your/dataset/images' with the correct path to your data.")
    else:
        # Load and preprocess the data
        train_generator, validation_generator = load_and_preprocess_data(dataset_path)

        # Train the model
        if train_generator.samples > 0:
            train_model(train_generator, validation_generator)
        else:
            print("No data found to train the model.")
