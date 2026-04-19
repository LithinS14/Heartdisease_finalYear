#!/usr/bin/env python3
import sys
import numpy as np
import tensorflow as tf
import pickle
import pandas as pd
import os
import warnings

# Suppress all warnings and TensorFlow logging
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.get_logger().setLevel('ERROR')

def main():
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Construct absolute paths to model and scaler
        model_path = os.path.join(script_dir, "heart_disease_model.keras")
        scaler_path = os.path.join(script_dir, "scaler.pkl")
        
        # Check if files exist
        if not os.path.exists(model_path):
            print(f"Error: Model file not found at {model_path}", file=sys.stderr)
            return 1
        
        if not os.path.exists(scaler_path):
            print(f"Error: Scaler file not found at {scaler_path}", file=sys.stderr)
            return 1
        
        # Load trained model and scaler
        model = tf.keras.models.load_model(model_path)
        with open(scaler_path, "rb") as f:
            scaler = pickle.load(f)
        
        # Validate input arguments
        if len(sys.argv) < 14:
            print(f"Error: Expected 13 input values, got {len(sys.argv) - 1}", file=sys.stderr)
            return 1
        
        # Get input from command line arguments
        input_data = np.array([float(x) for x in sys.argv[1:14]], dtype=float).reshape(1, -1)

        # Convert input data to a DataFrame with feature names
        feature_names = [
            "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", 
            "thalach", "exang", "oldpeak", "slope", "ca", "thal"
        ]
        input_df = pd.DataFrame(input_data, columns=feature_names)

        # Scale the input data
        scaled_data = scaler.transform(input_df)

        # Predict (suppress progress bars)
        prediction = model.predict(scaled_data, verbose=0)

        # Get prediction value and confidence
        confidence_score = float(prediction[0][0])
        prediction_result = 1 if confidence_score > 0.5 else 0
        
        # Calculate confidence as percentage (0-100)
        confidence_percentage = (confidence_score * 100) if confidence_score > 0.5 else ((1 - confidence_score) * 100)
        confidence_percentage = min(100, max(0, confidence_percentage))

        # Print in format expected by backend
        sys.stdout.write(f"Prediction: {prediction_result}, Confidence: {confidence_percentage:.1f}%\n")
        sys.stdout.flush()
        return 0
        
    except Exception as e:
        print(f"Error during prediction: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return 1

if __name__ == "__main__":
    exit(main())
