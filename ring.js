class Ring {
	constructor(rootSvgElement) {
		this.rootSvgElement = rootSvgElement;
		this.tau = 2 * Math.PI;
		this.serverData = [];
		this.data = [];
		this.colors = ["#FB5012", "#17BEBB", "#F3A956", "#BAD80A", "#30360E"];
		this.colors = ["#50514F", "#F25F5C", "#FFE066", "#73ABC2", "#70C1B3"];
		this.width = rootSvgElement.attr("width");
		this.height = rootSvgElement.attr("height");
		this.maxRadius = 0.5 * Math.min(this.width, this.height);

		this.setup();
	}

	setup() {
		this.rootSvgElement.selectAll("*").remove();

		this.rootSvgElement.append("g")
			.attr("transform", "translate(" + (this.width / 2) + ", " + (this.height / 2) + ")")
			.classed("arc", true);

		this.rootSvgElement.append("g")
			.attr("transform", "translate(" + (this.width / 2) + ", " + (this.height / 2) + ")")
			.classed("datalabels", true);
	}

	triggerRedraw() {
		this.updateServer(this.serverData.slice());
		this.updateData(this.data);
	}

	// --------------------------------------------
	// Arc
	// --------------------------------------------
	// More information: http://bl.ocks.org/mbostock/5100636,
	// http://bl.ocks.org/cmdoptesc/6228457,
	// http://bl.ocks.org/dbuezas/9572040
	// --------------------------------------------


	updateServer(data) {
		data = JSON.parse(JSON.stringify(data));

		var arcGenerator = d3.arc()
			.innerRadius(0.575 * this.maxRadius) //115
			.outerRadius(0.725 * this.maxRadius)
		//.padAngle(0.01)
		//.padRadius(100)
		//.cornerRadius(0);

		function keyFunction(d) {
			return d.id;
		}

		// Selection of the arc elements
		var selection = this.rootSvgElement.select('.arc')
			.selectAll('path')
			.data(data, keyFunction)

		// Transition of arc segments
		var arcTween = function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = d;
			return function(t) {
				return arcGenerator(interpolate(t));
			};
		}

		var colors = this.colors;
		// Enter new elements
		selection
			.enter()
			.each(function(d) {
				this._current = d;
			})
			.append('path')
			.style("fill-opacity", 1e-6)
			.style('fill', d => d.color)
			.transition()
			.duration(2000)
			.style("fill-opacity", 1)
			.attrTween("d", arcTween)

		// Remove elements
		selection
			.exit()
			.style("fill-opacity", 1)
			.transition()
			.duration(2000)
			.style("fill-opacity", 1e-6)
			.remove();

		// Update elements
		selection
			.transition()
			.duration(2000)
			.style('fill', d => d.color)
			.attrTween("d", arcTween);
	}

	// --------------------------------------------
	// Labels
	// --------------------------------------------

	updateData(data) {
		var tau = 2 * Math.PI;
		data = JSON.parse(JSON.stringify(data));

		var arcGenerator = d3.arc()
			.innerRadius(0.6 * this.maxRadius)
			.outerRadius(0.7 * this.maxRadius)
		//.padAngle(.02)
		//.padRadius(100)
		//.cornerRadius(4);

		function keyFunction(d) {
			return d.id;
		}

		// Selection of the arc elements
		var selection = this.rootSvgElement.select('.datalabels')
			.selectAll('g')
			.data(data, keyFunction)

		var myTween = function(d) {
			var node = this;
			node._current = node._current || d;
			var interpolate = d3.interpolate(node._current, d);
			node._current = d;

			return function(t) {
				var tmp = interpolate(t);
				var centroid = arcGenerator.centroid(tmp)

				var textNode = d3.select(node).selectAll("text");
				var txtAnn = textAnnotation(tmp, arcGenerator);
				textNode.attr("x", txtAnn.x);
				textNode.attr("y", txtAnn.y);
				textNode.attr("text-anchor", txtAnn.x >= 0 ? "start" : "end");
				textNode.attr("dx", txtAnn.x >= 0 ? 5 : -5);


				var circleNode = d3.select(node).selectAll("circle");
				circleNode.attr("cx", d => centroid[0])
				circleNode.attr("cy", d => centroid[1])

				var pathNode = d3.select(node).selectAll("path");
				pathNode.attr("d", d => annotation(tmp))
			};
		}

		function annotationLineData(d, arc) {
			var centroid = arcGenerator.centroid(d);

			var scale = 1.1 + Math.abs(0.35 * Math.cos(d.startAngle));

			var middle = { x: centroid[0] * scale, y: centroid[1] * scale };
			var end = {
				x: (centroid[0] * scale) + (centroid[0] < 0 ? -1 : 1) * 20,
				y: middle.y
			}

			var lineData = [
				{ x: centroid[0], y: centroid[1] },
				middle, end,
			];

			return lineData;
		}

		function annotation(d, arc) {
			var line = d3.line()
				.x(function(d) { return d.x; })
				.y(function(d) { return d.y; })

			return line(annotationLineData(d, arc));
		}

		function textAnnotation(d, arc) {
			var lineData = annotationLineData(d, arc);
			var centroid = arcGenerator.centroid(d);
			return { x: lineData[2].x, y: lineData[2].y };
		}

		// Enter new elements
		var newGroup = selection
			.enter()
			.append('g')
			.each(function(d) {
				this._current = d;
			});

		newGroup.append('circle')
			.attr("cx", d => arcGenerator.centroid(d)[0])
			.attr("cy", d => arcGenerator.centroid(d)[1])
			.attr("r", 5)
			.style("fill-opacity", 1e-6)
			.transition()
			.duration(2000)
			.style("fill-opacity", 1);

		newGroup.append('path')
			.attr("d", d => annotation(d))
			.style("stroke-opacity", 1e-6)
			.style("stroke", "black")
			.style("stroke-width", 1)
			.style("fill", "none")
			.transition()
			.duration(2000)
			.style("stroke-opacity", 1);

		newGroup.append('text')
			.text(d => d.label)
			.style("fill-opacity", 1e-6)
			.attr("x", d => textAnnotation(d, arcGenerator).x)
			.attr("y", d => textAnnotation(d, arcGenerator).y)
			.attr("text-anchor", d => textAnnotation(d, arcGenerator).x >= 0 ? "start" : "end")
			.attr("alignment-baseline", "middle")
			.attr("dx", d => textAnnotation(d, arcGenerator).x >= 0 ? 5 : -5)
			.classed("textlabel", true)
			.transition()
			.duration(2000)
			.style("fill-opacity", 1);

		// Remove elements
		var removeGroup = selection
			.exit();

		removeGroup.selectAll('circle')
			.style("fill-opacity", 1)
			.transition()
			.duration(2000)
			.style("fill-opacity", 1e-6)
			.remove();

		removeGroup.selectAll('path')
			.style("stroke-opacity", 1)
			.transition()
			.duration(2000)
			.style("stroke-opacity", 1e-6)
			.remove();

		removeGroup.selectAll('text')
			.style("fill-opacity", 1)
			.transition()
			.duration(2000)
			.style("fill-opacity", 1e-6)
			.remove();

		// Update elements
		selection
			.transition()
			.duration(2000)
			.tween("bla", myTween);

	}


}