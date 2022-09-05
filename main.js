// -*- coding: utf-8-unix -*-

function renderChart(data) {

    // Remove excess hour at the end of data.
    if (data.length > 24 && data[data.length-1].hour == "00:00")
        data.pop();

    let priceMax = 0;
    for (let i = 0; i < data.length; i++)
        priceMax = Math.max(priceMax, data[i].price_with_vat);
    priceMax *= 1.05;

    const chart = document.getElementById("chart");

    for (let i = 0; i < data.length; i++) {
        const width = Math.round(data[i].price_with_vat / priceMax * 100);

        // Bar
        let div = document.createElement("div");
        div.style["background-image"] = `linear-gradient(to right, #93c5fd 0 ${width}%, transparent ${width}% 100%)`;
        div.style["height"] = "42px";
        chart.appendChild(div);

        // Time label
        div = document.createElement("div");
        div.style["height"] = "0";
        div.style["line-height"] = "42px";
        div.style["padding"] = "0 9px";
        div.style["position"] = "relative";
        div.style["text-align"] = "left";
        div.style["top"] = "-42px";
        div.style["z"] = 1000;
        div.innerHTML = data[i].time;
        chart.appendChild(div);

        // Price label
        div = document.createElement("div");
        div.style["height"] = "0";
        div.style["line-height"] = "42px";
        div.style["padding"] = "0 9px";
        div.style["position"] = "relative";
        div.style["text-align"] = "right";
        div.style["top"] = "-42px";
        div.style["z"] = 1000;
        div.innerHTML = `${data[i].price_with_vat.toFixed(0)}`;
        chart.appendChild(div);

    }

}

(function() {
    fetch("prices.json?v=dev")
        .then(response => response.json())
        .then(data => renderChart(data));
})();
