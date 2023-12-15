from dash import dcc, html
import dash
from dash.dependencies import Input, Output
import numpy as np
import plotly.graph_objects as go

# Axes ranges
RANGE_X = [-5,5]
RANGE_Y = [-5,5]

# Create a Dash application
app = dash.Dash(__name__)

def create_scatter_fig() -> go.Figure:

    # Sample data
    data = np.random.randn(100, 2)

    # Figure
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=data[:, 0],
            y=data[:, 1],
            mode='markers',
            marker=dict(size=8)
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

    # Make image of the figure
    fig.write_image("fig1.png")

    import base64
    img = base64.b64encode(open("fig1.png", 'rb').read())

    # Add image to the figure
    fig.add_layout_image(
        dict(
            source='data:image/png;base64,{}'.format(img.decode()),
            xref="x",
            yref="y",
            x=RANGE_X[0],
            y=RANGE_Y[1],
            sizex=abs(RANGE_X[1] - RANGE_X[0]),
            sizey=abs(RANGE_Y[1] - RANGE_Y[0]),
            sizing="stretch",
            opacity=0.5,
            layer="below")
        )

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
    Input('scatter-plot', 'relayoutData'),
    Input('scatter-plot', 'figure')
)
def update_scatter_plot(relayoutData, fig):
    print(relayoutData)
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

# Run the Dash app
if __name__ == '__main__':

    app.run_server(debug=True)
