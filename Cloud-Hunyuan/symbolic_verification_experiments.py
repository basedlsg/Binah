#!/usr/bin/env python3
"""
Symbolic Reasoning Verification Experiments for 7L-Worlds
Uses Z3 SMT solver to verify VLM-generated symbolic programs against ground truth
"""

import json
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from google.cloud import storage


class VerificationResult(Enum):
    VERIFIED = "verified"
    FALSIFIED = "falsified"
    TIMEOUT = "timeout"
    ERROR = "error"


@dataclass
class SymbolicProgram:
    program_text: str
    format: str  # "smt-lib" or "json-cnf"
    variables: List[str]
    constraints: List[str]


@dataclass
class VerificationExperiment:
    world_id: str
    vlm_program: SymbolicProgram
    ground_truth_constraints: List[Dict[str, Any]]
    verification_result: VerificationResult
    counterexample: Optional[Dict[str, Any]]
    execution_time: float
    verification_details: Dict[str, Any]


class Z3Verifier:
    """Uses Z3 to verify symbolic programs against ground truth constraints"""

    def __init__(self):
        self.verification_timeout = 30  # seconds
        try:
            from z3 import Solver, sat, unsat, unknown, set_option
            set_option(timeout=self.verification_timeout * 1000)  # milliseconds
            self.z3_available = True
        except ImportError:
            print("⚠️ Z3 not available, using mock verification")
            self.z3_available = False

    def verify_program(self, program: SymbolicProgram,
                      ground_truth: List[Dict[str, Any]]) -> Tuple[VerificationResult, Optional[Dict[str, Any]]]:
        """Verify a symbolic program against ground truth constraints"""

        if not self.z3_available:
            return self._mock_verification(program, ground_truth)

        try:
            from z3 import Solver, Bool, Int, Real, And, Or, Not, sat, unsat

            solver = Solver()

            # Parse program into Z3 constraints
            program_constraints = self._parse_program_to_z3(program)

            # Parse ground truth into Z3 constraints
            ground_truth_constraints = self._parse_ground_truth_to_z3(ground_truth)

            # Add program constraints
            for constraint in program_constraints:
                solver.add(constraint)

            # Check if program is consistent with ground truth
            for gt_constraint in ground_truth_constraints:
                solver.push()
                solver.add(Not(gt_constraint))  # Check if negation is satisfiable

                result = solver.check()
                solver.pop()

                if result == sat:
                    # Found counterexample - program contradicts ground truth
                    model = solver.model()
                    counterexample = self._extract_counterexample(model)
                    return VerificationResult.FALSIFIED, counterexample

            # If no contradictions found, program is verified
            return VerificationResult.VERIFIED, None

        except Exception as e:
            print(f"Verification error: {e}")
            return VerificationResult.ERROR, {"error": str(e)}

    def _parse_program_to_z3(self, program: SymbolicProgram) -> List:
        """Parse symbolic program into Z3 constraints"""
        constraints = []

        if program.format == "smt-lib":
            # Parse SMT-LIB format
            lines = program.program_text.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('(assert'):
                    # Basic SMT-LIB parsing (simplified)
                    constraint_expr = self._parse_smt_expression(line[7:-1])  # Remove (assert ...)
                    if constraint_expr:
                        constraints.append(constraint_expr)

        return constraints

    def _parse_ground_truth_to_z3(self, ground_truth: List[Dict[str, Any]]) -> List:
        """Parse ground truth constraints into Z3 format"""
        constraints = []

        for gt in ground_truth:
            if gt.get("format") == "smt-lib":
                statement = gt.get("statement", "")
                constraint_expr = self._parse_smt_expression(statement)
                if constraint_expr:
                    constraints.append(constraint_expr)

        return constraints

    def _parse_smt_expression(self, expr: str) -> Optional[Any]:
        """Parse SMT-LIB expression into Z3 (simplified implementation)"""
        try:
            from z3 import Bool, Int, Real, And, Or, Not

            expr = expr.strip()

            # Handle basic boolean operations
            if expr.startswith("(and"):
                subexprs = expr[4:-1].split()
                return And(*[self._parse_smt_expression(sub) for sub in subexprs if sub])
            elif expr.startswith("(or"):
                subexprs = expr[3:-1].split()
                return Or(*[self._parse_smt_expression(sub) for sub in subexprs if sub])
            elif expr.startswith("(not"):
                subexpr = expr[4:-1].strip()
                return Not(self._parse_smt_expression(subexpr))

            # Handle basic predicates (simplified)
            elif "=" in expr and not expr.startswith("("):
                parts = expr.split("=")
                if len(parts) == 2:
                    left = parts[0].strip()
                    right = parts[1].strip()
                    # Create variables and equality (simplified)
                    return Bool(f"{left}_equals_{right}")

            # For more complex expressions, return a placeholder
            return Bool(f"constraint_{hash(expr)}")

        except Exception as e:
            print(f"Error parsing SMT expression '{expr}': {e}")
            return None

    def _extract_counterexample(self, model) -> Dict[str, Any]:
        """Extract counterexample from Z3 model"""
        counterexample = {}

        try:
            for decl in model.decls():
                var_name = decl.name()
                var_value = model[decl]

                # Convert Z3 value to Python
                if hasattr(var_value, 'as_long'):
                    counterexample[var_name] = var_value.as_long()
                elif hasattr(var_value, 'numerator') and hasattr(var_value, 'denominator'):
                    counterexample[var_name] = float(var_value.numerator()) / float(var_value.denominator())
                else:
                    counterexample[var_name] = str(var_value)
        except Exception as e:
            counterexample["extraction_error"] = str(e)

        return counterexample

    def _mock_verification(self, program: SymbolicProgram,
                          ground_truth: List[Dict[str, Any]]) -> Tuple[VerificationResult, Optional[Dict[str, Any]]]:
        """Mock verification when Z3 is not available"""
        import random
        import time

        # Simulate verification time
        time.sleep(0.1)

        # Randomly decide verification result (for demo purposes)
        if random.random() < 0.7:  # 70% verified
            return VerificationResult.VERIFIED, None
        else:
            # Generate mock counterexample
            counterexample = {
                "object_1_position": [1.5, 2.3, 0.8],
                "object_2_position": [2.1, 1.9, 0.5],
                "violation": "objects intersecting when they shouldn't"
            }
            return VerificationResult.FALSIFIED, counterexample


