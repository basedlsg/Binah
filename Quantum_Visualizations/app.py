import dash
from dash import dcc, html, Input, Output, State, callback_context
import plotly.graph_objects as go
import zmq
import logging
import numpy as np
from sklearn.decomposition import PCA

from src.quantum_visualization.proto import messages_pb2

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# --- ZMQ Setup ---
context = zmq.Context()
sub_socket = context.socket(zmq.SUB)
sub_socket.connect("tcp://localhost:5555")
sub_socket.setsockopt(zmq.SUBSCRIBE, b"")
control_socket = context.socket(zmq.PUB)
control_socket.connect("tcp://localhost:5556")
logger.info("ZMQ sockets connected.")

app = dash.Dash(__name__)

# --- App Layout ---
app.layout = html.Div(
    [
        html.H1("Quantum Optimization Visualizer", style={'textAlign': 'center', 'marginBottom': 20}),
        
        dcc.Store(id="pause-state", data={"is_paused": False}),
        dcc.Store(id="trajectory-data", data={"points": [], "full_params": []}),
        dcc.Store(id="save-result-store"),

        html.Div([
            # Main content area with visualizations
            html.Div([
                dcc.Graph(id="live-graph", style={'height': '45vh'}),
                dcc.Graph(id="loss-plot", style={'height': '35vh', 'marginTop': '15px'}),
            ], style={'width': '70%', 'display': 'inline-block', 'paddingRight': '20px'}),
            
            # Control Panel
            html.Div([
                html.H3("Controls", style={'textAlign': 'center'}),
                html.Div(id="status-display", style={'marginBottom': 15, 'padding': 10, 'backgroundColor': '#f0f0f0', 'borderRadius': 5}),
                
                html.Div([
                    html.Button("Pause", id="pause-button", n_clicks=0, style={'width': '48%', 'marginRight': '4%'}),
                    html.Button("Reset", id="reset-button", n_clicks=0, style={'width': '48%'}),
                ], style={'display': 'flex', 'marginBottom': 20}),

                html.Label("Problem Definition", style={'fontWeight': 'bold'}),
                dcc.Dropdown(
                    id="problem-dropdown",
                    options=[
                        {"label": "Toy Problem (Sombrero)", "value": "sombrero"},
                        {"label": "VQE: H₂ Molecule", "value": "h2_molecule"},
                    ],
                    value="sombrero",
                    style={'marginBottom': 20}
                ),

                html.Label("Quantum Backend", style={'fontWeight': 'bold'}),
                dcc.Dropdown(
                    id="quantum-backend-dropdown",
                    options=[
                        {"label": "Classical Simulator", "value": "classical"},
                        {"label": "Qiskit Aer Simulator", "value": "qiskit_aer"},
                        {"label": "Braket Local Simulator", "value": "braket_local"},
                    ],
                    value="classical",
                ),
                html.Div(id="quantum-status", style={'marginTop': 15, 'padding': 10, 'backgroundColor': '#fff3cd', 'borderRadius': 5, 'fontSize': '12px'}),

                html.Label("Learning Rate", style={'fontWeight': 'bold', 'marginTop': 20}),
                dcc.Slider(id="learning-rate-slider", min=0.001, max=0.2, step=0.001, value=0.01,
                           marks={0.001: '0.001', 0.01: '0.01', 0.05: '0.05', 0.1: '0.1', 0.2: '0.2'},
                           tooltip={"placement": "bottom", "always_visible": True}),
                
                html.Label("Update Rate (ms)", style={'fontWeight': 'bold', 'marginTop': 20}),
                dcc.Slider(id="update-rate-slider", min=100, max=2000, step=50, value=300,
                           marks={100: '100ms', 500: '500ms', 1000: '1s', 2000: '2s'},
                           tooltip={"placement": "bottom", "always_visible": True}),
                
                html.Button("Save Experiment", id="save-button", n_clicks=0, style={'marginTop': 20, 'width': '100%', 'padding': '10px'}),
                html.Div(id="save-status", style={'marginTop': 10, 'color': 'green', 'textAlign': 'center'}),
                        
            ], style={'width': '25%', 'display': 'inline-block', 'verticalAlign': 'top'}),
        ]),
        
        dcc.Interval(id="interval-component", interval=100, n_intervals=0),
    ],
    style={'fontFamily': 'Arial, sans-serif', 'padding': '0 20px'}
)

# --- Callbacks ---

