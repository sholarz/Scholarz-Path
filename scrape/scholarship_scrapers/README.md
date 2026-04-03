# Scholarship Scrapers (Starter)

This is a lightweight starter project for a future scraper connector demo. It is not part of the current production data flow.

## Setup

1) Create a virtual environment and install dependencies:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

2) Create your environment file:

```bash
copy .env.example .env
```

3) Edit `.env` and set `LARAVEL_API_URL` if your API URL is different.

## Run

```bash
python -m src.scrape
```

## Notes

- Source selectors live in `src/sources.py`.
- The webhook schema is intended for future integration and expects `application_deadline`, `level`, and `type`.
- If those fields are missing on a page, the demo connector will skip the item.
- Update selectors and field extraction for accuracy.
