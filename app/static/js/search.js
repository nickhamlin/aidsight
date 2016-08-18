(function() {
	// Build the table

	var table = jQuery('#search-results table');

	for (var i = 0; i < graph.nodes.length; i++) {
		var nodeHTML = [
			'<tr id="',
			graph.nodes[i].id,
			'" class="node-details">'
		];

		// Machine ID

		nodeHTML.push(
			'<td>',
			graph.nodes[i].url ?
				'<a href="/quality?org=' + graph.nodes[i].id + '">' + graph.nodes[i].id + '</a>' :
				graph.nodes[i].id,
			'</td>'
		);

		// Data Available

		nodeHTML.push(
			'<td>',
			'<strong class="',
			graph.nodes[i].type,
			'">',
			graph.nodes[i].url ? 'available' : 'not available',
			'</strong>',
			'</td>'
		);

		// Names

		nodeHTML.push(
			'</td>',
			'<td>',
			graph.nodes[i].label.split('\n').join('<br>').split('&').join('&amp;'),
			'</td>',
			'</tr>'
		)

		table.append(nodeHTML.join(''))
	}


	// Create the graph

	var container_id = "#search-graph-container";

	var width = jQuery('#search-form').width() - 30;
	var height = jQuery(window).height();
	var radius = 10;

	var charge = d3.forceManyBody();
	charge.strength(-3);

	var simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.id; }))
		.force("charge", charge)
		.force("center", d3.forceCenter(width / 2, height / 2));

	var svg = d3.select(container_id).append("svg");
	var tooltip = jQuery('div.tooltip').css('opacity', 0.0);

	svg.attr("width", width)
		.attr("height", height);

	var link = svg.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(graph.edges)
		.enter().append("line")
		.attr("stroke-width", function(d) { return d.size; });

	var highlight = /[?&]highlight=([^&#]*)/i.exec(window.location.search);
	var highlight_id = highlight ? highlight[1] : undefined;

	var node = svg.append("g")
		.attr("class", "nodes")
		.selectAll("circle")
		.data(graph.nodes)
		.enter().append("circle")
		.attr("r", function(d) { return d.size; })
		.attr("class", function(d) {
			var classes = [d.type];

			if (d.id == highlight_id) {
				classes.push('highlighted');
			}

			return classes.join(' ');
		})
		.on("mouseover", function(d) {
			tooltip.text(d.label).css('opacity', 0.9);

			tooltip
				.css('left', (d3.event.pageX + d.size) + 'px')
				.css('top', (d3.event.pageY - d.size - tooltip.height()) + 'px');
		})
		.on("mouseout", function(d) {
			tooltip.text('').css('opacity', 0.0);
		})
		.on("click", function(d) {
			jQuery('#search-results').addClass('filtered')

			jQuery('.selected').removeClass('selected');
			jQuery('.neighbor').removeClass('neighbor');

			jQuery('#' + d.id).toggleClass('selected');

			var neighbors = graph.neighbors[d.id];

			var filteredCount = 1;

			if (neighbors) {
				filteredCount += neighbors.length;

				for (var i = 0; i < neighbors.length; i++) {
					jQuery('#' + neighbors[i]).toggleClass('neighbor');
				}
			}

			jQuery('#search-results-description').text(
				'(filtered to ' + filteredCount + ' nodes)');

			window.location.hash = '';
			window.location.hash = 'search-results';
		});

	simulation
		.nodes(graph.nodes)
		.on("tick", function() {
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node
				.attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
				.attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
		});

	simulation.force("link")
		.links(graph.edges);
})();
