"""
Test script for Azure AD (Entra ID) service-principal authentication
via MSAL, to acquire a database access token.

Reads credentials from environment variables (see .env.example).
Usage:
    python script_prueba_aiodbc.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

client_id = os.getenv("AZURE_CLIENT_ID", "")
client_secret = os.getenv("AZURE_CLIENT_SECRET", "")
tenant_id = os.getenv("AZURE_TENANT_ID", "")

if not all([client_id, client_secret, tenant_id]):
    print("ERROR: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID must be set.")
    print("Copy .env.example to .env and fill in your values.")
    exit(1)

import msal

authority = f"https://login.microsoftonline.com/{tenant_id}"
app = msal.ConfidentialClientApplication(
    client_id,
    authority=authority,
    client_credential=client_secret,
)
scope = ["https://database.windows.net/.default"]
result = app.acquire_token_for_client(scopes=scope)

if "access_token" in result:
    print("Token acquired successfully (truncated):", result["access_token"][:50] + "...")
else:
    print("Error:", result.get("error_description"))
