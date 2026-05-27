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

    # Step 2: Create release using firebase-tools with gcloud auth
    # firebase-tools uses Application Default Credentials when available
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SA_PATH
    
    # Try firebase-tools deploy - the API check warning is non-fatal
    result = run_cmd(["npx", "firebase-tools", "deploy", "--only", "firestore:rules",
                     "--project", PROJECT_ID, "--non-interactive", "--json"],
                    timeout=60)
    print(f"firebase deploy stdout:\n{result.stdout[:2000]}")
    print(f"firebase deploy stderr:\n{result.stderr[:1000]}")
    
    if result.returncode == 0:
        try:
            output = json.loads(result.stdout)
            if any(r.get("status") == "success" for r in output.get("result", [])
                   if isinstance(r, dict)):
                print("✓ Firestore rules deployed via firebase CLI!")
                return True
        except (json.JSONDecodeError, KeyError, AttributeError):
            pass
    
    # Try Firebase Rules API with explicit firestore release name
    print("Trying releases/firestore instead of releases/cloud.firestore...")
    try:
        body = json.dumps({"rulesetName": ruleset_name}).encode()
        req = urllib.request.Request(
            f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases/firestore",
            data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="PATCH"
        )
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"✓ Created via releases/firestore: {resp.get('name', '?')}")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "json" in body.lower() or "{" in body:
            print(f"releases/firestore PATCH failed: {e.code} - {body[:200]}")
        else:
            print(f"releases/firestore PATCH failed: {e.code} - (HTML response)")
    
    # Try creating the release via v1 API (empty POST, let server pick release name)
    print("Trying v1 POST to /releases...")
    try:
        body = json.dumps({}).encode()
        req = urllib.request.Request(
            f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases",
            data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST"
        )
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"✓ Created via v1 POST: {resp.get('name', '?')}")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"v1 POST failed: {e.code} - {body[:200]}")
    
    # Last resort: try the Firebase Management API
    print("Trying Firebase Management API...")
    try:
        body = json.dumps({
            "ruleset": {"source": {"files": [{"name": "firestore.rules", "content": rules_content}]}},
            "release": {"name": f"projects/{PROJECT_ID}/releases/cloud.firestore", "rulesetName": ruleset_name}
        }).encode()
        req = urllib.request.Request(
            f"https://firebase.googleapis.com/storage/v1beta2/projects/{PROJECT_ID}/releases",
            data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST"
        )
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"✓ Via Firebase Mgmt API: {resp}")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"Firebase Mgmt API failed: {e.code} - {body[:200]}")
    
    return False

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
