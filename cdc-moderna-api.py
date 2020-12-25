import requests

result = requests.get('https://data.cdc.gov/resource/b7pe-5nws.json')
print(result.status_code)