class DummyDistribution extends Ring {
	constructor(rootSvgElement) {
		super(rootSvgElement);
		this.serverId = 0;
		this.dataId = 0;
	}

	setServerData(data) {
		this.serverData = data;
	}

	setData(data) {
		this.data = data;
	}

}