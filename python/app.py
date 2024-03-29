from dash import dcc, html
import dash
from dash.dependencies import Input, Output
import numpy as np
import plotly.graph_objects as go
from scipy.spatial import KDTree
from typing import Tuple
from enum import Enum
import dash_bootstrap_components as dbc
import argparse


# Axes ranges
RANGE_X = [-7,7]
RANGE_Y = [-7,7]

# Grid spacing for hovering
# This is a trick to do the dragging with resolution DELTA
# The grid is not shown
DELTA = 0.5


class DataMode(Enum):
    GAUSSIAN = "Gaussian"
    UNIFORM = "Uniform"
    GRID = "Grid"
    CLUSTERS = "Clusters"


class EditMode(Enum):
    TRANSLATE = "Translate"
    ROTATE = "Rotate"


EDIT_MODE = EditMode.TRANSLATE
DATA_MODE = DataMode.CLUSTERS

class Data:

    def __init__(self):
        self.set_mode(DataMode.CLUSTERS)

    def set_mode(self, mode: DataMode):
        if mode == DataMode.GAUSSIAN:
            data = np.random.randn(100, 2)
        elif mode == DataMode.UNIFORM:
            data = 3*(np.random.rand(100, 2) - 0.5)
        elif mode == DataMode.GRID:
            # Grid in [-0.5,0.5] with 10 points in each direction
            grid = np.mgrid[-0.5:0.5:0.1, -0.5:0.5:0.1]
            grid *= 5
            data = np.vstack((grid[0].flatten(), grid[1].flatten())).T
        elif mode == DataMode.CLUSTERS:
            n_gaussian = np.random.randint(4, 10)
            n_pts_per_gaussian = 100 // n_gaussian
            data_list = []
            for i in range(n_gaussian):
                offset = 4*(np.random.rand(2) - 0.5)
                data_list.append(0.25*np.random.randn(n_pts_per_gaussian, 2) + offset)
            data = np.vstack(data_list)
        else:
            raise NotImplementedError()
        data -= np.mean(data, axis=0)
        self.data = data
        self.tree = KDTree(self.data)

    @property
    def data_x(self):
        return self.data[:, 0]

    @property
    def data_y(self):
        return self.data[:, 1]

    def data_transform(self, offset_x: float, offset_y: float, rotate_angle: float) -> np.ndarray:
        data = self.data + np.array([offset_x, offset_y])
        if rotate_angle != 0:
            c = np.cos(rotate_angle)
            s = np.sin(rotate_angle)
            R = np.array([[c, -s], [s, c]])
            data = np.dot(data, R)
        return data
    
    def data_transform_xy(self, offset_x: float, offset_y: float, rotate_angle: float) -> Tuple[np.ndarray, np.ndarray]:
        data_offset = self.data_transform(offset_x, offset_y, rotate_angle)
        return data_offset[:, 0], data_offset[:, 1]

    def chamfer_distance(self, data_offset: np.ndarray) -> float:
        tree_offset = KDTree(data_offset)
        dist_A = tree_offset.query(self.data)[0]
        dist_B = self.tree.query(data_offset)[0]
        return np.mean(dist_A) + np.mean(dist_B)

    def chamfer_distance_from_offset(self, offset_x: float, offset_y: float, rotate_angle: float) -> float:
        data_offset = self.data_transform(offset_x, offset_y, rotate_angle)
        return self.chamfer_distance(data_offset)

    def chamfer_distance_title_from_offset(self, offset_x: float, offset_y: float, rotate_angle: float) -> str:
        dist = self.chamfer_distance_from_offset(offset_x, offset_y, rotate_angle)
        return f'Chamfer distance: {dist:.2f}'

global DATA
DATA = Data()

# Create a Dash application
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

def create_scatter_fig() -> go.Figure:
    global DATA

    fig = go.Figure()

    # Figure
    trace = go.Scatter(
        x=DATA.data_x,
        y=DATA.data_y,
        mode='markers',
        marker=dict(size=8, color='blue')
        )
    trace.hoverinfo = 'none' # No hover info shown - callbacks still fire

    fig.add_trace(trace)

    trace = go.Scatter(
        x=DATA.data_x,
        y=DATA.data_y,
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
        marker=dict(size=10, opacity=0.0),
        showlegend=False
    )

    # No hover info shown - callbacks still fire
    trace.hoverinfo = 'none'

    fig.add_trace(trace)

    fig.update_xaxes(range=RANGE_X, fixedrange=True)
    fig.update_yaxes(range=RANGE_Y, fixedrange=True)

    # No legend
    fig.update_layout(showlegend=False, font=dict(size=24))

    # Square aspect ratio
    fig.update_layout(
        width=600,
        height=600,
        autosize=False,
        margin=dict(
            l=0,
            r=0,
            b=0,
            t=80,
            pad=0
        )
        )

    # Hide axes
    fig.update_xaxes(showticklabels=False, showgrid=False, zeroline=False)
    fig.update_yaxes(showticklabels=False, showgrid=False, zeroline=False)

    # Title
    fig.update_layout(title=DATA.chamfer_distance_title_from_offset(0, 0, 0))

    # Set background color to white
    fig.update_layout(plot_bgcolor='white')

    return fig

