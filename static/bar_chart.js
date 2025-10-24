document.getElementById('percent-toggle').addEventListener('change', () => {
	drawChart();
});

document.getElementById('seasonal-toggle').addEventListener('change', () => {
	drawChart();
});

document
	.getElementById('fetch-data-button-chart')
	.addEventListener('click', () => {
		drawChart();
	});

async function drawChart(metric = 'absolute') {
	metric = document.getElementById('percent-toggle').checked
		? 'relative'
		: 'absolute';
	const input_data = await fetchData();
	const series_names = await getSeriesNames();

	const svg = d3.select('#bar-chart');
	if (svg == null) {
		return;
	}
	//clear screen
	svg.selectAll('*').remove();

	formatted_data = input_data.map((d, index) => ({
		State: series_names[index],
		latest_month: d.data[0].value,
		last_year: d.data[12].value,
	}));

	const data = formatted_data
		.map((d) => ({
			...d,
			value:
				metric === 'absolute'
					? d.latest_month - d.last_year
					: (d.latest_month - d.last_year) / d.last_year,
		}))
		.sort((a, b) => b.value - a.value);

	// Specify the chart’s dimensions.
	const barHeight = 25;
	const marginTop = 30;
	const marginRight = 60;
	const marginBottom = 10;
	const marginLeft = 60;
	const height =
		Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;
	const width = 900;

	// Create the positional scales
	relativeDomain = [
		Math.min(
			d3.min(data, (d) => d.value),
			-0.05
		),
		Math.max(
			d3.max(data, (d) => d.value),
			0.05
		),
	];
	absoluteDomain = [
		Math.min(
			d3.min(data, (d) => d.value),
			-10
		),
		Math.max(
			d3.max(data, (d) => d.value),
			10
		),
	];
	const x = d3
		.scaleLinear()
		.domain(metric == 'absolute' ? absoluteDomain : relativeDomain)
		.rangeRound([marginLeft, width - marginRight]);

	const y = d3
		.scaleBand()
		.domain(data.map((d) => d.State))
		.rangeRound([marginTop, height - marginBottom])
		.padding(0.1);

	// Create the format function.
	const format = d3.format(metric === 'absolute' ? '+,d' : '+.1%');
	const tickFormat =
		metric === 'absolute' ? d3.format('+.0f') : d3.format('+.0%');

	//svg defined above
	svg
		.attr('preserveAspectRatio', 'xMinYMin meet')
		.attr('viewBox', [0, 0, width, height]) // fixed virtual space
		.attr('width', '90%') // responsive to screen width
		.attr('height', height)
		.style('font', '10px sans-serif');

	// Add a rect for each state.
	svg
		.append('g')
		.selectAll()
		.data(data)
		.join('rect')
		.attr('fill', (d) => d3.schemeRdBu[3][d.value > 0 ? 2 : 0])
		.attr('x', (d) => x(Math.min(d.value, 0)))
		.attr('y', (d) => y(d.State))
		.attr('width', (d) => Math.abs(x(d.value) - x(0)))
		.attr('height', y.bandwidth());

	// Add a text label for each state.
	svg
		.append('g')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 12)
		.selectAll()
		.data(data)
		.join('text')
		.attr('text-anchor', (d) => (d.value < 0 ? 'end' : 'start'))
		.attr('x', (d) => x(d.value) + Math.sign(d.value - 0) * 4)
		.attr('y', (d) => y(d.State) + y.bandwidth() / 2)
		.attr('dy', '0.35em')
		.text((d) => format(d.value));

	// Add the axes and grid lines.
	svg
		.append('g')
		.attr('transform', `translate(0,${marginTop})`)
		.call(
			d3
				.axisTop(x)
				.ticks(width / 80)
				.tickFormat(tickFormat)
		)
		.call((g) =>
			g
				.selectAll('.tick line')
				.clone()
				.attr('y2', height - marginTop - marginBottom)
				.attr('stroke-opacity', 0)
		)
		.call((g) => g.select('.domain').remove());

	svg
		.append('g')
		.attr('transform', `translate(${x(0)},0)`)
		.call(d3.axisLeft(y).tickSize(0).tickPadding(6))
		.call((g) =>
			g
				.selectAll('.tick text')
				.filter((d, i) => data[i].value < 0)
				.attr('text-anchor', 'start')
				.attr('x', 6)
		);
	svg.selectAll('.tick text').style('font-size', '12px');
}

//download chart? chatgpt
document.getElementById('download-chart').addEventListener('click', () => {
	const svgElement = document.getElementById('bar-chart');

	// Serialize the SVG
	const serializer = new XMLSerializer();
	const svgString = serializer.serializeToString(svgElement);

	// Create a Blob and Object URL
	const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	// Create an image to draw on canvas
	const img = new Image();
	img.onload = () => {
		const canvas = document.createElement('canvas');
		canvas.width = svgElement.viewBox.baseVal.width || 900;
		canvas.height = svgElement.viewBox.baseVal.height || 600;
		const ctx = canvas.getContext('2d');

		// ✅ Fill white background before drawing SVG
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw the SVG image
		ctx.drawImage(img, 0, 0);
		URL.revokeObjectURL(url);

		// Create and trigger download
		const a = document.createElement('a');
		a.download = 'chart.png';
		a.href = canvas.toDataURL('image/png');
		a.click();
	};
	img.src = url;
});
