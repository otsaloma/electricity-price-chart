// -*- coding: utf-8-unix -*-

function addClasses(div, title, pastDay, pastHour) {
    title    && div.classList.add("title");
    pastDay  && div.classList.add("past-day", "hidden");
    pastHour && div.classList.add("past-hour");
}

function appendBar(chart, width, q33, q67, time, price, title, pastDay, pastHour) {
    // Bar
    let div = document.createElement("div");
    div.classList.add("bar");
    addClasses(div, title, pastDay, pastHour);
    div.style.backgroundImage = `
        linear-gradient(
            to right,
            transparent 0 calc(${q33}% - 1px),
            var(--color-ref) calc(${q33}% - 1px) calc(${q33}% + 1px),
            transparent calc(${q33}% + 1px) calc(${q67}% - 1px),
            var(--color-ref) calc(${q67}% - 1px) calc(${q67}% + 1px),
            transparent calc(${q67}% + 1px) 100%
        ), linear-gradient(
            to right,
            var(--color-bar) 0 ${width}%,
            transparent ${width}% 100%
        )`;
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

function getReferenceData(data) {
    // Daytime hours of the first seven days of data.
    return data.slice(0, 7 * 24).filter(x => {
        const hour = new Date(x.datetime.replace(" ", "T")).getHours();
        return hour >= 7 && hour < 23;
    });
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

function quantile(values, q) {
    values.sort((a, b) => a - b);
    const pos = (values.length - 1) * q;
    const i = Math.floor(pos);
    const diff = pos - i;
    return values[i] * (1 - diff) + values[i+1] * diff;
}

function renderChart(data) {
    if (data.length === 0) return;
    const now = new Date();
    const ref = getReferenceData(data);
    const refPrices = ref.map(x => x.price_with_vat);
    const chart = document.getElementById("chart");
    const priceMax = 1.05 * Math.max(...data.map(x => x.price_with_vat));
    const priceQ33 = quantile(refPrices, 0.33);
    const priceQ67 = quantile(refPrices, 0.67);
    for (const item of data) {
        // Append hourly bars to chart along with time and price labels.
        const width = Math.round(item.price_with_vat / priceMax * 100);
        const q33 = Math.round(priceQ33 / priceMax * 100);
        const q67 = Math.round(priceQ67 / priceMax * 100);
        const title = item.time === "00:00";
        const time = title ? `${formatDate(item.date)}` : item.time;
        const price = formatPrice(item.price_with_vat);
        const datetime = new Date(item.datetime.replace(" ", "T"));
        const pastDay = isPastDay(datetime, now);
        const pastHour = isPastHour(datetime, now);
        appendBar(chart, width, q33, q67, time, price, title, pastDay, pastHour);
    }
    for (const span of document.getElementsByClassName("tick q33")) {
        span.innerHTML = `${formatPrice(priceQ33)}`;
        span.style.paddingLeft = `calc(${(priceQ33 / priceMax * 100).toFixed(1)}% - 0.5em)`;
    }
    for (const span of document.getElementsByClassName("tick q67")) {
        span.innerHTML = `${formatPrice(priceQ67)} snt/kWh`;
        span.style.paddingLeft = `calc(${(priceQ67 / priceMax * 100).toFixed(1)}% - 0.5em)`;
    }
}

(function() {

    fetch("prices.json")
        .then(response => response.json())
        .then(data => renderChart(data));

    document.querySelector("#toggle-history-button")
        .addEventListener("click", event =>
            document.querySelectorAll(".past-day")
                .forEach(x => x.classList.toggle("hidden")));

})();
