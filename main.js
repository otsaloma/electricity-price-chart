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

function formatDate(date) {
    const weekday = ["su", "ma", "ti", "ke", "to", "pe", "la"][date.getDay()];
    return `${weekday} ${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;
}

function getReferenceData(data) {
    // Daytime hours of the first seven days of data.
    return data.slice(0, 7 * 24).filter(x => {
        const hour = x.datetime.getHours();
        return hour >= 7 && hour < 23;
    });
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
    for (const item of data)
        item.datetime = new Date(item.datetime.replace(" ", "T"));
    const now = new Date(),
          today = new Date(now).setHours(0, 0, 0, 0),
          chart = document.getElementById("chart"),
          ref = getReferenceData(data),
          refPrices = ref.map(x => x.price_with_vat),
          priceMax = 1.05 * Math.max(...data.map(x => x.price_with_vat)),
          priceQ33 = quantile(refPrices, 0.33),
          priceQ67 = quantile(refPrices, 0.67),
          q33 = (priceQ33 / priceMax * 100).toFixed(1),
          q67 = (priceQ67 / priceMax * 100).toFixed(1);

    let prevDate = null;
    for (const item of data) {
        const width = (Math.max(0, item.price_with_vat) / priceMax * 100).toFixed(1),
              title = item.date !== prevDate,
              time = title ? formatDate(item.datetime) : item.time,
              price = item.price_with_vat.toFixed(1).replace(".", ","),
              pastDay = item.datetime < today,
              // Add one hour to get the endpoint of the range.
              pastHour = item.datetime.getTime() + 3600 * 1000 < now;

        appendBar(chart, width, q33, q67, time, price, title, pastDay, pastHour);
        prevDate = item.date;
    }
    for (const p of document.getElementsByClassName("tick q33")) {
        const label = priceQ33.toPrecision(2).replace(".", ",");
        const shift = (0.25 * label.length).toFixed(2);
        p.innerHTML = label;
        p.style.paddingLeft = `calc(${q33}% - ${shift}em)`;
    }
    for (const p of document.getElementsByClassName("tick q67")) {
        const label = priceQ67.toPrecision(2).replace(".", ",");
        const shift = (0.25 * label.length).toFixed(2);
        p.innerHTML = `${label} snt/kWh`;
        p.style.paddingLeft = `calc(${q67}% - ${shift}em)`;
    }
}

(function() {

    fetch("prices.json")
        .then(response => response.json())
        .then(data => renderChart(data));

    document.querySelector("#toggle-history-button")
        .addEventListener("click", () =>
            document.querySelectorAll(".past-day")
                .forEach(x => x.classList.toggle("hidden")));

})();
