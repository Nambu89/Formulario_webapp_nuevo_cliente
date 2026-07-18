"""
Utility to generate a bcrypt password hash.

Usage:
    python generate_hash.py <password>

Or without arguments, it will prompt for a password interactively.
"""

import sys
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        password = sys.argv[1]
    else:
        password = input("Enter password to hash: ")

    password_hash = pwd_context.hash(password)
    print(f"Hash: {password_hash}")
