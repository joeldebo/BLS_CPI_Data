document.getElementById('fetch-data-button').addEventListener('click', () => {
	generateTable2();
});

document.getElementById('seasonal-toggle').addEventListener('change', () => {
	generateTable2();
});

let table;

async function generateTable2() {
	const series_names = await getSeriesNames();
	const data = await fetchData();

	let myData = data.map((d, i) => ({
		category: series_names[i],
		cpi: d.data[0].value,
		mm: ((d.data[0].value - d.data[1].value) / d.data[1].value) * 100,
		yy: ((d.data[0].value - d.data[12].value) / d.data[12].value) * 100,
	}));

	// define columns
	const tableColumns = [
		{ title: 'Category', field: 'category', sorter: 'string' },
		{ title: 'Latest CPI', field: 'cpi', sorter: 'number' },
		{
			title: 'm/m',
			field: 'mm',
			sorter: 'number',
			formatter: function (cell) {
				const val = cell.getValue();
				return val.toFixed(2) + '%';
			},
		},
		{
			title: 'y/y',
			field: 'yy',
			sorter: 'number',
			formatter: function (cell) {
				const val = cell.getValue();
				return val.toFixed(2) + '%';
			},
		},
	];

	// create Tabulator table
	table = new Tabulator('#cpi-table', {
		data: myData, // data array
		columns: tableColumns, // columns array
		layout: 'fitColumns', // fit columns to width
		pagination: 'local', // optional: local pagination
		paginationSize: 10,
		movableColumns: true, // allow user to reorder columns
		resizableRows: true, // allow resizing rows
	});
}
