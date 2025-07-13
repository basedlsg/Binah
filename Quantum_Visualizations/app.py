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

app = dash.Dash(__name__, suppress_callback_exceptions=True)

# --- Reusable Components & Styles ---
def build_collapsible_panel(title, content):
    return html.Details([
        html.Summary(title, style={'fontWeight': 'bold', 'cursor': 'pointer', 'fontSize': '1.1em'}),
        html.Div(content, style={'padding': '10px', 'borderLeft': '2px solid #ccc', 'marginLeft': '20px'})
    ], style={'marginBottom': '10px'})

# --- Educational Content ---
vqe_explanation = dcc.Markdown("""
    The **Variational Quantum Eigensolver (VQE)** is a hybrid quantum-classical algorithm used to find the minimum eigenvalue of a Hamiltonian, which often corresponds to the ground state energy of a molecule.
    1.  **Ansatz:** A parameterized quantum circuit (the "ansatz") is created to prepare a trial wavefunction.
    2.  **Measurement:** The quantum computer measures the expectation value of the Hamiltonian for the prepared state.
    3.  **Optimization:** A classical optimizer uses this expectation value as a "loss" and adjusts the circuit parameters to minimize it.
    This loop continues until the energy converges to a minimum.
""")

h2_explanation = dcc.Markdown("""
    The **Hydrogen molecule (H₂)** is the simplest neutral molecule, making it a perfect "hello, world" for quantum chemistry simulations. The goal is to find the bond distance at which the molecule's total energy is minimized. This application uses the VQE algorithm to find this ground state energy for a fixed bond distance (0.735 Å). The Hamiltonian for H₂ is small enough to be simulated on today's quantum computers and simulators.
""")

pca_explanation = dcc.Markdown("""
    **Principal Component Analysis (PCA)** is a classical technique used to reduce the dimensionality of data. The optimization landscape for our quantum problem exists in a high-dimensional space (equal to the number of parameters in the ansatz). To visualize it, PCA finds the two principal directions (the "Principal Components") along which the data has the most variance. By projecting the high-dimensional trajectory onto this 2D plane, we can get an intuitive view of how the optimizer is exploring the landscape.
""")

