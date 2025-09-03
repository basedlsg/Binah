#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'pipelines'))

from data_gen_pipeline import data_gen_pipeline
import kfp

# Compile the pipeline to JSON
kfp.compiler.Compiler().compile(
    pipeline_func=data_gen_pipeline,
    package_path='data_gen_pipeline.json'
)
print('Pipeline compiled successfully to data_gen_pipeline.json')
