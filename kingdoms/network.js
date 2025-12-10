import { DISASTERS } from './constraints.js';

const kingdoms = JSON.parse(localStorage.getItem("kingdoms") || "{}");

// Back to cards button
document.getElementById("backToCardsBtn").onclick = () => {
  window.location.href = 'index.html';
};

// Initialize and draw network topology
setTimeout(drawNetworkTopology, 100);

// Redraw network when window is resized
window.addEventListener('resize', () => {
  setTimeout(drawNetworkTopology, 100);
});

// Network topology drawing function
function drawNetworkTopology() {
  const canvas = document.getElementById('topologyCanvas');
  const nodesContainer = document.getElementById('topologyNodes');

  if (!canvas || !nodesContainer) return;

  // Clear existing content
  canvas.innerHTML = '';
  nodesContainer.innerHTML = '';

  const containerRect = nodesContainer.getBoundingClientRect();
  canvas.style.width = containerRect.width + 'px';
  canvas.style.height = containerRect.height + 'px';

  const kingdomNames = Object.keys(kingdoms);
  if (kingdomNames.length === 0) {
    // Show message when no kingdoms exist
    const message = document.createElement('div');
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.textAlign = 'center';
    message.style.color = '#666';
    message.style.fontSize = '18px';
    message.innerHTML = '<p>No kingdoms found.</p><p><a href="index.html">Go back to create some kingdoms</a></p>';
    nodesContainer.appendChild(message);
    return;
  }

  // Calculate positions using force-directed layout
  const positions = calculateNodePositions(kingdomNames, containerRect.width, containerRect.height);

  // Draw connections first (so they appear behind nodes)
  drawTopologyConnections(canvas, positions);

  // Calculate node sizes based on land area
  const landAreas = kingdomNames.map(name => kingdoms[name].landArea || 1000);
  const minLandArea = Math.min(...landAreas);
  const maxLandArea = Math.max(...landAreas);
  const minNodeSize = 40; // Minimum node size in pixels
  const maxNodeSize = 120; // Maximum node size in pixels

  // Draw nodes
  kingdomNames.forEach(name => {
    const kingdom = kingdoms[name];
    const pos = positions[name];

    // Calculate node size based on land area
    const landArea = kingdom.landArea || 1000;
    let nodeSize;

    if (maxLandArea === minLandArea) {
      // All kingdoms have the same land area
      nodeSize = (minNodeSize + maxNodeSize) / 2;
    } else {
      // Scale node size proportionally to land area
      const normalizedArea = (landArea - minLandArea) / (maxLandArea - minLandArea);
      nodeSize = minNodeSize + (normalizedArea * (maxNodeSize - minNodeSize));
    }

    const nodeRadius = nodeSize / 2;

    const node = document.createElement('div');
    node.className = 'topology-node';
    node.style.width = nodeSize + 'px';
    node.style.height = nodeSize + 'px';
    node.style.left = (pos.x - nodeRadius) + 'px';
    node.style.top = (pos.y - nodeRadius) + 'px';

    // Determine node state
    const hasDisasters = kingdom.disaster && kingdom.disaster.current && kingdom.disaster.current.length > 0;
    const isAtWar = kingdom.underWar;
    const isProtected = kingdom.disaster && kingdom.disaster.protected;

    if (isProtected) {
      node.classList.add('protected');
    } else if (isAtWar && hasDisasters) {
      node.classList.add('war', 'disaster');
    } else if (isAtWar) {
      node.classList.add('war');
    } else if (hasDisasters) {
      node.classList.add('disaster');
    } else {
      node.classList.add('normal');
    }

    // Node content with scaled font sizes
    const icon = document.createElement('div');
    icon.className = 'topology-node-icon';
    icon.textContent = isProtected ? '🛡️' : isAtWar ? '⚔️' : hasDisasters ? '⚠️' : '🏰';
    // Scale icon size based on node size (base size 24px for 80px node)
    const iconSize = Math.round((nodeSize / 80) * 24);
    icon.style.fontSize = iconSize + 'px';

    const nameLabel = document.createElement('div');
    nameLabel.className = 'topology-node-name';
    nameLabel.textContent = name;
    // Scale text size based on node size (base size 10px for 80px node)
    const textSize = Math.max(8, Math.round((nodeSize / 80) * 10));
    nameLabel.style.fontSize = textSize + 'px';
    nameLabel.style.maxWidth = (nodeSize - 10) + 'px';

    node.appendChild(icon);
    node.appendChild(nameLabel);

    // Click handler
    node.addEventListener('click', () => {
      import('../assets/js/utils/navigation.js').then(({ Navigation }) => {
        Navigation.goToKingdom(name);
      });
    });

    // Hover effects
    node.addEventListener('mouseenter', () => {
      highlightConnections(name, true);
    });

    node.addEventListener('mouseleave', () => {
      highlightConnections(name, false);
    });

    nodesContainer.appendChild(node);
  });
}

function calculateNodePositions(kingdomNames, width, height) {
  const positions = {};
  const nodeCount = kingdomNames.length;

  if (nodeCount === 1) {
    positions[kingdomNames[0]] = { x: width / 2, y: height / 2 };
    return positions;
  }

  // Use a simple circular layout for small numbers, force-directed for larger
  if (nodeCount <= 8) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    kingdomNames.forEach((name, index) => {
      const angle = (index / nodeCount) * 2 * Math.PI;
      positions[name] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });
  } else {
    // Simple grid layout for many kingdoms
    const cols = Math.ceil(Math.sqrt(nodeCount));
    const rows = Math.ceil(nodeCount / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    kingdomNames.forEach((name, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      positions[name] = {
        x: (col + 0.5) * cellWidth,
        y: (row + 0.5) * cellHeight
      };
    });
  }

  return positions;
}

function drawTopologyConnections(canvas, positions) {
  const connections = [];
  const drawnConnections = new Set();

  // Collect all connections
  Object.keys(kingdoms).forEach(kingdomName => {
    const kingdom = kingdoms[kingdomName];
    if (!kingdom.closerKingdoms) return;

    kingdom.closerKingdoms.forEach(connectedKingdom => {
      const connectionId = [kingdomName, connectedKingdom].sort().join('-');
      if (drawnConnections.has(connectionId)) return;
      drawnConnections.add(connectionId);

      const fromPos = positions[kingdomName];
      const toPos = positions[connectedKingdom];

      if (fromPos && toPos) {
        connections.push({
          from: kingdomName,
          to: connectedKingdom,
          fromPos,
          toPos,
          id: connectionId
        });
      }
    });
  });

  // Draw connections
  connections.forEach(conn => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', conn.fromPos.x);
    line.setAttribute('y1', conn.fromPos.y);
    line.setAttribute('x2', conn.toPos.x);
    line.setAttribute('y2', conn.toPos.y);
    line.setAttribute('class', 'topology-connection');
    line.setAttribute('data-connection', conn.id);
    line.setAttribute('stroke-dasharray', '10,5');

    canvas.appendChild(line);
  });
}

function highlightConnections(kingdomName, highlight) {
  const kingdom = kingdoms[kingdomName];
  if (!kingdom.closerKingdoms) return;

  kingdom.closerKingdoms.forEach(connectedKingdom => {
    const connectionId = [kingdomName, connectedKingdom].sort().join('-');
    const line = document.querySelector(`[data-connection="${connectionId}"]`);

    if (line) {
      if (highlight) {
        line.classList.add('active');
      } else {
        line.classList.remove('active');
      }
    }
  });
}