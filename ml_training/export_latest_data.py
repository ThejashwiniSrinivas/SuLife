from pymongo import MongoClient
import os
from dotenv import load_dotenv
import pandas as pd
import json

# Load environment variables from .env in current folder
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
print("Loaded MONGO_URI:", MONGO_URI)

client = MongoClient(MONGO_URI)
db = client["sulife"]  # Explicit DB name as in Atlas

def export_donors():
    donors_count = db["donors"].count_documents({})
    if donors_count == 0:
        print("No donors found in DB.")
        return

    donors_cursor = db["donors"].find()
    donors = list(donors_cursor)
    print(f"Found {donors_count} donors in DB")
    for d in donors[:3]:  # Print sample first 3 donors
        print(d)
    df = pd.DataFrame(donors)
    df.to_csv("donors.csv", index=False)
    print("Donors exported to donors.csv")

def export_organ_requests():
    requests_count = db["organrequests"].count_documents({})
    if requests_count == 0:
        print("No organ requests found in DB.")
        return

    requests_cursor = db["organrequests"].find()
    requests = list(requests_cursor)
    print(f"Found {requests_count} organ requests in DB")
    for r in requests[:3]:  # Print sample first 3 requests
        print(r)
    with open("organ_requests.json", "w") as f:
        json.dump(requests, f, default=str)
    print("Organ requests exported to organ_requests.json")

if __name__ == "__main__":
    export_donors()
    export_organ_requests()
