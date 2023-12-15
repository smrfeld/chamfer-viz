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

// Initialize range 
let rangeX = { min: -6, max: 6 };
let rangeY = { min: -6, max: 6 };

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

// Initialize app
document.addEventListener('DOMContentLoaded', initializeApp);

// Function to generate a batch of random normal numbers
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

// Function to update data based on data mode
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

// Function to create scatter plot
function createScatterPlot() {
    let trace1 = {
        x: data.map(d => d.x),
        y: data.map(d => d.y),
        mode: 'markers',
        type: 'scatter',
        marker: { size: 8, color: 'blue' },
        hoverinfo: 'none' // No hover info shown - callbacks still fire
    };

    let trace2 = {
        x: data.map(d => d.x),
        y: data.map(d => d.y),
        mode: 'markers',
        type: 'scatter',
        marker: { size: 8, color: 'red' },
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
        xaxis: {
            range: [rangeX.min, rangeX.max],
            fixedrange: true,
            showticklabels: false,
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            range: [rangeY.min, rangeY.max],
            fixedrange: true,
            showticklabels: false,
            showgrid: false,
            zeroline: false
        },
        plot_bgcolor: 'white'
    };

    // Create plot
    plot = Plotly.newPlot('scatter-plot', [trace1, trace2], layout);

    // Hide modebar
    const scatterPlotElement = document.getElementById('scatter-plot');
    scatterPlotElement.on('plotly_afterplot', function() {
        const modeBar = document.getElementsByClassName('modebar')[0];
        modeBar.style.display = 'none';        
    });

    // Add hover event listener
    scatterPlotElement.on('plotly_hover', function(eventData) {

        // Offset
        let offsetX = eventData.xvals[0];
        let offsetY = eventData.yvals[0];
        let rotateAngle = Math.atan2(offsetY, offsetX);
        // console.log(`Hovered at (${offsetX}, ${offsetY}) with angle ${rotateAngle}`);
        
        // Based on edit mode, update the plot
        let figureData = scatterPlotElement.data;
        let dataTransformed = [];
        let title = '';
        if (editMode == 'Translate') {
            dataTransformed = dataTransform(data, offsetX, offsetY, 0);
            title = chamferDistanceTitleFromOffset(data, offsetX, offsetY, 0);
        } else if (editMode == 'Rotate') {
            dataTransformed = dataTransform(data, 0, 0, rotateAngle);
            title = chamferDistanceTitleFromOffset(data, 0, 0, rotateAngle);
        } else {
            throw new Error('Edit mode not implemented');
        }
        figureData[1].x = dataTransformed.map(p => p.x);
        figureData[1].y = dataTransformed.map(p => p.y);
        
        // Redraw
        scatterPlotElement.data = figureData;
        scatterPlotElement.layout.title = title;
        Plotly.redraw(scatterPlotElement);
    });
}

// Event listeners for edit mode
document.getElementById('edit-dropdown').addEventListener('change', function(event) {
    // Log
    console.log('Edit dropdown changed to ' + event.target.value);

    editMode = event.target.value;
    // Update plot or other elements based on edit mode
});

// Event listeners for data mode
document.getElementById('data-dropdown').addEventListener('change', function(event) {
    // Log new value
    console.log('Data dropdown changed to ' + event.target.value);

    dataMode = event.target.value;
    updateDataMode(dataMode);
    createScatterPlot();
});

// Event listeners for randomize button
document.getElementById('randomize-button').addEventListener('click', function() {
    // Log
    console.log('Randomize button clicked');

    // Randomize data and update plot
    updateDataMode(dataMode);
    createScatterPlot();
});

// Transform data by offset and rotation
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

// Transform data by offset and rotation and return x and y separately
function dataTransformXY(data, offsetX, offsetY, rotateAngle) {
    const transformedData = dataTransform(data, offsetX, offsetY, rotateAngle);
    return {
        x: transformedData.map(p => p.x),
        y: transformedData.map(p => p.y)
    };
}

// Calculate chamfer distance
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

// Calculate chamfer distance from offset
function chamferDistanceFromOffset(data, offsetX, offsetY, rotateAngle) {
    const dataOffset = dataTransform(data, offsetX, offsetY, rotateAngle);
    return chamferDistance(data, dataOffset);
}

// Calculate chamfer distance from offset and return title
function chamferDistanceTitleFromOffset(data, offsetX, offsetY, rotateAngle) {
    const dist = chamferDistanceFromOffset(data, offsetX, offsetY, rotateAngle);
    return `Chamfer distance: ${dist.toFixed(2)}`;
}
