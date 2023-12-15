from dash import dcc, html
import dash
from dash.dependencies import Input, Output
import numpy as np
import plotly.graph_objects as go

# Axes ranges
RANGE_X = [-5,5]
RANGE_Y = [-5,5]
DELTA = 0.25

# Sample data
DATA = np.random.randn(100, 2)

# Create a Dash application
app = dash.Dash(__name__)

def create_scatter_fig() -> go.Figure:

    fig = go.Figure()

    # Figure
    trace = go.Scatter(
        x=DATA[:, 0],
        y=DATA[:, 1],
        mode='markers',
        marker=dict(size=8, color='blue')
        )
    trace.hoverinfo = 'none' # No hover info shown - callbacks still fire

    fig.add_trace(trace)

    trace = go.Scatter(
        x=DATA[:, 0],
        y=DATA[:, 1],
        mode='markers',
        marker=dict(size=8, color='red')
        )
    trace.hoverinfo = 'none' # No hover info shown - callbacks still fire

    fig.add_trace(trace)

    # Grid on top
    grid = np.mgrid[RANGE_X[0]:RANGE_X[1]:DELTA, RANGE_Y[0]:RANGE_Y[1]:DELTA]
    trace = go.Scatter(
            x=grid[0].flatten(),
            y=grid[1].flatten(),
            mode='markers',
            marker=dict(size=1, color='gray', opacity=0.0),
            showlegend=False
        )

    # No hover info shown - callbacks still fire
    trace.hoverinfo = 'none'

    fig.add_trace(trace)

    fig.update_xaxes(range=RANGE_X)
    fig.update_yaxes(range=RANGE_Y)
    fig.update_layout(
        title='Draggable Scatter Plot'
    )

    # Hide axes
    fig.update_xaxes(showticklabels=False, showgrid=False, zeroline=False)
    fig.update_yaxes(showticklabels=False, showgrid=False, zeroline=False)

    # Set background color to white
    fig.update_layout(plot_bgcolor='white')

    return fig

fig = create_scatter_fig()

# Define the layout of the app
app.layout = html.Div([
    dcc.Graph(
        id='scatter-plot',
        figure=fig,
        config={
           'displayModeBar': False
        }
    )
])

# Define callback to handle drag events
@app.callback(
    Output('scatter-plot', 'figure'),
    Input('scatter-plot', 'hoverData'),
    Input('scatter-plot', 'figure')
)
def update_scatter_plot(hoverData, fig):
    print(hoverData)
    if hoverData is None:
        return dash.no_update
    if not 'points' in hoverData:
        return dash.no_update
    if len(hoverData['points']) == 0:
        return dash.no_update
    pt = hoverData['points'][0]

    # Check if data or grid point
    if not 'curveNumber' in pt:
        return dash.no_update
    if pt['curveNumber'] != 2:
        return dash.no_update
    
    # Offset
    offset_x = pt['x']
    offset_y = pt['y']

    # Update fig data
    fig['data'][1]['x'] = DATA[:,0] + offset_x
    fig['data'][1]['y'] = DATA[:,1] + offset_y
        
    """
    if relayoutData is None:
        return dash.no_update

    if not 'xaxis.range[0]' in relayoutData or not 'xaxis.range[1]' in relayoutData or not 'yaxis.range[0]' in relayoutData or not 'yaxis.range[1]' in relayoutData:
        return dash.no_update

    # Get offset of dragget points
    offset_x = relayoutData['xaxis.range[0]'] - RANGE_X[0]
    offset_y = relayoutData['yaxis.range[0]'] - RANGE_Y[0]
    print(f"Offset x: {offset_x} y: {offset_y}")

    # Update figure dictionary
    fig['data'][0]['x'] = [ x - offset_x for x in fig['data'][0]['x'] ]
    fig['data'][0]['y'] = [ y - offset_y for y in fig['data'][0]['y'] ]

    # Keep the axes ranges fixed
    fig['layout']['xaxis']['range'] = RANGE_X
    fig['layout']['yaxis']['range'] = RANGE_Y

    return fig
    """
    return fig

# Run the Dash app
if __name__ == '__main__':

    app.run_server(debug=True)