@app.callback(
    [Output("live-graph", "figure"), Output("loss-plot", "figure"),
     Output("trajectory-data", "data"), Output("status-display", "children"),
     Output("save-result-store", "data")],
    Input("interval-component", "n_intervals"),
    State("trajectory-data", "data"), State("pause-state", "data")
)
def update_all_visuals(n, existing_data, pause_state):
    if pause_state.get("is_paused"):
        return dash.no_update, dash.no_update, dash.no_update, "Paused", dash.no_update

    points_received = 0
    status_msg = "Waiting for data..."
    save_result = dash.no_update
    
    while True:
        try:
            msg = sub_socket.recv(flags=zmq.NOBLOCK)
            update = messages_pb2.RealtimeUpdate()
            update.ParseFromString(msg)

            if update.HasField("trajectory"):
                full_params = list(update.trajectory.full_params)
                loss_value = update.trajectory.loss_value
                existing_data["full_params"].append(full_params)
                existing_data["points"].append({"loss": loss_value, "step": len(existing_data["points"])})
                points_received += 1
                if len(existing_data["points"]) > 200:
                    existing_data["points"].pop(0)
                    existing_data["full_params"].pop(0)
            elif update.HasField("reset_confirmation") and update.reset_confirmation.success:
                logger.info("Reset confirmation received. Clearing data.")
                existing_data = {"points": [], "full_params": []}
            elif update.HasField("save_confirmation"):
                save_result = {"filepath": update.save_confirmation.filepath}
        except zmq.Again:
            break

    pca_fig, loss_fig = go.Figure(), go.Figure()
    loss_values = [p["loss"] for p in existing_data["points"]]
    steps = list(range(len(loss_values)))

    loss_fig.add_trace(go.Scatter(x=steps, y=loss_values, mode='lines+markers', name='Loss Trend'))
    loss_fig.update_layout(title="Loss Function Convergence", xaxis_title="Optimization Step", yaxis_title="Loss Value",
                           plot_bgcolor='white', paper_bgcolor='white', margin=dict(l=40, r=20, t=40, b=30), showlegend=False)
    loss_fig.update_xaxes(showgrid=True, gridcolor='lightgray')
    loss_fig.update_yaxes(showgrid=True, gridcolor='lightgray', type='linear' if not loss_values or min(loss_values) >= 0 else 'symlog')

    if len(existing_data["points"]) > 5:
        try:
            params_array = np.array([p for p in existing_data["full_params"] if p and len(p) > 0])
            if params_array.ndim == 2 and params_array.shape[1] > 1:
                pca = PCA(n_components=2)
                projected_points = pca.fit_transform(params_array)
                
                pca_fig.add_trace(go.Scatter(x=projected_points[:, 0], y=projected_points[:, 1], mode='lines+markers',
                                             marker=dict(size=8, color=loss_values, colorscale='Viridis', showscale=True,
                                                         colorbar=dict(title="Loss", len=0.75, y=0.5))))
                pca_fig.add_trace(go.Scatter(x=[projected_points[-1, 0]], y=[projected_points[-1, 1]], mode='markers',
                                             marker=dict(size=15, color='red', symbol='star'), name='Current'))
                status_msg = f"Step: {len(loss_values)} | Loss: {loss_values[-1]:.6f}"
            else: status_msg = "Collecting data..."
        except Exception as e:
            logger.error(f"PCA Error: {e}"); status_msg = "PCA calculation error."
    else: status_msg = f"Collecting data... ({len(existing_data['points'])} points)"

    pca_fig.update_layout(title="Live Optimization Trajectory (PCA Projection)", xaxis_title="PC 1", yaxis_title="PC 2",
                          plot_bgcolor='white', paper_bgcolor='white', margin=dict(l=40, r=20, t=40, b=30), showlegend=False)
    pca_fig.update_xaxes(showgrid=True, gridcolor='lightgray'); pca_fig.update_yaxes(showgrid=True, gridcolor='lightgray')

    if points_received > 0: status_msg += f" (+{points_received})"
    return pca_fig, loss_fig, existing_data, status_msg, save_result

@app.callback(Output("save-status", "children"), Input("save-result-store", "data"), prevent_initial_call=True)
def display_save_confirmation(save_result):
    return f"Saved: {save_result['filepath'].split('/')[-1]}" if save_result else dash.no_update

@app.callback(Output("save-button", "n_clicks"), Input("save-button", "n_clicks"), prevent_initial_call=True)
def handle_save_button(n_clicks):
    if n_clicks > 0:
        event = messages_pb2.UIEvent(control_id="save_experiment", bool_value=True)
        control_socket.send(event.SerializeToString())
    return 0

@app.callback(
    [Output("pause-state", "data"), Output("pause-button", "children")],
    [Input("pause-button", "n_clicks"), Input("reset-button", "n_clicks")],
    State("pause-state", "data"), prevent_initial_call=True
)
def handle_run_controls(pause_clicks, reset_clicks, pause_state):
    button_id = callback_context.triggered[0]['prop_id'].split('.')[0]
    
    if button_id == "reset-button":
        control_socket.send(messages_pb2.UIEvent(control_id="reset", bool_value=True).SerializeToString())
        return {"is_paused": False}, "Pause"

    elif button_id == "pause-button":
        new_is_paused = not pause_state.get("is_paused", False)
        control_socket.send(messages_pb2.UIEvent(control_id="set_paused", bool_value=new_is_paused).SerializeToString())
        return {"is_paused": new_is_paused}, "Resume" if new_is_paused else "Pause"
        
    return dash.no_update, dash.no_update

@app.callback(
    [Output("quantum-status", "children")],
    [Input("learning-rate-slider", "value"), Input("update-rate-slider", "value"),
     Input("quantum-backend-dropdown", "value"), Input("problem-dropdown", "value")],
)
def update_controls(learning_rate, update_rate, backend, problem):
    for control_id, value in [("learning_rate", learning_rate), ("update_rate", update_rate),
                              ("quantum_backend", backend), ("set_problem", problem)]:
        if isinstance(value, (int, float)):
            event = messages_pb2.UIEvent(control_id=control_id, float_value=value)
        else:
            event = messages_pb2.UIEvent(control_id=control_id, string_value=value)
        control_socket.send(event.SerializeToString())

    return [f"Backend: {backend} | Problem: {problem.replace('_', ' ').title()}"]

if __name__ == "__main__":
    logger.info("Starting Dash application...")
    app.run(debug=True, port=8050)