#!/usr/bin/env python3

import boto3
import dataiter as di
import io
import numpy as np
import os
import pandas as pd
import requests
import sys

from entsoe import EntsoePandasClient

def download():
    client = EntsoePandasClient(api_key=os.environ["ENTSOE_API_KEY"])
    now = pd.Timestamp.now("Europe/Helsinki")
    start = (now - pd.Timedelta(7, "d")).floor("d")
    end = (now + pd.Timedelta(2, "d")).floor("d")
    ts = client.query_day_ahead_prices("FI", start=start, end=end)
    data = di.DataFrame(datetime=ts.index.to_pydatetime())
    data.date = data.datetime.map(lambda x: x.date().isoformat())
    data.time = data.datetime.map(lambda x: x.time().isoformat("minutes"))
    data.price = ts.to_numpy() / 10 # EUR/MWh to snt/kWh
    # VAT 24% -> 25.5% starting September 2024.
    data.vat = np.where(data.date >= "2024-09-01", 0.255, 0.24)
    vat = data.vat * data.price
    vat[data.price < 0] = 0
    data.price_with_vat = data.price + vat
    # Remove excess hour at the end of data.
    if data.time[-1] == "00:00":
        data = data.slice_off([data.nrow - 1])
    data.price = data.price.round(3)
    data.price_with_vat = data.price_with_vat.round(3)
    data.vat = data.vat.round(3)
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
    if url := os.getenv("SUCCESS_PING_URL"):
        requests.get(url, timeout=10)

if __name__ == "__main__" and sys.argv[1:]:
    if sys.argv[1] == "bucket":
        download_bucket()
    if sys.argv[1] == "local":
        download_local()
