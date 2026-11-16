import os

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Step 1: Load the dataset. train.csv is not committed (65 MB) — download it from
# https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge/data
# and place it next to this script. Paths resolve relative to the file, so this
# runs on any machine.
TRAIN_CSV = os.path.join(BASE_DIR, 'train.csv')
if not os.path.exists(TRAIN_CSV):
    raise SystemExit(f'Missing {TRAIN_CSV}. See ml/README.md for the download link.')
data = pd.read_csv(TRAIN_CSV)

# Step 2: Preprocess the data
# The dataset has a column 'comment_text' for text and multiple labels (toxic, severe_toxic, etc.)
# We'll use the 'toxic' column for binary classification (1 = toxic, 0 = non-toxic)
data = data[['comment_text', 'toxic']]  # Keep only the relevant columns
data = data.dropna()  # Remove rows with missing values

X = data['comment_text']
y = data['toxic']

# Step 3: Vectorize the text data
vectorizer = TfidfVectorizer(stop_words='english', max_features=10000)
X = vectorizer.fit_transform(X)

# Step 4: Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Step 5: Train the model
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# Step 6: Evaluate the model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f'Model Accuracy: {accuracy * 100:.2f}%')

# Step 7: Save the model and vectorizer next to this script, not the shell's cwd.
joblib.dump(model, os.path.join(BASE_DIR, 'offensive_language_model.pkl'))
joblib.dump(vectorizer, os.path.join(BASE_DIR, 'vectorizer.pkl'))
print('Model and vectorizer saved! Now run: python ml/export_model.py')