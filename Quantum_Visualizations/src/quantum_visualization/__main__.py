import numpy as np
import polars as pl
from . import data_loader, plotter
from .gradient_descent_optimizer import gradient_descent_optimizer
from pathlib import Path

def loss_function(pars: np.ndarray) -> float:
    """
    The 'sombrero' loss function from the orqviz paper.
    A variation of the sinc function.
    """
    norm_of_pars = np.linalg.norm(pars, ord=2)
    freq = 2
    # Add a small epsilon to avoid division by zero at the center
    return -np.sin(freq * norm_of_pars) / (freq * norm_of_pars + 1e-8) + 1

def run_optimization_and_collect_history():
    """
    Runs multiple gradient descent optimizations and collects the history.
    """
    n_params = 10
    n_runs = 20
    all_histories = []

    for i in range(n_runs):
        print(f"Running optimization {i+1}/{n_runs}...")
        # Start each run from a random point in a 10-D sphere of radius 3
        starting_params = (np.random.rand(n_params) - 0.5) * 6
        
        all_params, all_costs = gradient_descent_optimizer(
            starting_params, loss_function, n_iters=40, learning_rate=0.1
        )
        # Zip the params and costs together to match the expected history format
        history = list(zip(all_params, all_costs))
        all_histories.append(history)
    
    return all_histories

def main():
    """
    Main function to generate data and replicate the orqviz Figure 3.
    """
    print("Starting experiment: Replicate ORQVIZ Figure 3")

    histories = run_optimization_and_collect_history()
    print(f"Generated data for {len(histories)} optimization runs.")

    # Save the data
    output_path = Path("data/sombrero_histories.parquet")
    data_loader.save_histories_to_parquet(histories, output_path)

    # Plot the results
    plot_output_path = Path("experiments/I-1/sombrero_landscape.png")
    plotter.plot_landscape_and_trajectories(
        data_file=output_path,
        loss_function=loss_function,
        output_image_path=plot_output_path,
    )

    print("Experiment complete. View the results at:", plot_output_path)

if __name__ == "__main__":
    main()