noise_explanation = dcc.Markdown("""
    **Quantum Noise** refers to unwanted interactions that corrupt the state of qubits, leading to errors in computation. This is the primary challenge for current NISQ (Noisy Intermediate-Scale Quantum) devices. This simulator can introduce **depolarizing noise**, a common type of error where a qubit's state has a certain probability of being randomized. By enabling noise, you can see how it degrades the optimizer's performance, often preventing it from finding the true minimum energy.
""")

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
                dcc.Dropdown(id="problem-dropdown",
                    options=[
                        {"label": "Toy Problem (Sombrero)", "value": "sombrero"},
                        {"label": "VQE: H₂ Molecule", "value": "h2_molecule"},
                    ], value="sombrero", style={'marginBottom': 20}),

                html.Label("Quantum Backend", style={'fontWeight': 'bold'}),
                dcc.Dropdown(id="quantum-backend-dropdown",
                    options=[
                        {"label": "Classical Simulator", "value": "classical"},
                        {"label": "Qiskit Aer Simulator", "value": "qiskit_aer"},
                        {"label": "Braket Local Simulator", "value": "braket_local"},
                    ], value="classical"),
                html.Div(id="quantum-status", style={'marginTop': 15, 'padding': 10, 'backgroundColor': '#fff3cd', 'borderRadius': 5}),

                html.Div(id='noise-controls-div', style={'marginTop': 20, 'display': 'none'}, children=[
                    html.Label("Noise Simulation (Qiskit Only)", style={'fontWeight': 'bold'}),
                    dcc.Checklist(id='noise-enabled-checklist',
                        options=[{'label': 'Enable Depolarizing Noise', 'value': 'enabled'}], value=[]),
                    dcc.Slider(id="noise-level-slider", min=0, max=0.01, step=0.0005, value=0.001,
                        marks={i/1000: str(i/1000) for i in range(0, 11, 2)},
                        tooltip={"placement": "bottom", "always_visible": True}, disabled=True),
                ]),

                html.Label("Learning Rate", style={'fontWeight': 'bold', 'marginTop': 20}),
                dcc.Slider(id="learning-rate-slider", min=0.001, max=0.2, step=0.001, value=0.01,
                           marks={i/100: str(i/100) for i in range(2, 21, 4)},
                           tooltip={"placement": "bottom", "always_visible": True}),
                
                html.Label("Update Rate (ms)", style={'fontWeight': 'bold', 'marginTop': 20}),
                dcc.Slider(id="update-rate-slider", min=100, max=2000, step=50, value=300,
                           marks={i: f'{i}ms' for i in range(200, 2001, 600)},
                           tooltip={"placement": "bottom", "always_visible": True}),
                
                html.Button("Save Experiment", id="save-button", n_clicks=0, style={'marginTop': 20, 'width': '100%', 'padding': '10px'}),
                html.Div(id="save-status", style={'marginTop': 10, 'color': 'green', 'textAlign': 'center'}),
                        
            ], style={'width': '25%', 'display': 'inline-block', 'verticalAlign': 'top'}),
        ]),
        
        # Educational Content Section
        html.Div([
            html.H3("How It Works", style={'textAlign': 'center', 'marginTop': '30px'}),
            build_collapsible_panel("What is VQE?", vqe_explanation),
            build_collapsible_panel("The H₂ Molecule Problem", h2_explanation),
            build_collapsible_panel("Understanding the PCA Plot", pca_explanation),
            build_collapsible_panel("The Effect of Quantum Noise", noise_explanation),
        ], style={'marginTop': '20px', 'padding': '20px', 'backgroundColor': '#fafafa', 'borderRadius': '5px'}),

        dcc.Interval(id="interval-component", interval=100, n_intervals=0),
    ],
    style={'fontFamily': 'Arial, sans-serif', 'padding': '0 20px 20px 20px'}
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
                           plot_bgcolor='white', paper_bgcolor='white', margin=dict(l=50, r=20, t=40, b=30), showlegend=False)
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
    [Output('noise-controls-div', 'style'), Output("noise-level-slider", "disabled")],
    Input('quantum-backend-dropdown', 'value'), Input("noise-enabled-checklist", "value")
)
def toggle_noise_controls(backend, noise_enabled):
    is_qiskit = backend == 'qiskit_aer'
    style = {'marginTop': 20, 'display': 'block'} if is_qiskit else {'display': 'none'}
    slider_disabled = not ('enabled' in noise_enabled and is_qiskit)
    return style, slider_disabled

@app.callback(
    Output("quantum-status", "children"),
    [Input("learning-rate-slider", "value"), Input("update-rate-slider", "value"),
     Input("quantum-backend-dropdown", "value"), Input("problem-dropdown", "value"),
     Input("noise-enabled-checklist", "value"), Input("noise-level-slider", "value")],
     prevent_initial_call=True
)
def update_all_controls(lr, rate, backend, problem, noise_enabled, noise_level):
    ctx_triggered = callback_context.triggered
    if not ctx_triggered:
        return dash.no_update

    # Send all controls at once to ensure state consistency
    noise_active = (backend == 'qiskit_aer') and ('enabled' in noise_enabled)
    
    for cid, val, is_b, is_f in [
        ("learning_rate", lr, False, True), ("update_rate", rate, False, True),
        ("quantum_backend", backend, False, False), ("set_problem", problem, False, False),
        ("set_noise_enabled", noise_active, True, False), ("set_noise_level", noise_level, False, True)
    ]:
        if is_b: event = messages_pb2.UIEvent(control_id=cid, bool_value=val)
        elif is_f: event = messages_pb2.UIEvent(control_id=cid, float_value=val)
        else: event = messages_pb2.UIEvent(control_id=cid, string_value=val)
        control_socket.send(event.SerializeToString())

    status_text = f"Backend: {backend} | Problem: {problem.replace('_', ' ').title()}"
    if noise_active:
        status_text += f" | Noise: {noise_level:.4f}"
    return status_text

# Separate callback for the save button to avoid conflicts
@app.callback(Output("save-button", "n_clicks"), Input("save-button", "n_clicks"), prevent_initial_call=True)
def handle_save_button(n_clicks):
    if n_clicks > 0:
        event = messages_pb2.UIEvent(control_id="save_experiment", bool_value=True)
        control_socket.send(event.SerializeToString())
    return 0

if __name__ == "__main__":
    logger.info("Starting Dash application...")
    app.run(debug=True, port=8050)
