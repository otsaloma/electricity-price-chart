// -*- coding: utf-8-unix -*-

function appendBar(chart, width, time, price) {
    // Bar
    let div = document.createElement("div");
    div.classList.add("bar");
    div.style.width = `${width}%`;
    chart.appendChild(div);
    // Time label
    div = document.createElement("div");
    div.classList.add("label", "time");
    div.innerHTML = time;
    chart.appendChild(div);
    // Price label
    div = document.createElement("div");
    div.classList.add("label", "price");
    div.innerHTML = price;
    chart.appendChild(div);
}

function renderChart(data) {
    const chart = document.getElementById("chart");
    const priceMax = 1.05 * Math.max(...data.map(x => x.price_with_vat));
    for (const item of data) {
        // Append hourly bars to chart along with time and price labels.
        const width = Math.round(item.price_with_vat / priceMax * 100);
        appendBar(chart, width, item.time, item.price_with_vat.toFixed(0));
    }
}

(function() {
    fetch("prices.json")
        .then(response => response.json())
        .then(data => renderChart(data));

})();
