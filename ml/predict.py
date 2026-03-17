import sys
import joblib
import os

# Resolve paths relative to this script's location — works on any machine
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, 'offensive_language_model.pkl'))
vectorizer = joblib.load(os.path.join(BASE_DIR, 'vectorizer.pkl'))

# Get the input message
message = sys.argv[1]

# Transform the message
X = vectorizer.transform([message])

# Predict the probabilities
probabilities = model.predict_proba(X)[0]
offensive_prob = probabilities[1]  # Probability of being offensive

# Set a custom threshold (e.g., 0.7 instead of 0.5)
THRESHOLD = 0.8
prediction = 1 if offensive_prob >= THRESHOLD else 0

# # Log the details
# print(f"Message: {message}")
# print(f"Offensive Probability: {offensive_prob}")
# print(f"Threshold: {THRESHOLD}")
# print(f"Prediction: {prediction}")

# Output the result
print(prediction)