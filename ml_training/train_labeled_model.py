import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(BASE_DIR, "labeled_training_dataset.csv")
# Load labeled training data
df = pd.read_csv("labeled_training_dataset.csv")

# Features and target label
X = df.drop(columns=["label", "donorId", "patientId"])
y = df["label"]

# Split into train and test data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Predict on test set
y_pred = model.predict(X_test)

# Evaluate
acc = accuracy_score(y_test, y_pred)
print(f"Model accuracy: {acc:.2f}")

print("\nClassification Report:\n", classification_report(y_test, y_pred))

# Save the trained model
joblib.dump(model, "donor_recipient_match_model.pkl")
print("Trained model saved as donor_recipient_match_model.pkl")
