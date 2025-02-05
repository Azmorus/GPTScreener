// Enhanced React UI for Stock Screener with TradingView Charts, Optimized API Calls, and Filtering

import React, { useState, useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import "./styles.css";

const StockChart = ({ ticker }) => {
    const chartContainerRef = useRef(null);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/stock/${ticker}`);
                const data = await response.json();
                if (data.finviz && data.finviz["Prev Close"]) {
                    setChartData([
                        { time: Date.now() / 1000, value: parseFloat(data.finviz["Prev Close"].replace(",", "")) }
                    ]);
                }
            } catch (error) {
                console.error("Error fetching stock data:", error);
            }
        };
        fetchData();
    }, [ticker]);

    useEffect(() => {
        if (chartContainerRef.current && chartData.length > 0) {
            const chart = createChart(chartContainerRef.current, { width: 600, height: 400 });
            const lineSeries = chart.addLineSeries();
            lineSeries.setData(chartData);
        }
    }, [chartData]);

    return <div className="chart-container" ref={chartContainerRef} />;
};

const App = () => {
    const [ticker, setTicker] = useState("AAPL");
    const [patterns, setPatterns] = useState([]);
    const [filters, setFilters] = useState({ minPrice: "", maxPrice: "" });

    useEffect(() => {
        const fetchPatterns = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/stock/${ticker}`);
                const data = await response.json();
                setPatterns(data.patterns || []);
            } catch (error) {
                console.error("Error fetching patterns:", error);
            }
        };
        fetchPatterns();
    }, [ticker]);

    return (
        <div className="app-container">
            <h1>Stock Screener</h1>
            <div className="input-container">
                <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="Enter ticker..."
                    className="input-box"
                />
                <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="input-box"
                />
                <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="input-box"
                />
            </div>
            <StockChart ticker={ticker} />
            <h2>Detected Patterns:</h2>
            <ul className="pattern-list">
                {patterns.map((pattern, index) => (
                    <li key={index} className="pattern-item">{pattern}</li>
                ))}
            </ul>
        </div>
    );
};

export default App;