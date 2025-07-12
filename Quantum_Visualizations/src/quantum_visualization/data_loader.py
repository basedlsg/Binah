import polars as pl
import numpy as np
from pathlib import Path
from typing import List, Tuple, Dict

# Type alias for a single optimization history
History = List[Tuple[np.ndarray, float]]


def save_histories_to_parquet(histories: List[History], file_path: Path):
    """
    Converts a list of optimization histories into a Polars DataFrame
    and saves it to a Parquet file.

    Args:
        histories: A list of histories. Each history is a list of tuples,
                   where each tuple contains the parameters and the loss value.
        file_path: The path to save the Parquet file to.
    """
    records = []
    for run_id, history in enumerate(histories):
        for step, (params, value) in enumerate(history):
            record = {
                "run_id": run_id,
                "step": step,
                "value": value,
            }
            # Flatten parameters into the record
            for i, p_val in enumerate(params):
                record[f"param_{i}"] = p_val
            records.append(record)

    df = pl.DataFrame(records)

    # Ensure the directory exists
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Saving {len(df)} records to {file_path}...")
    df.write_parquet(file_path)
    print("Save complete.")


def load_histories_from_parquet(file_path: Path) -> pl.DataFrame:
    """
    Loads optimization histories from a Parquet file into a Polars DataFrame.

    Args:
        file_path: The path to the Parquet file.

    Returns:
        A Polars DataFrame containing the optimization histories.
    """
    print(f"Loading data from {file_path}...")
    df = pl.read_parquet(file_path)
    print("Load complete.")
    return df