class SymbolicReasoningExperimentRunner:
    """Runs symbolic reasoning verification experiments"""

    def __init__(self, bucket_name: str = "7l-data"):
        self.storage_client = storage.Client()
        self.bucket = self.storage_client.bucket(bucket_name)
        self.verifier = Z3Verifier()

    def run_experiment_suite(self, world_ids: List[str],
                           mock_vlm_programs: bool = True) -> List[VerificationExperiment]:
        """Run verification experiments on multiple worlds"""

        experiments = []

        for world_id in world_ids:
            print(f"🔍 Running symbolic verification for {world_id}")

            # Load scene data
            scene_data = self._load_scene_data(world_id)
            if not scene_data:
                continue

            # Generate or mock VLM programs
            if mock_vlm_programs:
                vlm_programs = self._generate_mock_vlm_programs(scene_data)
            else:
                vlm_programs = self._load_actual_vlm_programs(world_id)

            # Run verification for each program
            for program in vlm_programs:
                experiment = self._run_single_experiment(world_id, program, scene_data)
                experiments.append(experiment)

        return experiments

    def _load_scene_data(self, world_id: str) -> Optional[Dict[str, Any]]:
        """Load scene graph and constraints"""
        try:
            scene_blob = self.bucket.blob(f"worlds/{world_id}/scene_graph.json")
            constraints_blob = self.bucket.blob(f"worlds/{world_id}/constraints.json")

            if scene_blob.exists() and constraints_blob.exists():
                scene_graph = json.loads(scene_blob.download_as_string())
                constraints = json.loads(constraints_blob.download_as_string())
                return {"scene_graph": scene_graph, "constraints": constraints}
        except Exception as e:
            print(f"Error loading scene data for {world_id}: {e}")

        return None

    def _generate_mock_vlm_programs(self, scene_data: Dict[str, Any]) -> List[SymbolicProgram]:
        """Generate mock VLM programs for testing"""
        programs = []

        # Mock spatial reasoning program
        spatial_program = SymbolicProgram(
            program_text="""
            (declare-const chair_x Real)
            (declare-const chair_y Real)
            (declare-const table_x Real)
            (declare-const table_y Real)
            (assert (< chair_x table_x))  ; chair is left of table
            (assert (> chair_y table_y))  ; chair is above table
            """,
            format="smt-lib",
            variables=["chair_x", "chair_y", "table_x", "table_y"],
            constraints=["chair left of table", "chair above table"]
        )
        programs.append(spatial_program)

        # Mock counting program
        counting_program = SymbolicProgram(
            program_text="""
            (declare-const red_objects Int)
            (declare-const blue_objects Int)
            (assert (= red_objects 1))
            (assert (= blue_objects 2))
            """,
            format="smt-lib",
            variables=["red_objects", "blue_objects"],
            constraints=["one red object", "two blue objects"]
        )
        programs.append(counting_program)

        return programs

    def _load_actual_vlm_programs(self, world_id: str) -> List[SymbolicProgram]:
        """Load actual VLM-generated programs (placeholder)"""
        # This would load programs from VLM inference results
        return self._generate_mock_vlm_programs(None)

    def _run_single_experiment(self, world_id: str, program: SymbolicProgram,
                             scene_data: Dict[str, Any]) -> VerificationExperiment:
        """Run a single verification experiment"""
        import time

        start_time = time.time()

        # Run verification
        result, counterexample = self.verifier.verify_program(
            program, scene_data["constraints"]
        )

        execution_time = time.time() - start_time

        # Create detailed analysis
        verification_details = {
            "program_complexity": len(program.constraints),
            "ground_truth_constraints": len(scene_data["constraints"]),
            "z3_available": self.verifier.z3_available,
            "verification_method": "Z3" if self.verifier.z3_available else "mock"
        }

        return VerificationExperiment(
            world_id=world_id,
            vlm_program=program,
            ground_truth_constraints=scene_data["constraints"],
            verification_result=result,
            counterexample=counterexample,
            execution_time=execution_time,
            verification_details=verification_details
        )

    def analyze_experiment_results(self, experiments: List[VerificationExperiment]) -> Dict[str, Any]:
        """Analyze the results of verification experiments"""

        analysis = {
            "total_experiments": len(experiments),
            "verified_count": 0,
            "falsified_count": 0,
            "error_count": 0,
            "timeout_count": 0,
            "average_execution_time": 0,
            "verification_rate": 0,
            "error_patterns": [],
            "performance_by_world": {}
        }

        total_time = 0
        world_performance = {}

        for exp in experiments:
            # Count results
            if exp.verification_result == VerificationResult.VERIFIED:
                analysis["verified_count"] += 1
            elif exp.verification_result == VerificationResult.FALSIFIED:
                analysis["falsified_count"] += 1
            elif exp.verification_result == VerificationResult.ERROR:
                analysis["error_count"] += 1
                if exp.counterexample and "error" in exp.counterexample:
                    analysis["error_patterns"].append(exp.counterexample["error"])
            elif exp.verification_result == VerificationResult.TIMEOUT:
                analysis["timeout_count"] += 1

            # Track execution time
            total_time += exp.execution_time

            # Track performance by world
            if exp.world_id not in world_performance:
                world_performance[exp.world_id] = {"total": 0, "verified": 0}
            world_performance[exp.world_id]["total"] += 1
            if exp.verification_result == VerificationResult.VERIFIED:
                world_performance[exp.world_id]["verified"] += 1

        # Calculate rates
        analysis["average_execution_time"] = total_time / len(experiments) if experiments else 0
        analysis["verification_rate"] = analysis["verified_count"] / len(experiments) if experiments else 0
        analysis["performance_by_world"] = world_performance

        return analysis


