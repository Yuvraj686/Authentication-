import os, sys
import certifi
from pymongo import MongoClient

uri = "mongodb+srv://<username>:<password>@cluster0.nigcaew.mongodb.net/?appName=Cluster0"
try:
    client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.server_info()
    print("Success with certifi")
except Exception as e:
    print(f"Error with certifi: {e}")
