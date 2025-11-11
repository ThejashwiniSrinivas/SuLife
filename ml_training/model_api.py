from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load your trained model once when the API starts
model = joblib.load("donor_match_model.pkl")  # Ensure this matches your saved model filename

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        input_df = pd.DataFrame([data])
        
        proba = model.predict_proba(input_df)
        print("predict_proba output:", proba, "shape:", proba.shape)
        
        if proba.shape[1] == 2:
            probability = proba[0][1]
        else:
            # If only one class is present, fallback to probability 1 for that class
            probability = proba[0][0]
        
        prediction = int(probability > 0.5)
        
        return jsonify({"prediction": prediction, "probability": probability})
    except Exception as e:
        return jsonify({"error": str(e)}), 400




if __name__ == "__main__":
    app.run(port=5001)
