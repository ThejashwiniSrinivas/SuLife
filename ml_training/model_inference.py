import joblib
import pandas as pd

# Load the trained model
model = joblib.load("donor_recipient_match_model.pkl")

def predict_match(input_data):
    """
    input_data: dict or pandas DataFrame containing features:
        bloodMatch, organMatch, ageDiff, urgency, cityMatch, consent
    returns: model prediction(s)
    """
    if isinstance(input_data, dict):
        input_df = pd.DataFrame([input_data])
    else:
        input_df = input_data

    prediction = model.predict(input_df)
    return prediction

# Example usage:
if __name__ == "__main__":
    sample_input = {
        "bloodMatch": 1,
        "organMatch": 0,
        "ageDiff": 10,
        "urgency": 3,
        "cityMatch": 1,
        "consent": 1
    }
    result = predict_match(sample_input)
    print("Prediction:", result)
