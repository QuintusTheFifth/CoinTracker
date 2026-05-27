#!/usr/bin/env python3
"""Deploy Firestore security rules using gcloud CLI."""
import json, subprocess, sys, os

SA_PATH = "/tmp/gcp-sa.json"
PROJECT_ID = "cointracker-26919"

def run_cmd(cmd, **kwargs):
    proc = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    return proc

def main():
    if not os.path.exists(SA_PATH):
        print("No service account file found")
        return False

    # Activate service account
    result = run_cmd(["gcloud", "auth", "activate-service-account", f"--key-file={SA_PATH}"])
    if result.returncode != 0:
        print(f"gcloud auth failed: {result.stderr}")
        return False
    print("✓ gcloud authenticated")

    # Set project
    run_cmd(["gcloud", "config", "set", "project", PROJECT_ID])

    # Try to deploy Firestore rules using gcloud
    # Read the rules file
    with open("firestore.rules") as f:
        rules_content = f.read()

    # Write the rules to a temp file
    with open("/tmp/rules.txt", "w") as f:
        f.write(rules_content)

    # Use gcloud firestore export or the alpha firestore commands
    # gcloud alpha firestore has security rules commands
    result = run_cmd(["gcloud", "--version"])
    print(f"gcloud version: {result.stdout[:200]}")

    # Try the Firebase CLI approach but with the token from gcloud
    result = run_cmd(["gcloud", "auth", "print-access-token"])
    if result.returncode != 0:
        print(f"Failed to get access token: {result.stderr}")
        return False
    
    token = result.stdout.strip()
    print(f"✓ Access token: {token[:20]}...")

    # Read rules file
    with open("firestore.rules") as f:
        rules_content = f.read()

    # Step 1: Create ruleset
    import urllib.request, urllib.error
    ruleset_body = json.dumps({
        "source": {
            "files": [{"name": "firestore.rules", "content": rules_content}]
        }
    }).encode()

    req = urllib.request.Request(
        f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/rulesets",
        data=ruleset_body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    )
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        ruleset_name = resp["name"]
        print(f"✓ Created ruleset: {ruleset_name}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"✗ Ruleset creation failed: {e.code} - {body}")
        return False

    # Step 2: Create release using a different approach
    # Try using the Firestore REST API directly with the fields collection
    # Actually, let's try the Firebase Management API
    
    # Try to deploy using the gcloud firebase CLI
    # First check if firebase CLI is available
    result = run_cmd(["which", "firebase"])
    if result.returncode == 0:
        print("firebase CLI found, trying to deploy...")
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SA_PATH
        result = run_cmd(["npx", "firebase-tools", "deploy", "--only", "firestore:rules",
                         "--project", PROJECT_ID, "--non-interactive"],
                        timeout=30)
        print(f"firebase deploy: {result.stdout[:500]}")
        if result.returncode == 0:
            print("✓ Firestore rules deployed via firebase CLI!")
            return True
    
    # Fallback: try the Firebase Rules API v1beta1
    print("Trying v1beta1 API...")
    try:
        body = json.dumps({"rulesetName": ruleset_name}).encode()
        req = urllib.request.Request(
            f"https://firebaserules.googleapis.com/v1beta1/projects/{PROJECT_ID}/releases/cloud.firestore",
            data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="PATCH"
        )
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"✓ Release via v1beta1: {resp.get('name', '?')}")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"v1beta1 PATCH failed: {e.code} - {body[:200]}")
    
    # Try creating the release via v1 with a field called 'ruleset_name'
    try:
        body = json.dumps({"ruleset_name": ruleset_name}).encode()
        req = urllib.request.Request(
            f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases",
            data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST"
        )
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"✓ Created via v1 snake_case: {resp.get('name', '?')}")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"v1 snake_case POST failed: {e.code} - {body[:200]}")
    
    # Try with a different release name (just "firestore" instead of "cloud.firestore")
    try:
        body = json.dumps({"rulesetName": ruleset_name}).encode()
        req = urllib.request.Request(
            f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases/cloud.firestore",
            data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="PUT"
        )
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"✓ Created via v1 PUT: {resp.get('name', '?')}")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"v1 PUT failed: {e.code} - {body[:200]}")
    
    return False

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
