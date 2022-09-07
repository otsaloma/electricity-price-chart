// -*- coding: utf-8-unix -*-

function appendBar(chart, width, time, price, title, past) {
    // Bar
    let div = document.createElement("div");
    div.classList.add("bar");
    title && div.classList.add("title");
    past && div.classList.add("past");
    // Use a linear gradient to get a full width bar and top border between days.
    div.style.backgroundImage = `linear-gradient(to right, var(--color-bar) 0 ${width}%, transparent ${width}% 100%)`;
    chart.appendChild(div);
    // Time label
    div = document.createElement("div");
    div.classList.add("label", "time");
    title && div.classList.add("title");
    past && div.classList.add("past");
    div.innerHTML = time;
    chart.appendChild(div);
    // Price label
    div = document.createElement("div");
    div.classList.add("label", "price");
    title && div.classList.add("title");
    past && div.classList.add("past");
    div.innerHTML = price;
    chart.appendChild(div);
}

function formatDate(string) {
    const date = new Date(string);
    const weekday = ["su", "ma", "ti", "ke", "to", "pe", "la"][date.getDay()];
    return `${weekday} ${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;
}

function formatPrice(number) {
    return number.toFixed(0);
}

function renderChart(data) {
    const now = Date.now();
    const chart = document.getElementById("chart");
    const priceMax = 1.05 * Math.max(...data.map(x => x.price_with_vat));
    for (const item of data) {
        // Append hourly bars to chart along with time and price labels.
        const width = Math.round(item.price_with_vat / priceMax * 100);
        const past  = (Date.parse(item.datetime.replace(" ", "T")) + 3600*1000) < now;
        const title = item.time === "00:00";
        const time  = title ? `${formatDate(item.date)}` : item.time;
        const price = title ? `${formatPrice(item.price_with_vat)} snt/kWh` : formatPrice(item.price_with_vat);
        appendBar(chart, width, time, price, title, past);
    }
}

(function() {
    fetch("prices.json")
        .then(response => response.json())
        .then(data => renderChart(data));

})();
