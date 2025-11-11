import pandas as pd
import numpy as np

# Load donor data
donors = pd.read_csv("donors.csv")  # make sure this path is correct

# Example recipient/request data - create your own or export from DB
recipients = pd.DataFrame([
    {"patientId": "PTR-1001", "patientAge": 35, "bloodGroup": "A+", "organNeeded": "Partial Liver", "urgency": "High", "city": "Bengaluru"},
    {"patientId": "PTR-1002", "patientAge": 60, "bloodGroup": "B-", "organNeeded": "Kidney", "urgency": "Medium", "city": "Chennai"},
    # Add more rows here or load from CSV/DB export
])

def blood_match(b1, b2):
    return int(str(b1).strip().upper() == str(b2).strip().upper())

def urgency_map(u):
    mapping = {"high": 3, "medium": 2, "low": 1}
    return mapping.get(str(u).strip().lower(), 0)

def city_match(c1, c2):
    return int(str(c1).strip().lower() == str(c2).strip().lower())

rows = []
for _, rec in recipients.iterrows():
    for _, donor in donors.iterrows():
        living_organs = str(donor.get("livingOrgans", "")).split(";") if pd.notna(donor.get("livingOrgans")) else []
        organs_lower = [o.strip().lower() for o in living_organs]

        row = {
            "donorId": donor["donorId"],
            "patientId": rec["patientId"],
            "bloodMatch": blood_match(rec["bloodGroup"], donor["bloodGroup"]),
            "organMatch": int(rec["organNeeded"].strip().lower() in organs_lower),
            "ageDiff": abs(rec["patientAge"] - int(donor["age"])),
            "urgency": urgency_map(rec["urgency"]),
            "cityMatch": city_match(rec["city"], donor["city"]),
            "consent": int(donor.get("consent", False) is True or donor.get("consent", "").lower() == "true"),
            # Label can be added later if known (For now just use 0)
            "label": 0  
        }
        rows.append(row)

df = pd.DataFrame(rows)
df.to_csv("training_dataset.csv", index=False)
print("Training dataset saved as training_dataset.csv")
