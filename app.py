import requests
import json
import prettytable
from flask import Flask, render_template, request, jsonify
import pandas as pd

app = Flask(__name__)
API_KEY = '07a02014ee324d28806596c2487ce37f'

def get_series_ids(series, seasonallyAdjusted):
    prefix = "CUSR0000" if seasonallyAdjusted else "CUUR0000"
    ids = []
    df = pd.read_csv("cu.tsv", sep='\t')
    lookup = dict(zip(df["item_name"], df["item_code"]))
    for i in series:
        ids.append(prefix + lookup[i])
    return ids

def request_data(startyear, endyear, series, seasonallyAdjusted):
    # Define headers and data payload
    headers = {'Content-type': 'application/json'}
    data = json.dumps({

        "seriesid": get_series_ids(series, seasonallyAdjusted),  # Full series ID
        "startyear": str(startyear),
        "endyear": str(endyear),
        "registrationkey": API_KEY
    })
    # Send POST request to BLS API
    response = requests.post('https://api.bls.gov/publicAPI/v2/timeseries/data/', data=data, headers=headers)

    # Check if the request was successful
    if response.status_code == 200:
        json_data = response.json()
        makeprettytable(json_data)
        return json_data['Results']['series']
    else:
        print(f"Failed to retrieve data: HTTP {response.status_code}")
        return None


def makeprettytable(json_data):
    if json_data.get('status') == 'REQUEST_SUCCEEDED':
        # Extract and display data in a table
        output = open('output.txt','w')
        for series in json_data['Results']['series']:
            data_points = series['data']
            table = prettytable.PrettyTable()
            table.field_names = ["Year", "Period", "Value"]
            for point in data_points:
                table.add_row([point['year'], point['periodName'], point['value']])
            output.write(series["seriesID"] + "\n")
            output.write(table.get_string() + "\n\n")
        output.close()
    else:
        print("Request failed:", json_data.get('message', 'No message provided'))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chart')
def chart():
    return render_template('chart.html')

@app.route('/fetch_data', methods = (['POST']))
def fetch_data():
    payload = request.get_json()
    series = payload.get("series", [])
    seasonallyAdjusted = payload.get("seasonallyAdjusted")
    print('-------------------------------------')
    print("Seasonal Adjusted?:", seasonallyAdjusted)
    if not series:
        return jsonify({"error": "no series IDs provided"}), 400
    print(series)
    data = request_data(2024, 2025, series, seasonallyAdjusted)
    return data

if __name__ == "__main__":
    app.run(debug=True)