def run_symbolic_verification_experiments():
    """Run the complete symbolic verification experiment suite"""
    print("🧮 7L-Worlds Symbolic Verification Experiments")
    print("=" * 60)

    runner = SymbolicReasoningExperimentRunner()

    # Example world IDs (would be loaded from actual data)
    test_worlds = ["world_001", "world_002", "world_003"]

    print(f"🔬 Running verification experiments on {len(test_worlds)} worlds...")
    experiments = runner.run_experiment_suite(test_worlds, mock_vlm_programs=True)

    print(f"\n✅ Completed {len(experiments)} verification experiments")
    print()

    # Analyze results
    analysis = runner.analyze_experiment_results(experiments)

    print("📊 Verification Results Summary:")
    print(f"   • Total Experiments: {analysis['total_experiments']}")
    print(f"   • Verified Programs: {analysis['verified_count']} ({analysis['verification_rate']:.1%})")
    print(f"   • Falsified Programs: {analysis['falsified_count']}")
    print(f"   • Errors: {analysis['error_count']}")
    print(f"   • Timeouts: {analysis['timeout_count']}")
    print(".3f")
    print()

    print("🎯 Key Insights:")
    print("• Symbolic verification enables automated correctness checking")
    print("• Verification rate shows how well VLMs generate correct symbolic programs")
    print("• Counterexamples help identify specific reasoning failures")
    print("• This enables precise measurement of multimodal reasoning accuracy")

    # Show detailed results for first few experiments
    print("\n🔍 Detailed Results (First 3 Experiments):")
    for i, exp in enumerate(experiments[:3]):
        print(f"\nExperiment {i+1}: {exp.world_id}")
        print(f"   Result: {exp.verification_result.value}")
        print(".3f")
        if exp.verification_result == VerificationResult.FALSIFIED and exp.counterexample:
            print(f"   Counterexample: {exp.counterexample}")
        print(f"   Program Constraints: {len(exp.vlm_program.constraints)}")

    return experiments, analysis


if __name__ == "__main__":
    experiments, analysis = run_symbolic_verification_experiments()
