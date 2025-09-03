# Data Card for 7L-Worlds

This document provides a summary of the 7L-Worlds dataset.

## Dataset Description

*   **Content**: The dataset consists of multi-view images of 3D scenes, accompanied by detailed metadata including camera parameters, object-level scene graphs, and symbolic constraints.
*   **Source**: The 3D worlds are generated using the [HunyuanWorld-1.0](https://github.com/Tencent/HunyuanWorld) model. All subsequent annotations (renders, scene graphs, constraints) are generated programmatically.
*   **License**: The 7L-Worlds dataset is released under the [Apache 2.0 License](LICENSE). The underlying 3D assets from HunyuanWorld are subject to the [tencent-hunyuanworld-1.0-community license](https://huggingface.co/Tencent-Hunyuan/HunyuanWorld-1.0/blob/main/LICENSE).

## Schemas

*   **Scene Graph**: See [`dataset_specs/scene_graph.schema.json`](../dataset_specs/scene_graph.schema.json).
*   **Constraints**: See [`dataset_specs/constraints.schema.json`](../dataset_specs/constraints.schema.json).
*   **Training Sample**: See [`dataset_specs/sample.schema.json`](../dataset_specs/sample.schema.json).

## Intended Use

This dataset is intended for research in multimodal machine learning, specifically for training and evaluating models on tasks requiring 3D spatial understanding and viewpoint-robust reasoning.

## Limitations

*   The diversity of scenes is limited by the capabilities of the underlying generative model (HunyuanWorld-1.0).
*   The symbolic constraints are derived programmatically and may not capture all of the complex semantic relationships present in the scenes.