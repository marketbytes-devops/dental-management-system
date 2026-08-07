import urllib.request
import json

url = "http://127.0.0.1:8000/lab/orders/clear-all-data"

def run_clear():
    req = urllib.request.Request(url, method="DELETE")
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode("utf-8"))
        print("API Response:", data)
    except Exception as e:
        print("API Error:", e)

if __name__ == "__main__":
    run_clear()
