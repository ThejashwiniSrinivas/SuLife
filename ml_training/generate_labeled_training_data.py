import pandas as pd
import json

# Load donors data
donors = pd.read_csv("donors.csv")

# Load organ requests with matched donors from JSON
with open("organ_requests.json", "r") as f:
    organ_requests = json.load(f)

def blood_match(b1, b2):
    return int(str(b1).strip().upper() == str(b2).strip().upper())

def urgency_map(u):
    mapping = {"high": 3, "medium": 2, "low": 1}
    return mapping.get(str(u).strip().lower(), 0)

def city_match(c1, c2):
    return int(str(c1).strip().lower() == str(c2).strip().lower())

rows = []

for request in organ_requests:
    matched_donor_ids = set(request.get("matchedDonors", []))
    for _, donor in donors.iterrows():
        living_organs = str(donor.get("livingOrgans", "")).split(";") if pd.notna(donor.get("livingOrgans")) else []
        organs_lower = [o.strip().lower() for o in living_organs]
        
        donor_id = donor["donorId"]
        label = 1 if donor_id in matched_donor_ids else 0
        
        row = {
            "donorId": donor_id,
            "patientId": request["patientId"],
            "bloodMatch": blood_match(request["bloodGroup"], donor["bloodGroup"]),
            "organMatch": int(request["organNeeded"].strip().lower() in organs_lower),
            "ageDiff": abs(request["patientAge"] - int(donor["age"])),
            "urgency": urgency_map(request["urgency"]),
            "cityMatch": city_match(request["city"], donor["city"]),
            "consent": int(donor.get("consent", False) is True or donor.get("consent", "").lower() == "true"),
            "label": label
        }
        rows.append(row)

df = pd.DataFrame(rows)
df.to_csv("labeled_training_dataset.csv", index=False)
print("Labeled training dataset saved as labeled_training_dataset.csv")
