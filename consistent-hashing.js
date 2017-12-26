class ConsistentHashing extends Ring {
	constructor(rootSvgElement) {
		super(rootSvgElement);
		this.angleScale = d3.scaleLinear()
			.domain([0, (2 ** 32) - 1])
			.range([0, this.tau]);
	}

	addServer(key, label) {
		this.serverData.push({
			id: murmurHash3.x86.hash32("" + key),
			label: label
		});

		this._triggerRedistribution();
	}

	removeServer(key) {
		this.serverData = this.serverData.filter(e => e.id !== murmurHash3.x86.hash32("" + key));
		this._triggerRedistribution();
	}

	addData(key, label) {
		var hashValue = murmurHash3.x86.hash32("" + key);
		this.data.push({
			id: hashValue,
			startAngle: this.angleScale(hashValue),
			endAngle: this.angleScale(hashValue),
			key: key,
			label: label
		});
		this._triggerRedistribution();
	}

	removeData(key) {
		this.data = this.data.filter(e => e.id !== murmurHash3.x86.hash32("" + key));
		this._triggerRedistribution();
	}

	_triggerRedistribution() {

		this.serverData.sort((a, b) => {
			return a.id - b.id;
		});

		this.serverData.forEach((currentServer, index) => {
			var nextServer = this.serverData[(index + 1) % this.serverData.length];

			currentServer.startAngle = this.angleScale(currentServer.id) - 0.01;
			currentServer.endAngle = this.angleScale(nextServer.id) - 0.03;
			currentServer.color = this.colors[index % this.colors.length];

			if (currentServer.startAngle > currentServer.endAngle)
				currentServer.endAngle += this.tau;
		});

	}

}