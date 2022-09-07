// -*- coding: utf-8-unix -*-

function addClasses(div, title, pastDay, pastHour) {
    title    && div.classList.add("title");
    pastDay  && div.classList.add("past-day", "hidden");
    pastHour && div.classList.add("past-hour");
}

function appendBar(chart, width, time, price, title, pastDay, pastHour) {
    // Bar
    let div = document.createElement("div");
    div.classList.add("bar");
    addClasses(div, title, pastDay, pastHour);
    div.style.backgroundImage = `linear-gradient(to right, var(--color-bar) 0 ${width}%, transparent ${width}% 100%)`;
    chart.appendChild(div);
    // Time label
    div = document.createElement("div");
    div.classList.add("label", "time");
    addClasses(div, title, pastDay, pastHour);
    div.innerHTML = time;
    chart.appendChild(div);
    // Price label
    div = document.createElement("div");
    div.classList.add("label", "price");
    addClasses(div, title, pastDay, pastHour);
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

function isPastDay(date, now) {
    if (date.getFullYear() < now.getFullYear()) return true;
    if (date.getMonth() < now.getMonth()) return true;
    if (date.getDate() < now.getDate()) return true;
    return false;
}

function isPastHour(date, now) {
    // Add one hour to get the endpoint of the range.
    return (date.getTime() + 3600*1000) < now.getTime();
}

function renderChart(data) {
    const now = new Date();
    const chart = document.getElementById("chart");
    const priceMax = 1.05 * Math.max(...data.map(x => x.price_with_vat));
    for (const item of data) {
        // Append hourly bars to chart along with time and price labels.
        const width = Math.round(item.price_with_vat / priceMax * 100);
        const title = item.time === "00:00";
        const time  = title ? `${formatDate(item.date)}` : item.time;
        const price = title ? `${formatPrice(item.price_with_vat)} snt/kWh` : formatPrice(item.price_with_vat);
        const datetime = new Date(item.datetime.replace(" ", "T"));
        const pastDay  = isPastDay(datetime, now);
        const pastHour = isPastHour(datetime, now);
        appendBar(chart, width, time, price, title, pastDay, pastHour);
    }
}

(function() {
    fetch("prices.json")
        .then(response => response.json())
        .then(data => renderChart(data));

})();
