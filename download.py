#!/usr/bin/env python3

import boto3
import dataiter as di
import io
import os
import pandas as pd
import requests
import sys

from entsoe import EntsoePandasClient

def download():
    client = EntsoePandasClient(api_key=os.environ["ENTSOE_API_KEY"])
    now = pd.Timestamp.now("Europe/Helsinki")
    start = (now - pd.Timedelta(7, "d")).floor("d")
    end = (now + pd.Timedelta(1, "d")).floor("d")
    ts = client.query_day_ahead_prices("FI", start=start, end=end)
    data = di.DataFrame(datetime=ts.index.to_pydatetime())
    data.date = data.datetime.map(lambda x: x.date().isoformat())
    data.time = data.datetime.map(lambda x: x.time().isoformat("minutes"))
    data.price = ts.to_numpy() / 10 # EUR/MWh to snt/kWh
    data.price_with_vat = 1.24 * data.price
    return data

def download_bucket():
    data = download()
    text = data.to_json()
    blob = text.encode("utf-8")
    s3 = boto3.client("s3")
    s3.upload_fileobj(
        io.BytesIO(blob),
        "otsaloma.io",
        "sahko/prices.json",
        ExtraArgs={
            "ACL": "public-read",
            "CacheControl": "public, max-age=300"})
    print(f"Wrote {data.nrow} prices to s3://otsaloma.io/sahko/prices.json.")

def download_local():
    data = download()
    data.write_npz("prices.npz")
    data.write_json("prices.json")
    print(f"Wrote {data.nrow} prices to prices.npz.")
    print(f"Wrote {data.nrow} prices to prices.json.")

def lambda_handler(event, context):
    download_bucket()
    requests.get("https://hc-ping.com/4b1d3355-16ac-41a5-8c45-7e322462ffb3", timeout=10)

if __name__ == "__main__" and sys.argv[1:]:
    if sys.argv[1] == "bucket":
        download_bucket()
    if sys.argv[1] == "local":
        download_local()
