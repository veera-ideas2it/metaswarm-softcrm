"""
SoftCRM API smoke-test script.

Usage (from backend directory, with the server running):
    python check_apis.py [base_url]

Default base_url: http://localhost:8000

Exit code 0 if all checks pass, 1 if any fail.
"""
from __future__ import annotations

import sys
import requests

BASE_URL = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:8000"
API = f"{BASE_URL}/api/v1"

ADMIN_EMAIL = "admin@softcrm.io"
ADMIN_PASSWORD = "Admin1234!"

results: list[tuple[str, bool, str]] = []


def check(label: str, ok: bool, detail: str = "") -> None:
    results.append((label, ok, detail))
    status_str = "PASS" if ok else "FAIL"
    suffix = f"  ({detail})" if detail else ""
    print(f"  [{status_str}] {label}{suffix}")


def main() -> int:
    print(f"\nSoftCRM API smoke-test  →  {BASE_URL}\n")

    # ------------------------------------------------------------------
    # Health check (no auth)
    # ------------------------------------------------------------------
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        check("GET /health", r.status_code == 200, f"status={r.status_code}")
    except Exception as exc:
        check("GET /health", False, str(exc))
        print("\nServer unreachable — aborting.")
        return 1

    # ------------------------------------------------------------------
    # Login
    # ------------------------------------------------------------------
    token: str | None = None
    try:
        r = requests.post(
            f"{API}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=5,
        )
        ok = r.status_code == 200 and "access_token" in r.json()
        check("POST /auth/login", ok, f"status={r.status_code}")
        if ok:
            token = r.json()["access_token"]
    except Exception as exc:
        check("POST /auth/login", False, str(exc))

    if token is None:
        print("\nCannot obtain token — skipping authenticated checks.")
        _print_summary()
        return 1

    headers = {"Authorization": f"Bearer {token}"}

    # ------------------------------------------------------------------
    # Authenticated endpoints
    # ------------------------------------------------------------------
    checks = [
        ("GET /auth/me",              f"{API}/auth/me"),
        ("GET /deals",                f"{API}/deals"),
        ("GET /contacts",             f"{API}/contacts"),
        ("GET /companies",            f"{API}/companies"),
        ("GET /activities",           f"{API}/activities"),
        ("GET /reports/dashboard",    f"{API}/reports/dashboard"),
    ]

    for label, url in checks:
        try:
            r = requests.get(url, headers=headers, timeout=5)
            check(label, r.status_code == 200, f"status={r.status_code}")
        except Exception as exc:
            check(label, False, str(exc))

    return _print_summary()


def _print_summary() -> int:
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    failed = total - passed
    print(f"\n{'='*40}")
    print(f"Results: {passed}/{total} passed", end="")
    if failed:
        print(f"  ({failed} FAILED)")
        print("\nFailed checks:")
        for label, ok, detail in results:
            if not ok:
                print(f"  - {label}: {detail}")
    else:
        print("  — all OK")
    print()
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
