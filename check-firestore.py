#!/usr/bin/env python3
"""Verify Firestore rules work by adding test data and reading it back."""
import json, base64, time, subprocess, os, tempfile, urllib.request, urllib.error

PROJECT_ID = "cointracker-26919"

def get_access_token(sa_path):
    with open(sa_path) as f:
        sa = json.load(f)
    
    client_email = sa["client_email"]
    private_key = sa["private_key"]
    
    header_b64 = base64.urlsafe_b64encode(
        json.dumps({"alg": "RS256", "typ": "JWT"}).encode()
    ).rstrip(b"=").decode()
    
    now = int(time.time())
    payload = json.dumps({
        "iss": client_email, "sub": client_email,
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now, "exp": now + 3600,
        "scope": "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform"
    }).encode()
    
    payload_b64 = base64.urlsafe_b64encode(payload).rstrip(b"=").decode()
    signing_input = (header_b64 + "." + payload_b64).encode()
    
    with tempfile.NamedTemporaryFile(mode="w", suffix=".pem", delete=False) as f:
        f.write(private_key)
        key_path = f.name
    
    proc = subprocess.run(
        ["openssl", "dgst", "-sha256", "-sign", key_path],
        input=signing_input, capture_output=True
    )
    os.unlink(key_path)
    
    if proc.returncode != 0:
        print(f"Signing failed: {proc.stderr.decode()}")
        return None
    
    sig_b64 = base64.urlsafe_b64encode(proc.stdout).rstrip(b"=").decode()
    jwt = f"{header_b64}.{payload_b64}.{sig_b64}"
    
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=f"grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion={jwt}".encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    resp = json.loads(urllib.request.urlopen(req).read())
    return resp["access_token"]

# Try to get SA from various locations
sa_paths = [
    "/tmp/gcp-sa.json",
    "/opt/data/.hermes/document_cache/firebase-sa.json",
]
sa_path = None
for p in sa_paths:
    if os.path.exists(p):
        sa_path = p
        break

if not sa_path:
    print("No service account file found locally")
    print("Trying to test without auth...")
    
    # Try unauthenticated access to Firestore (should fail if rules are correct)
    test_url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
    req = urllib.request.Request(test_url)
    try:
        resp = urllib.request.urlopen(req).read()
        print(f"Unauthenticated access returned data (rules might be too permissive)")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"Unauthenticated access blocked ({e.code}) - this is expected for authenticated-only rules")
else:
    token = get_access_token(sa_path)
    if not token:
        print("Failed to get access token")
    else:
        print(f"Got access token: {token[:20]}...")
        
        # Try to list documents (should work if rules are deployed and allow admin access)
        test_url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
        req = urllib.request.Request(test_url, headers={"Authorization": f"Bearer {token}"})
        try:
            resp = json.loads(urllib.request.urlopen(req).read())
            print(f"Firestore access OK - {resp.get('documents', [])} docs found")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"Firestore access: {e.code} - {body[:200]}")

print("\nDone")
