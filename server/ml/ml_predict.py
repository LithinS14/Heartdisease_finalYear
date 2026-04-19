import sys
import numpy as np
import tensorflow as tf
import pickle
import pandas as pd
import os

# Suppress TensorFlow logging and progress bars
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress all logs except errors
tf.get_logger().setLevel('ERROR')  # Suppress TensorFlow warnings

try:
    # Load trained model and scaler
    model = tf.keras.models.load_model("ml/heart_disease_model.keras")
    with open("ml/scaler.pkl", "rb") as f:
        scaler = pickle.load(f)
except Exception as e:
    print("Error loading model or scaler:", str(e))
    sys.exit(1)

try:
    # Get input from command line arguments
    input_data = np.array(sys.argv[1:], dtype=float).reshape(1, -1)

    # Convert input data to a DataFrame with feature names
    feature_names = [
        "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", 
        "thalach", "exang", "oldpeak", "slope", "ca", "thal"
    ]
    input_df = pd.DataFrame(input_data, columns=feature_names)

    # Scale the input data
    scaled_data = scaler.transform(input_df)

    # Predict (suppress progress bars)
    prediction = model.predict(scaled_data, verbose=0)  # Set verbose=0 to suppress logs

    # Determine the result
    result = "Heart Disease Detected" if prediction[0][0] > 0.5 else "No Heart Disease"

    # Print only the result
    print(result)
except Exception as e:
    print("Error during prediction:", str(e))
    sys.exit(1)