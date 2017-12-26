class ModuloNDistribution extends Ring {
	constructor(rootSvgElement) {
		super(rootSvgElement);
		this.serverId = 0;
		this.dataId = 0;
	}

	addServer(key, label) {
		this.serverData.push({
			id: this.serverId++,
			key: key,
			label: label
		});

		this._triggerRedistribution();
	}

	removeServer(id) {
		this.serverData = this.serverData.filter(e => e.id !== id);
		this._triggerRedistribution();
	}

	addData(key, label) {
		this.data.push({
			id: this.dataId++,
			key: key,
			label: label
		});
		this._triggerRedistribution();
	}

	removeData(id) {
		this.data = this.data.filter(e => e.id !== id);
		this._triggerRedistribution();
	}

	_triggerRedistribution() {
		//-----------------------------------------
		//Redistribute server slices
		//-----------------------------------------
		this.serverData.sort((a, b) => {
			return a.id - b.id;
		});

		var serverCount = this.serverData.length;
		var sliceSize = this.tau / serverCount;
		var nextSliceStart = 0;
		this.serverData.forEach((el, index) => {
			el.startAngle = nextSliceStart;
			el.endAngle = nextSliceStart + sliceSize;
			nextSliceStart = el.endAngle;

			currentServer.color = this.colors[index % this.colors.length];
		});

		//-----------------------------------------
		//Redistribute data points
		//-----------------------------------------

		//Determine which data point is assigned to each server
		var perServerData = Array(serverCount).fill(0).map(x => []);
		this.data.forEach(el => {
			var responsibleServer = el.id % serverCount;
			perServerData[responsibleServer].push(el);
		});

		//Now distribute the data points in the slice for better visualization
		perServerData.forEach((dataArray, serverIndex) => {
			var dataElementsOnThisServer = dataArray.length;
			var server = this.serverData[serverIndex];

			var angleScale = d3.scaleLinear()
				.domain([-1, dataElementsOnThisServer])
				.range([server.startAngle, server.endAngle]);

			dataArray.forEach((dataElement, dataIndex, dA) => {
				dataElement.startAngle = angleScale(dataIndex);
				dataElement.endAngle = angleScale(dataIndex);
			});
		});
	}

}