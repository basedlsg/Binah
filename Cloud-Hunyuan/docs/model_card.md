# Model Card for 7L-VLM

This document provides a summary of the 7L-VLM model.

## Model Description

*   **Architecture**: The model is a Visual Language Model (VLM) based on a LLaVA-style architecture. It consists of a vision encoder (e.g., SigLIP) and a large language model (e.g., Gemma).
*   **Training**: The model is fine-tuned on the `7L-Worlds` dataset using a novel verification-augmented training recipe. This involves using a symbolic checker (Z3) to validate the model's generated programs and incorporating the verification results into the loss function.
*   **Tuning**: Low-Rank Adaptation (LoRA) is used to efficiently fine-tune the model.

## Intended Use

This model is designed for tasks that require robust 3D spatial reasoning from one or more images. It is particularly suited for academic research in multimodal AI, embodied AI, and neuro-symbolic reasoning.

## Performance

*See the research paper for detailed experimental results and ablations.*

Key metrics include:
*   Answer Accuracy on held-out viewpoints.
*   Program Pass-Rate (the percentage of generated programs that execute without violation).
*   Constraint Violation Rate.
*   Cross-view Consistency.

## Limitations and Bias

*   The model's understanding of the world is limited by the concepts present in its training data (`7L-Worlds`).
*   As with all large language models, there is a risk of generating plausible but incorrect or biased responses.
*   The model's performance may degrade on scenes that are significantly different from those in the training set.