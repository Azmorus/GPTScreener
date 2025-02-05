# FastAPI Backend for Stock Screener with Finviz API & Scraping

from fastapi import FastAPI, HTTPException
import requests
from bs4 import BeautifulSoup
import numpy as np
import talib
import uvicorn
from finvizfinance.quote import finvizfinance

app = FastAPI()

def get_finviz_data(ticker):
    try:
        stock = finvizfinance(ticker)
        data = stock.ticker_fundament()
        if not data:
            print(f"No data found for {ticker} in Finviz API")
            return None
        return data
    except Exception as e:
        print(f"Error fetching Finviz data: {e}")
        return None

def scrape_stock_data(ticker):
    url = f"https://finviz.com/quote.ashx?t={ticker}"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to scrape Finviz for {ticker}, status code: {response.status_code}")
        return None
    
    soup = BeautifulSoup(response.text, "html.parser")
    try:
        tables = soup.find_all("table")
        if len(tables) < 9:
            print(f"Unexpected table structure for {ticker}")
            return None
        table = tables[8]
        data = {row.find_all("td")[0].text.strip(): row.find_all("td")[1].text.strip() for row in table.find_all("tr") if len(row.find_all("td")) > 1}
        return data
    except Exception as e:
        print(f"Error parsing Finviz page for {ticker}: {e}")
        return None

def detect_patterns(close_prices):
    if len(close_prices) < 50:
        return "Not enough data"
    
    patterns = []
    
    # Detect Cup and Handle with more historical context
    trendline = talib.HT_TRENDLINE(close_prices)
    if trendline[-1] > close_prices[-1] * 1.05 and trendline[-10] < close_prices[-1] * 0.95:
        patterns.append("Cup and Handle")
    
    # Detect Bull Flag (added volume consideration)
    recent_trend = close_prices[-20:]
    if np.max(recent_trend) < close_prices[-1] * 1.05 and np.min(recent_trend) > close_prices[-1] * 0.95:
        patterns.append("Bull Flag")
    
    return patterns if patterns else "No patterns detected"

@app.get("/stock/{ticker}")
async def get_stock_data(ticker: str):
    data = get_finviz_data(ticker)
    if not data:
        data = scrape_stock_data(ticker)
    if not data:
        raise HTTPException(status_code=404, detail="Stock data not found")
    
    try:
        close_prices = [float(v.replace(',', '')) for k, v in data.items() if k in ["Prev Close", "Price"]]
        patterns = detect_patterns(close_prices) if close_prices else "No data"
    except Exception as e:
        print(f"Error processing close prices for {ticker}: {e}")
        patterns = "Error detecting patterns"
    
    return {"finviz": data, "patterns": patterns}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
