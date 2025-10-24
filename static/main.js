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

async function getSeriesNames() {
	const input = document.getElementById('series-input').value.trim();
	if (!input) return alert('Enter a series ID!');
	return input.split(';').map((s) => s.trim());
}
