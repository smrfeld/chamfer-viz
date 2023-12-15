// Allowed editModes
let editModes = [
    'Translate',
    'Rotate'
    ]

let dataModes = [
    'Gaussian',
    'Uniform',
    'Grid',
    'Clusters'
    ]

// Initialize data and settings
let data = [];
let editMode = 'Translate';
let dataMode = 'Gaussian';

// Initialize range from -7 to 7 - RANGE_X = [-7,7]
let rangeX = { min: -7, max: 7 };
let rangeY = { min: -7, max: 7 };

// Grid spacing for hovering
// This is a trick to do the dragging with resolution DELTA
// The grid is not shown
let delta = 0.5; // Step size for Chamfer Distance calculation

// Initialize your plot
let plot = {}; // Placeholder for the plotly plot

// Parameters for Chamfer Distance calculation
var distance = function(a, b) {
    return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
}
var dimensions = ['x', 'y'];

// Function to create initial data and plot
function initializeApp() {
    // Set edit dropdown
    const editDropdown = document.getElementById('edit-dropdown');
    editModes.forEach(mode => {
        const option = document.createElement('option');
        option.value = mode;
        option.textContent = mode;
        editDropdown.appendChild(option);
    });

    // Set data dropdown
    const dataDropdown = document.getElementById('data-dropdown');
    dataModes.forEach(mode => {
        const option = document.createElement('option');
        option.value = mode;
        option.textContent = mode;
        dataDropdown.appendChild(option);
    });

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

    if (mode === 'Gaussian') {
        let batch = randomNormalBatch(batchSize * 2); // Generate batch for both x and y

        for (let i = 0; i < batchSize; i++) {
            dataNew.push({ x: batch[i], y: batch[batchSize + i] });
        }
    } else if (mode === 'Uniform') {
        for (let i = 0; i < batchSize; i++) {
            dataNew.push({ x: 3 * (Math.random() - 0.5), y: 3 * (Math.random() - 0.5) });
        }
    } else if (mode === 'Grid') {
        // Create a grid in [-0.5, 0.5] with 10 points in each direction
        for (let x = -0.5; x <= 0.5; x += 0.1) {
            for (let y = -0.5; y <= 0.5; y += 0.1) {
                dataNew.push({ x: x * 5, y: y * 5 });
            }
        }
    } else if (mode === 'Clusters') {
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
            opacity: 1
        },
        showlegend: false,
        hoverinfo: 'none' // No hover info shown - callbacks still fire
    };

    let title = chamferDistanceTitleFromOffset(data, 0, 0, 0);

    let layout = {
        width: 600,
        height: 600,
        autosize: false,
        title: title,
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
        plot_bgcolor: 'white',
        // No grid
        showgrid: false,
        // No axes
        showline: false,
    };

    // Create plot
    plot = Plotly.newPlot('scatter-plot', [trace1, gridTrace], layout);

    // Add hover event listener
    const scatterPlotElement = document.getElementById('scatter-plot');
    scatterPlotElement.on('plotly_hover', function(eventData) {

        let offsetX = eventData.xvals[0];
        let offsetY = eventData.yvals[0];
        let rotateAngle = -Math.atan2(offsetY, offsetX);
        console.log(`Hovered at (${offsetX}, ${offsetY}) with angle ${rotateAngle}`);
        
    });
}


document.getElementById('edit-dropdown').addEventListener('change', function(event) {
    // Log
    console.log('Edit dropdown changed to ' + event.target.value);

    editMode = event.target.value;
    // Update plot or other elements based on edit mode
});

document.getElementById('data-dropdown').addEventListener('change', function(event) {
    // Log new value
    console.log('Data dropdown changed to ' + event.target.value);

    dataMode = event.target.value;
    updateDataMode(dataMode);
    createScatterPlot();
});

document.getElementById('randomize-button').addEventListener('click', function() {
    // Log
    console.log('Randomize button clicked');

    // Randomize data and update plot
    updateDataMode(dataMode);
    createScatterPlot();
});

function dataTransform(data, offsetX, offsetY, rotateAngle) {
    // Applying the offset
    let transformedData = data.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));

    // Applying the rotation if the angle is not zero
    if (rotateAngle !== 0) {
        const c = Math.cos(rotateAngle);
        const s = Math.sin(rotateAngle);
        transformedData = transformedData.map(p => {
            return {
                x: p.x * c - p.y * s,
                y: p.x * s + p.y * c
            };
        });
    }

    return transformedData;
}

function dataTransformXY(data, offsetX, offsetY, rotateAngle) {
    const transformedData = dataTransform(data, offsetX, offsetY, rotateAngle);
    return {
        x: transformedData.map(p => p.x),
        y: transformedData.map(p => p.y)
    };
}

function chamferDistance(data, dataOffset) {
    // Assuming 'distance' function and 'dimensions' are defined elsewhere
    // Log
    var treeData = new kdTree(data, distance, dimensions);
    var treeDataOffset = new kdTree(dataOffset, distance, dimensions);

    // Calculate distance from data to dataOffset
    var distA = 0;
    for (let i = 0; i < data.length; i++) {
        var nearest = treeDataOffset.nearest(data[i], 1);
        distA += nearest[0][1]; // Assuming nearest[0] is the closest point and nearest[0][1] is the distance
    }
    distA /= data.length;

    // Calculate distance from dataOffset to data
    var distB = 0;
    for (let i = 0; i < dataOffset.length; i++) {
        var nearest = treeData.nearest(dataOffset[i], 1);
        distB += nearest[0][1]; // Assuming nearest[0] is the closest point and nearest[0][1] is the distance
    }
    distB /= dataOffset.length;

    return distA + distB;
}

function chamferDistanceFromOffset(data, offsetX, offsetY, rotateAngle) {
    const dataOffset = dataTransform(data, offsetX, offsetY, rotateAngle);
    return chamferDistance(data, dataOffset);
}

function chamferDistanceTitleFromOffset(data, offsetX, offsetY, rotateAngle) {
    const dist = chamferDistanceFromOffset(data, offsetX, offsetY, rotateAngle);
    return `Chamfer distance: ${dist.toFixed(2)}`;
}
