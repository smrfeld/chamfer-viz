// Initialize data and settings
let data = []; // This will hold your data points
let editMode = 'defaultEditMode'; // Replace with your default edit mode
let dataMode = 'GAUSSIAN'; // Replace with your default data mode

// Initialize range from -7 to 7 - RANGE_X = [-7,7]
let rangeX = { min: -7, max: 7 };
let rangeY = { min: -7, max: 7 };

// Grid spacing for hovering
// This is a trick to do the dragging with resolution DELTA
// The grid is not shown
let delta = 0.1; // Step size for Chamfer Distance calculation

// Initialize your plot
let plot = {}; // Placeholder for the plotly plot

// Function to create initial data and plot
function initializeApp() {
    updateDataMode(dataMode);
    createScatterPlot();
}

document.addEventListener('DOMContentLoaded', initializeApp);

function randomNormalBatch(size) {
    let normals = [];
    for (let i = 0; i < size; i += 2) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); // Avoid zero
        while (v === 0) v = Math.random();
        let z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        let z1 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);

        normals.push(z0);
        if (i + 1 < size) normals.push(z1);
    }
    return normals;
}

function updateDataMode(mode) {
    let dataNew = [];
    let batchSize = 100;

    if (mode === 'GAUSSIAN') {
        let batch = randomNormalBatch(batchSize * 2); // Generate batch for both x and y

        for (let i = 0; i < batchSize; i++) {
            dataNew.push({ x: batch[i], y: batch[batchSize + i] });
        }
    } else if (mode === 'UNIFORM') {
        for (let i = 0; i < batchSize; i++) {
            dataNew.push({ x: 3 * (Math.random() - 0.5), y: 3 * (Math.random() - 0.5) });
        }
    } else if (mode === 'GRID') {
        // Create a grid in [-0.5, 0.5] with 10 points in each direction
        for (let x = -0.5; x <= 0.5; x += 0.1) {
            for (let y = -0.5; y <= 0.5; y += 0.1) {
                dataNew.push({ x: x * 5, y: y * 5 });
            }
        }
    } else if (mode === 'CLUSTERS') {
        let batch = randomNormalBatch(batchSize * 2); // Generate batch for both x and y

        let nGaussian = Math.floor(Math.random() * (10 - 4)) + 4;
        let nPtsPerGaussian = Math.floor(100 / nGaussian);
        let ctr = 0;
        for (let i = 0; i < nGaussian; i++) {
            let offsetX = 4 * (Math.random() - 0.5);
            let offsetY = 4 * (Math.random() - 0.5);
            for (let j = 0; j < nPtsPerGaussian; j++) {
                dataNew.push({ x: 0.25 * batch[ctr] + offsetX, y: 0.25 * batch[batchSize + ctr] + offsetY });
                ctr++;
            }
        }
    } else {
        throw new Error('Mode not implemented');
    }

    // Adjust data to have mean of zero
    let meanX = dataNew.reduce((acc, val) => acc + val.x, 0) / dataNew.length;
    let meanY = dataNew.reduce((acc, val) => acc + val.y, 0) / dataNew.length;
    data = dataNew.map(p => ({ x: p.x - meanX, y: p.y - meanY }));
}

function generateGridData(rangeX, rangeY, delta) {
    let gridData = [];

    for (let x = rangeX.min; x <= rangeX.max; x += delta) {
        for (let y = rangeY.min; y <= rangeY.max; y += delta) {
            gridData.push({ x: x, y: y });
        }
    }

    return gridData;
}

function createScatterPlot() {
    let trace1 = {
        x: data.map(d => d.x),
        y: data.map(d => d.y),
        mode: 'markers',
        type: 'scatter',
        marker: { size: 8, color: 'blue' },
        hoverinfo: 'none' // No hover info shown - callbacks still fire
    };

    // Generate grid data
    let gridData = generateGridData(rangeX, rangeY, delta);

    // Trace for the grid
    let gridTrace = {
        x: gridData.map(p => p.x),
        y: gridData.map(p => p.y),
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: 1,
            color: 'gray',
            opacity: 0.0
        },
        showlegend: false,
        hoverinfo: 'none'
    };

    let layout = {
        width: 600,
        height: 600,
        autosize: false,
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 80,
            pad: 0
        },
        showlegend: false,
        font: { size: 24 },
        xaxes: {
            range: [rangeX.min, rangeX.max],
            fixedrange: true,
            showticklabels: false,
            showgrid: false,
            zeroline: false
        },
        yaxes: {
            range: [rangeY.min, rangeY.max],
            fixedrange: true,
            showticklabels: false,
            showgrid: false,
            zeroline: false
        },
        title: 'Scatter Plot',
        plot_bgcolor: 'white'
    };

    plot = Plotly.newPlot('scatter-plot', [trace1, gridTrace], layout);
}

document.getElementById('edit-dropdown').addEventListener('change', function(event) {
    editMode = event.target.value;
    // Update plot or other elements based on edit mode
});

document.getElementById('data-dropdown').addEventListener('change', function(event) {
    dataMode = event.target.value;
    updateDataMode(dataMode);
    createScatterPlot();
});

document.getElementById('randomize-button').addEventListener('click', function() {
    // Randomize data and update plot
    updateDataMode(dataMode);
    createScatterPlot();
});

function transformData(offsetX, offsetY, rotateAngle) {
    // Transform your data here
    // You need to translate Python's numpy operations into JavaScript
}

function calculateChamferDistance(data) {
    // Calculate Chamfer Distance
    // This will require a KDTree equivalent in JavaScript or an alternative approach
}
