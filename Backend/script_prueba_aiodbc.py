import msal

client_id = "6dd5397e-a766-45fb-8660-fd8cca11620e"
client_secret = "Ty78Q~dPYKErzHDRH2mW20oUuVcBmuEQJwnvmbve"
tenant_id = "0aec9c1f-0c7a-4bc9-a892-55cdb8406d83"

authority = f"https://login.microsoftonline.com/{tenant_id}"
app = msal.ConfidentialClientApplication(
    client_id,
    authority=authority,
    client_credential=client_secret
)
scope = ["https://database.windows.net/.default"]
result = app.acquire_token_for_client(scopes=scope)

if "access_token" in result:
    print("Nuevo token:", result["access_token"])
else:
    print("Error:", result.get("error_description"))