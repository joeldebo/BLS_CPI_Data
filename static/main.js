async function fetchData() {
	const series = await getSeriesNames();
	let seasonallyAdjusted = document.getElementById('seasonal-toggle');
	seasonallyAdjusted = seasonallyAdjusted ? seasonallyAdjusted.checked : false;

	try {
		const response = await fetch('/fetch_data', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				series: series,
				seasonallyAdjusted: seasonallyAdjusted,
			}),
		});

		const data = await response.json();
		return data;
	} catch (err) {
		console.error(err);
		alert(
			'Series Invalid, please make sure names are valid and separated by commas'
		);
		return null;
	}
}

document.getElementById('fetch-data-button').addEventListener('click', () => {
	generateTable();
});

async function getSeriesNames() {
	const input = document.getElementById('series-input').value.trim();
	if (!input) return alert('Enter a series ID!');
	return input.split(',').map((s) => s.trim());
}

async function generateTable() {
	const series_names = await getSeriesNames();
	const data = await fetchData();

	const tbody = document.querySelector('#cpi-table tbody');
	if (tbody == null) {
		return;
	}
	tbody.innerHTML = '';
	data.forEach((series, i) => {
		const title = document.createElement('tr');
		title.innerHTML = `
                <td></td>
                <td>${series_names[i]}</td>
                <td></td>
            `;
		tbody.appendChild(title);
		series.data.forEach((point) => {
			const row = document.createElement('tr');
			row.innerHTML = `
                <td>${point.year}</td>
                <td>${point.periodName}</td>
                <td>${point.value}</td>
            `;
			tbody.appendChild(row);
		});
		const gap = document.createElement('tr');
		gap.innerHTML = `
                <td>-----------</td>
                <td>---------------------</td>
                <td>-----------</td>
            `;
		tbody.appendChild(gap);
	});
}
