import os
import sys
from dotenv import load_dotenv

def main():
    print("=== DOCKER ENV DIAGNOSTIC ===")
    print(f"CWD: {os.getcwd()}")
    
    print("\nFiles in CWD:")
    try:
        files = os.listdir(".")
        for f in files:
            print(f" - {f}")
    except Exception as e:
        print(f"Error listing files: {e}")
        
    print("\nLoading dotenv...")
    load_dotenv()
    
    api_key = os.getenv("YANDEX_API_KEY")
    print("\n--- ENVIRONMENT VARIABLES ---")
    print(f"YANDEX_API_KEY loaded: {'YES' if api_key else 'NO'}")
    if api_key:
        print(f"Length: {len(api_key)}")
        
if __name__ == "__main__":
    main()
