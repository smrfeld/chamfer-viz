from dash import dcc, html
import dash
from dash.dependencies import Input, Output
import numpy as np
import plotly.graph_objects as go

RANGE_X = [-5,5]
RANGE_Y = [-5,5]

# Create a Dash application
app = dash.Dash(__name__)

# Sample data
data = np.random.randn(100, 2)

# Figure
fig = go.Figure()
fig.add_trace(
    go.Scatter(
        x=data[:, 0],
        y=data[:, 1]
    )
)
fig.update_xaxes(range=RANGE_X)
fig.update_yaxes(range=RANGE_Y)
fig.update_layout(
    dragmode='pan',  # Set dragmode to 'lasso' for selection
    title='Draggable Scatter Plot'
)

# Hide axes
fig.update_xaxes(showticklabels=False, showgrid=False, zeroline=False)
fig.update_yaxes(showticklabels=False, showgrid=False, zeroline=False)

# Set background color to white
fig.update_layout(plot_bgcolor='white')

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
    Input('scatter-plot', 'relayoutData'),
    Input('scatter-plot', 'figure')
)
def update_scatter_plot(relayoutData, fig_dict):
    print(relayoutData)
    if relayoutData is None:
        return dash.no_update

    if not 'xaxis.range[0]' in relayoutData or not 'xaxis.range[1]' in relayoutData or not 'yaxis.range[0]' in relayoutData or not 'yaxis.range[1]' in relayoutData:
        return dash.no_update

    # Get offset of dragget points
    offset_x = relayoutData['xaxis.range[0]'] - RANGE_X[0]
    offset_y = relayoutData['yaxis.range[0]'] - RANGE_Y[0]
    print(f"Offset x: {offset_x} y: {offset_y}")

    # Convert figure dict to object
    fig = go.Figure(fig_dict)

    # Update the points
    data[:,0] = data[:,0] - offset_x
    data[:,1] = data[:,1] - offset_y
    fig.update_traces(
        x=data[:, 0],
        y=data[:, 1]
        )

    # Keep the axes ranges fixed
    fig.update_xaxes(range=RANGE_X)
    fig.update_yaxes(range=RANGE_Y)

    return fig

# Run the Dash app
if __name__ == '__main__':
    app.run_server(debug=True)
