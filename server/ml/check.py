# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import Adam
import pickle  # Use pickle instead of joblib

# Step 1: Load the dataset
data = pd.read_csv('/content/heart.csv')

print(data.head())
print(data.info())

# Step 2: Data Preprocessing
X = data.drop(columns=['target'])  # Features
y = data['target']                # Target

# Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Standardize the Data
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)  # Fit and transform the training data
X_test = scaler.transform(X_test)       # Transform the test data using the same scaler

# Save the scaler for later use in the web application
with open("scaler.pkl", "wb") as f:  # Use pickle to save the scaler
    pickle.dump(scaler, f)
print("Scaler saved successfully as 'scaler.pkl'")

# Step 3: Build the Model
model = Sequential([
    Dense(64, activation='relu', input_shape=(X_train.shape[1],)),
    Dropout(0.3),
    Dense(32, activation='relu'),
    Dropout(0.2),
    Dense(1, activation='sigmoid')  # Binary classification
])

# Compile the Model
model.compile(optimizer='adam',
loss='binary_crossentropy',
metrics=['accuracy'])

model.summary()

# Step 4: Train the Model
history = model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=100, batch_size=32)

# Step 5: Evaluate the Model
loss, accuracy = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {accuracy:.2f}")

# Step 6: Save the Model
model.save("heart_disease_model.keras")
print("Model saved successfully as 'heart_disease_model.keras'")

# Step 7: Verify the Scaler
# Load the scaler to ensure it was saved correctly
try:
    with open("scaler.pkl", "rb") as f:  # Use pickle to load the scaler
        loaded_scaler = pickle.load(f)
    print("Scaler loaded successfully!")
    print("Type of loaded scaler:", type(loaded_scaler))
    print("Does the scaler have 'transform' method?", hasattr(loaded_scaler, 'transform'))
except Exception as e:
    print("Error loading scaler:", str(e))