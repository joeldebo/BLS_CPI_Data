function generate_table(data, series_names) {
    const tbody = document.querySelector("#cpi-table tbody");
    tbody.innerHTML = '';
    const categories = data.Results.series
    categories.forEach((series, i) => {
        const title = document.createElement("tr");
            title.innerHTML = `
                <td></td>
                <td>${series_names[i]}</td>
                <td></td>
            `; 
        tbody.appendChild(title);
        series.data.forEach(point => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${point.year}</td>
                <td>${point.periodName}</td>
                <td>${point.value}</td>
            `; 
            tbody.appendChild(row);
        });
        const gap = document.createElement("tr");
            gap.innerHTML = `
                <td>-----------</td>
                <td>---------------------</td>
                <td>-----------</td>
            `; 
        tbody.appendChild(gap);
    });
}

document.getElementById("fetch-data-button").addEventListener("click", () => {
  const input = document.getElementById("series-input").value.trim();
  console.log(input)
  if (!input) return alert("Enter a series ID!");
  const series = input.split(",").map(s => s.trim());
  
  fetch("/fetch_data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ series: series })
  })
    .then(response => response.json())
    .then(data => {
      generate_table(data, series)
    })
    .catch(err => {
        console.error(err)
        alert("Series Invalid, please make sure names are valid and separated by commas")
    });
});
