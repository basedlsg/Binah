import matplotlib.pyplot as plt
import numpy as np
import polars as pl
from pathlib import Path
from typing import Callable

from orqviz.scans import perform_2D_scan
from orqviz.pca import get_pca
from orqviz.scans.plots import plot_2D_scan_result

from .data_loader import load_histories_from_parquet


def plot_landscape_and_trajectories(
    data_file: Path, loss_function: Callable, output_image_path: Path
):
    """
    Loads optimization data, performs PCA, and plots the 2D loss landscape
    with optimization trajectories overlaid using Matplotlib.

    Args:
        data_file: Path to the Parquet file with optimization histories.
        loss_function: The loss function to evaluate over the landscape.
        output_image_path: Path to save the output PNG image file.
    """
    df = load_histories_from_parquet(data_file)
    
    param_cols = [col for col in df.columns if col.startswith("param_")]
    all_params = df.select(param_cols).to_numpy()

    print("Performing PCA...")
    pca = get_pca(all_params)
    dir1, dir2 = pca.components[:2]
    origin = pca.mean

    print("Performing 2D scan...")
    scan_results = perform_2D_scan(
        origin=origin,
        loss_function=loss_function,
        direction_x=dir1,
        direction_y=dir2,
        n_steps_x=100,
        end_points_x=(-3, 3),
    )

    print("Generating plot...")
    fig, ax = plt.subplots(figsize=(12, 10))
    plot_2D_scan_result(scan_results, fig=fig, ax=ax)

    print("Adding optimization trajectories...")
    for run_id, group in df.group_by("run_id"):
        run_params = group.select(param_cols).to_numpy()
        
        # Manually project parameters onto the PCA plane
        vecs_from_origin = run_params - pca.mean
        coords_on_plane = np.array(
            [np.dot(vecs_from_origin, dir1), np.dot(vecs_from_origin, dir2)]
        ).T

        ax.plot(
            coords_on_plane[:, 0],
            coords_on_plane[:, 1],
            color="black",
            alpha=0.6,
            linewidth=2,
            marker="o",
            markersize=4,
            markerfacecolor="white",
            markeredgecolor="black",
        )

    ax.set_title("2D PCA Landscape of 'Sombrero' Function with Optimization Trajectories")
    ax.set_xlabel("Principal Component 1")
    ax.set_ylabel("Principal Component 2")

    print(f"Saving plot to {output_image_path}...")
    output_image_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_image_path, dpi=300)
    plt.close(fig)
    print("Plotting complete.")