fig = create_scatter_fig()

# Define the layout of the app
graph = dcc.Graph(
    id='scatter-plot',
    figure=fig,
    config={
        'displayModeBar': False
    }
)
dropdown_edit = dcc.Dropdown(
    value=EDIT_MODE.value,
    options=[
        {'label': mode.value, 'value': mode.value}
        for mode in EditMode
    ],
    id="edit-dropdown",
)
dropdown_data = dcc.Dropdown(
    value=DATA_MODE.value,
    options=[
        {'label': mode.value, 'value': mode.value}
        for mode in DataMode
    ],
    id="data-dropdown",
)
buttons = [
    dbc.Col([
        dbc.Label("Edit mode"), 
        dropdown_edit
        ], md=4),
    dbc.Col([
        dbc.Label("Data mode"), 
        dropdown_data
        ], md=4),
    dbc.Col([
        dbc.Row(dbc.Label("Randomize data")), 
        dbc.Row(dbc.Button("Randomize", id="randomize-button"))
        ], md=4)
    ]
app.layout = dbc.Container(
    [
        dbc.Row(
            [
                dbc.Row(buttons),
                dbc.Row(graph),
            ],
            align="center",
        ),
    ],
    fluid=True,
)


def update_hover(hoverData, fig):
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

    # Calculate angle
    rotate_angle = - np.arctan2(offset_y, offset_x)

    # Update based on mode
    if EDIT_MODE == EditMode.TRANSLATE:
        fig['data'][1]['x'], fig['data'][1]['y'] = DATA.data_transform_xy(offset_x, offset_y, 0)
        fig['layout']['title']['text'] = DATA.chamfer_distance_title_from_offset(offset_x, offset_y, 0)
    elif EDIT_MODE == EditMode.ROTATE:
        fig['data'][1]['x'], fig['data'][1]['y'] = DATA.data_transform_xy(0, 0, rotate_angle)
        fig['layout']['title']['text'] = DATA.chamfer_distance_title_from_offset(0, 0, rotate_angle)
    else:
        raise NotImplementedError()

    return fig


def update_edit(edit_mode, fig):
    global EDIT_MODE
    EDIT_MODE = EditMode(edit_mode)
    DATA.set_mode(DATA_MODE)
    fig = create_scatter_fig()
    return fig


def update_data(data_mode, fig):
    global DATA_MODE
    DATA_MODE = DataMode(data_mode)
    DATA.set_mode(DATA_MODE)
    fig = create_scatter_fig()
    return fig


def randomize_button():
    DATA.set_mode(DATA_MODE)
    fig = create_scatter_fig()
    return fig


# Define callback to handle drag events
@app.callback(
    Output('scatter-plot', 'figure'),
    Input('scatter-plot', 'hoverData'),
    Input('scatter-plot', 'figure'),
    Input('edit-dropdown', 'value'),
    Input('data-dropdown', 'value'),
    Input('randomize-button', 'n_clicks'),
)
def update_scatter_plot(hoverData, fig, edit_mode, data_mode, n_clicks):
    # Figure out what changed
    ctx = dash.callback_context
    if not ctx.triggered:
        return dash.no_update
    prop_id = ctx.triggered[0]['prop_id']
    if prop_id == 'scatter-plot.figure':
        return dash.no_update
    elif prop_id == 'scatter-plot.hoverData':
        return update_hover(hoverData, fig)
    elif prop_id == 'edit-dropdown.value':
        return update_edit(edit_mode, fig)
    elif prop_id == 'data-dropdown.value':
        return update_data(data_mode, fig)
    elif prop_id == 'randomize-button.n_clicks':
        return randomize_button()
    else:
        raise NotImplementedError()

# Run the Dash app
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Visualize Chamfer distance")
    parser.add_argument("--port", type=int, default=8050, help="Port to run server on")
    parser.add_argument("--debug", action="store_true", help="Run in debug mode")
    args = parser.parse_args()

    app.run_server(debug=args.debug, port=args.port)
