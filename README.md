Finnish Electricity Price Chart
===============================

A visualization of Finnish electricity spot prices in two parts: (1) A
lambda function that downloads data from the [ENTSO-E API][] using
[entsoe-py][] to an S3 bucket and (2) a static client-side web app that
renders that data into a custom visualization.

[ENTSO-E API]: https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html
[entsoe-py]: https://github.com/EnergieID/entsoe-py

## Getting Started

Create a `.env` file with the following content.

```bash
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DATAITER_USE_NUMBA=false
ENTSOE_API_KEY=
```

Create a virtual environment and run `./download.py local` to fetch
price data, then use `make run` to launch the web app locally.
