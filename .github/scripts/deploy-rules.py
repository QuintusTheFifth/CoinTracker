#!/usr/bin/env python3
"""Deploy Firestore security rules via REST API using a GCP service account JSON key."""
import json, base64, time, subprocess, sys, urllib.request, urllib.error, os

SA_PATH = "/tmp/gcp-sa.json"
RULES_PATH = "firestore.rules"
PROJECT_ID = "cointracker-26919"

def main():
    if not os.path.exists(SA_PATH):
        print("No service account file found")
        return False

    with open(SA_PATH) as f:
        sa = json.load(f)

    client_email = sa["client_email"]
    private_key = sa["private_key"]

    # Build JWT
    header_b64 = base64.urlsafe_b64encode(
        json.dumps({"alg": "RS256", "typ": "JWT"}).encode()
    ).rstrip(b"=").decode()

    now = int(time.time())
    payload = json.dumps({
        "iss": client_email, "sub": client_email,
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now, "exp": now + 3600,
        "scope": "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform"
    }).encode()

    payload_b64 = base64.urlsafe_b64encode(payload).rstrip(b"=").decode()
    signing_input = (header_b64 + "." + payload_b64).encode()

    # Write private key to temp file
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".pem", delete=False) as f:
        f.write(private_key)
        key_path = f.name

    # Sign with openssl: pass signing data via stdin, key via file
    proc = subprocess.run(
        ["openssl", "dgst", "-sha256", "-sign", key_path],
        input=signing_input, capture_output=True
    )
    os.unlink(key_path)
    if proc.returncode != 0:
        print(f"openssl signing failed: {proc.stderr.decode()}")
        return False

    sig_b64 = base64.urlsafe_b64encode(proc.stdout).rstrip(b"=").decode()
    jwt = f"{header_b64}.{payload_b64}.{sig_b64}"

    # Exchange JWT for access token
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=f"grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion={jwt}".encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        access_token = resp["access_token"]
        print(f"Got access token: {access_token[:20]}...")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"Token exchange failed: {e.code} - {body}")
        return False

    # Read rules file
    if not os.path.exists(RULES_PATH):
        print("No firestore.rules file found")
        return False
    with open(RULES_PATH) as f:
        rules_content = f.read()

    rules_content_escaped = json.dumps(rules_content)

    # Create ruleset
    ruleset_body = json.dumps({
        "source": {
            "files": [{"name": "firestore.rules", "content": rules_content}]
        }
    }).encode()

    ruleset_req = urllib.request.Request(
        f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/rulesets",
        data=ruleset_body,
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    )
    try:
        ruleset_resp = json.loads(urllib.request.urlopen(ruleset_req).read())
        ruleset_name = ruleset_resp["name"]
        print(f"Created ruleset: {ruleset_name}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"Ruleset creation failed: {e.code} - {body}")
        return False

    # Try to create the release with POST (first-time deploy)
    create_url = f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases"
    create_body = json.dumps({
        "rulesetName": ruleset_name,
        "name": f"projects/{PROJECT_ID}/releases/cloud.firestore"
    }).encode()
    create_req = urllib.request.Request(
        f"{create_url}?releaseId=cloud.firestore",
        data=create_body,
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        method="POST"
    )
    try:
        create_resp = json.loads(urllib.request.urlopen(create_req).read())
        print(f"Created release: {create_resp.get('name', '?')}")
        print("Firestore rules deployed successfully!")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "already exists" in body.lower() or e.code == 409:
            print("Release already exists, updating with PATCH...")
            # Try PATCH with updateMask
            patch_url = f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases/cloud.firestore?updateMask=rulesetName"
            patch_body = json.dumps({"rulesetName": ruleset_name}).encode()
            patch_req = urllib.request.Request(
                patch_url,
                data=patch_body,
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                method="PATCH"
            )
            try:
                patch_resp = json.loads(urllib.request.urlopen(patch_req).read())
                print(f"Updated release: {patch_resp.get('name', '?')}")
                print("Firestore rules deployed successfully!")
                return True
            except urllib.error.HTTPError as e2:
                body2 = e2.read().decode()
                print(f"Release update failed: {e2.code} - {body2}")
                return False
        else:
            print(f"Release creation failed: {e.code} - {body}")
            return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
