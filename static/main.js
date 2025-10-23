document.getElementById('fetch-data-button').addEventListener('click', () => {
	const input = document.getElementById('series-input').value.trim();
	if (!input) return alert('Enter a series ID!');
	const series = input.split(',').map((s) => s.trim());

	fetch('/fetch_data', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ series: series }),
	})
		.then((response) => response.json())
		.then((data) => {
			generate_table(data, series);
			drawChart(data);
		})
		.catch((err) => {
			console.error(err);
			alert(
				'Series Invalid, please make sure names are valid and separated by commas'
			);
		});
});

function generate_table(data, series_names) {
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

async function drawChart(input_data) {
	const svg = d3.select('#bar-chart');
	if (svg == null) {
		return;
	}
	//clear screen
	svg.selectAll('*').remove();
	//percent option
	metric = 'relative';
	formatted_data = input_data.map((d) => ({
		State: d.seriesID,
		2019: d.data[0].value,
		2010: d.data[12].value,
	}));

	const data = d3
		.sort(formatted_data, (d) => d[2010] - d[2019])
		.map((d) => ({
			...d,
			value:
				metric === 'absolute'
					? d[2019] - d[2010]
					: (d[2019] - d[2010]) / d[2010],
		}));

	// Specify the chart’s dimensions.
	const barHeight = 25;
	const marginTop = 30;
	const marginRight = 60;
	const marginBottom = 10;
	const marginLeft = 60;
	const height =
		Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;
	const width = 900;

	// Create the positional scales.
	const x = d3
		.scaleLinear()
		.domain([
			Math.min(
				d3.min(data, (d) => d.value),
				-0.05
			),
			Math.max(
				d3.max(data, (d) => d.value),
				0.05
			),
		])
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
		.attr('font-size', 10)
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
				.attr('stroke-opacity', 0.1)
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
}
