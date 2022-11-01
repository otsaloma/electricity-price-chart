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

function getReferenceData(data) {
    // Daytime hours of the first seven days of data.
    return data.slice(0, 7 * 24).filter(x => {
        const hour = new Date(x.datetime.replace(" ", "T")).getHours();
        return hour >= 7 && hour < 23;
    });
}

function isPastDay(date, now) {
    if (date > now) return false;
    if (date.getFullYear() < now.getFullYear()) return true;
    if (date.getMonth() < now.getMonth()) return true;
    if (date.getDate() < now.getDate()) return true;
    return false;
}

function isPastHour(date, now) {
    // Add one hour to get the endpoint of the range.
    return (date.getTime() + 3600*1000) < now.getTime();
}

function nround(x, n) {
    n = n || 0;
    const factor = Math.pow(10, n);
    return Math.round(factor * x) / factor;
}

function quantile(values, q) {
    values.sort((a, b) => a - b);
    const pos = (values.length - 1) * q;
    const i = Math.floor(pos);
    const diff = pos - i;
    return (1 - diff) * values[i] + diff * values[i+1];
}

function renderChart(data) {
    if (data.length === 0) return;
    const now = new Date(),
          chart = document.getElementById("chart"),
          ref = getReferenceData(data),
          refPrices = ref.map(x => x.price_with_vat),
          priceMax = 1.05 * Math.max(...data.map(x => x.price_with_vat)),
          priceQ33 = quantile(refPrices, 0.33),
          priceQ67 = quantile(refPrices, 0.67);

    for (const item of data) {
        const width = nround(Math.max(0, item.price_with_vat) / priceMax * 100, 1),
              q33 = nround(priceQ33 / priceMax * 100, 1),
              q67 = nround(priceQ67 / priceMax * 100, 1),
              title = item.time === "00:00",
              time = title ? `${formatDate(item.date)}` : item.time,
              price = item.price_with_vat.toFixed(0);
              datetime = new Date(item.datetime.replace(" ", "T")),
              pastDay = isPastDay(datetime, now),
              pastHour = isPastHour(datetime, now);

        appendBar(chart, width, q33, q67, time, price, title, pastDay, pastHour);
    }
    for (const p of document.getElementsByClassName("tick q33")) {
        const label = priceQ33.toPrecision(2).replace(".", ",");
        const width = nround(priceQ33 / priceMax * 100, 1);
        const shift = (0.25 * label.length).toFixed(2);
        p.innerHTML = `${label}`;
        p.style.paddingLeft = `calc(${width}% - ${shift}em)`;
    }
    for (const p of document.getElementsByClassName("tick q67")) {
        const label = priceQ67.toPrecision(2).replace(".", ",");
        const width = nround(priceQ67 / priceMax * 100, 1);
        const shift = (0.25 * label.length).toFixed(2);
        p.innerHTML = `${label} snt/kWh`;
        p.style.paddingLeft = `calc(${width}% - ${shift}em)`;
    }
}

(function() {

    const today = (new Date()).toISOString().substring(0, 10);
    if (today >= "2022-12-01" && today <= "2023-04-30") {
        // Use reduced VAT December–April.
        // https://vm.fi/hanke?tunnus=VM112:00/2022
        // https://www.hs.fi/politiikka/art-2000009040795.html
        document.querySelector("#vat").innerHTML = "10%";
    }

    fetch("prices.json")
        .then(response => response.json())
        .then(data => renderChart(data));

    document.querySelector("#toggle-history-button")
        .addEventListener("click", event =>
            document.querySelectorAll(".past-day")
                .forEach(x => x.classList.toggle("hidden")));

})();
