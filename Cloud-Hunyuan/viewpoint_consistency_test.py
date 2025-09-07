#!/usr/bin/env python3
"""
Viewpoint Consistency Validation Test for 7L-Worlds
Tests whether VLMs can maintain consistent reasoning across different viewpoints
"""

import json
import numpy as np
from typing import Dict, List, Any, Tuple
from google.cloud import storage
from dataclasses import dataclass
from enum import Enum


class ConsistencyTest(Enum):
    SPATIAL_RELATION_CONSISTENCY = "spatial_relation_consistency"
    OBJECT_COUNT_CONSISTENCY = "object_count_consistency"
    VISIBILITY_CONSISTENCY = "visibility_consistency"
    SYMBOLIC_CONSTRAINT_CONSISTENCY = "symbolic_constraint_consistency"


@dataclass
class ViewpointTestCase:
    world_id: str
    question: str
    expected_answer: str
    viewpoint_variations: List[Dict[str, Any]]
    test_type: ConsistencyTest
    ground_truth: Dict[str, Any]


@dataclass
class ConsistencyResult:
    test_case: ViewpointTestCase
    vlm_responses: List[str]
    consistency_score: float
    violations: List[str]
    analysis: Dict[str, Any]


class ViewpointConsistencyValidator:
    """Validates viewpoint consistency in VLM responses"""

    def __init__(self, bucket_name: str = "7l-data"):
        self.storage_client = storage.Client()
        self.bucket = self.storage_client.bucket(bucket_name)

    def create_consistency_test_suite(self, world_ids: List[str]) -> List[ViewpointTestCase]:
        """Create a comprehensive test suite for viewpoint consistency"""
        test_cases = []

        for world_id in world_ids:
            # Load scene data
            scene_data = self._load_scene_data(world_id)
            if not scene_data:
                continue

            # Generate viewpoint variations
            viewpoint_variations = self._generate_viewpoint_variations(world_id)

            # Create spatial relation tests
            spatial_tests = self._create_spatial_consistency_tests(scene_data, viewpoint_variations)
            test_cases.extend(spatial_tests)

            # Create counting consistency tests
            counting_tests = self._create_counting_consistency_tests(scene_data, viewpoint_variations)
            test_cases.extend(counting_tests)

            # Create visibility tests
            visibility_tests = self._create_visibility_consistency_tests(scene_data, viewpoint_variations)
            test_cases.extend(visibility_tests)

        return test_cases

    def _load_scene_data(self, world_id: str) -> Optional[Dict[str, Any]]:
        """Load scene graph and constraints for a world"""
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

    def _generate_viewpoint_variations(self, world_id: str) -> List[Dict[str, Any]]:
        """Generate different viewpoint variations for testing"""
        variations = []

        # Load available rendered images
        renders_prefix = f"renders/{world_id}/"
        render_blobs = list(self.bucket.list_blobs(prefix=renders_prefix))

        for blob in render_blobs:
            if blob.name.endswith('.png'):
                view_id = blob.name.split('/')[-1].replace('.png', '')
                variations.append({
                    "view_id": view_id,
                    "image_uri": f"gs://{self.bucket.name}/{blob.name}",
                    "camera_params": self._load_camera_params(world_id, view_id)
                })

        return variations

    def _load_camera_params(self, world_id: str, view_id: str) -> Optional[Dict]:
        """Load camera parameters for a specific view"""
        try:
            camera_blob = self.bucket.blob(f"renders/{world_id}/cameras.json")
            if camera_blob.exists():
                cameras = json.loads(camera_blob.download_as_string())
                return cameras.get(view_id)
        except Exception as e:
            print(f"Error loading camera params for {world_id}/{view_id}: {e}")
        return None

    def _create_spatial_consistency_tests(self, scene_data: Dict,
                                        viewpoint_variations: List[Dict]) -> List[ViewpointTestCase]:
        """Create tests for spatial relation consistency across viewpoints"""
        tests = []
        relations = scene_data["scene_graph"].get("relations", [])

        for relation in relations[:3]:  # Test first few relations
            obj1_name = self._get_object_name(scene_data["scene_graph"], relation["subject"])
            obj2_name = self._get_object_name(scene_data["scene_graph"], relation["object"])

            if obj1_name and obj2_name:
                question = f"What is the spatial relationship between {obj1_name} and {obj2_name}?"
                expected_answer = f"{obj1_name} is {relation['type'].replace('_', ' ')} {obj2_name}"

                tests.append(ViewpointTestCase(
                    world_id=scene_data["scene_graph"]["world_id"],
                    question=question,
                    expected_answer=expected_answer,
                    viewpoint_variations=viewpoint_variations,
                    test_type=ConsistencyTest.SPATIAL_RELATION_CONSISTENCY,
                    ground_truth={
                        "relation_type": relation["type"],
                        "subject": relation["subject"],
                        "object": relation["object"],
                        "expected_consistent": True  # Spatial relations should be consistent
                    }
                ))

        return tests

    def _create_counting_consistency_tests(self, scene_data: Dict,
                                         viewpoint_variations: List[Dict]) -> List[ViewpointTestCase]:
        """Create tests for object counting consistency"""
        tests = []
        objects = scene_data["scene_graph"].get("objects", [])

        # Count objects by color
        color_counts = {}
        for obj in objects:
            color = obj.get("material", {}).get("color", "unknown")
            if color != "unknown":
                color_counts[color] = color_counts.get(color, 0) + 1

        for color, count in color_counts.items():
            if count > 1:  # Only test if there are multiple objects
                question = f"How many {color} objects are visible?"
                expected_answer = str(count)

                tests.append(ViewpointTestCase(
                    world_id=scene_data["scene_graph"]["world_id"],
                    question=question,
                    expected_answer=expected_answer,
                    viewpoint_variations=viewpoint_variations,
                    test_type=ConsistencyTest.OBJECT_COUNT_CONSISTENCY,
                    ground_truth={
                        "color": color,
                        "expected_count": count,
                        "expected_consistent": True  # Object counts should be consistent
                    }
                ))

        return tests

    def _create_visibility_consistency_tests(self, scene_data: Dict,
                                           viewpoint_variations: List[Dict]) -> List[ViewpointTestCase]:
        """Create tests for object visibility consistency"""
        tests = []
        objects = scene_data["scene_graph"].get("objects", [])

        if len(objects) >= 2:
            # Test visibility of second object from different viewpoints
            test_object = objects[1]
            obj_name = test_object.get("label", f"object_{test_object['id']}")

            question = f"Is the {obj_name} visible from this viewpoint?"
            expected_answer = "This should be consistent with ground truth visibility"

            tests.append(ViewpointTestCase(
                world_id=scene_data["scene_graph"]["world_id"],
                question=question,
                expected_answer=expected_answer,
                viewpoint_variations=viewpoint_variations,
                test_type=ConsistencyTest.VISIBILITY_CONSISTENCY,
                ground_truth={
                    "object_id": test_object["id"],
                    "object_name": obj_name,
                    "expected_consistent": False  # Visibility CAN change with viewpoint
                }
            ))

        return tests

    def _get_object_name(self, scene_graph: Dict, object_id: str) -> Optional[str]:
        """Get human-readable object name"""
        objects = scene_graph.get("objects", [])
        for obj in objects:
            if str(obj["id"]) == str(object_id):
                return obj.get("label", f"object_{obj['id']}")
        return None

    def evaluate_consistency(self, test_case: ViewpointTestCase,
                           vlm_responses: List[str]) -> ConsistencyResult:
        """Evaluate consistency of VLM responses across viewpoints"""

        # Analyze responses for consistency
        consistency_score = self._calculate_consistency_score(vlm_responses, test_case)
        violations = self._identify_violations(vlm_responses, test_case)

        # Detailed analysis
        analysis = {
            "response_distribution": self._analyze_response_distribution(vlm_responses),
            "consistency_by_viewpoint": self._analyze_consistency_by_viewpoint(vlm_responses, test_case),
            "ground_truth_alignment": self._check_ground_truth_alignment(vlm_responses, test_case),
            "reasoning_patterns": self._extract_reasoning_patterns(vlm_responses)
        }

        return ConsistencyResult(
            test_case=test_case,
            vlm_responses=vlm_responses,
            consistency_score=consistency_score,
            violations=violations,
            analysis=analysis
        )

    def _calculate_consistency_score(self, responses: List[str], test_case: ViewpointTestCase) -> float:
        """Calculate a consistency score (0-1) for the responses"""
        if len(responses) <= 1:
            return 1.0  # Single response is trivially consistent

        # For spatial relations, responses should be identical
        if test_case.test_type == ConsistencyTest.SPATIAL_RELATION_CONSISTENCY:
            # Check if all responses match the expected answer
            matches = sum(1 for resp in responses if test_case.expected_answer.lower() in resp.lower())
            return matches / len(responses)

        # For counting, responses should be numerically consistent
        elif test_case.test_type == ConsistencyTest.OBJECT_COUNT_CONSISTENCY:
            # Extract numbers from responses and check consistency
            numbers = []
            for resp in responses:
                # Simple number extraction (could be improved)
                import re
                nums = re.findall(r'\d+', resp)
                if nums:
                    numbers.append(int(nums[0]))

            if not numbers:
                return 0.0

            # Check if all extracted numbers are the same
            expected_count = test_case.ground_truth["expected_count"]
            consistent_count = sum(1 for num in numbers if num == expected_count)
            return consistent_count / len(numbers)

        # For visibility, some inconsistency is expected but should be reasonable
        elif test_case.test_type == ConsistencyTest.VISIBILITY_CONSISTENCY:
            # Count yes/no answers
            yes_count = sum(1 for resp in responses if "yes" in resp.lower() or "visible" in resp.lower())
            no_count = len(responses) - yes_count

            # Perfect consistency would be all yes or all no
            if yes_count == len(responses) or no_count == len(responses):
                return 1.0
            else:
                # Partial consistency based on majority
                majority = max(yes_count, no_count) / len(responses)
                return majority

        return 0.5  # Default moderate consistency

    def _identify_violations(self, responses: List[str], test_case: ViewpointTestCase) -> List[str]:
        """Identify specific consistency violations"""
        violations = []

        if test_case.test_type == ConsistencyTest.SPATIAL_RELATION_CONSISTENCY:
            expected = test_case.expected_answer.lower()
            for i, resp in enumerate(responses):
                if expected not in resp.lower():
                    violations.append(f"View {i}: Expected '{expected}' but got '{resp}'")

        elif test_case.test_type == ConsistencyTest.OBJECT_COUNT_CONSISTENCY:
            expected_count = test_case.ground_truth["expected_count"]
            for i, resp in enumerate(responses):
                import re
                nums = re.findall(r'\d+', resp)
                if nums and int(nums[0]) != expected_count:
                    violations.append(f"View {i}: Expected count {expected_count} but got {nums[0]}")

        return violations

    def _analyze_response_distribution(self, responses: List[str]) -> Dict[str, int]:
        """Analyze the distribution of different response types"""
        distribution = {}
        for resp in responses:
            # Normalize response for grouping
            normalized = resp.lower().strip()
            distribution[normalized] = distribution.get(normalized, 0) + 1
        return distribution

    def _analyze_consistency_by_viewpoint(self, responses: List[str],
                                        test_case: ViewpointTestCase) -> Dict[str, Any]:
        """Analyze consistency patterns by viewpoint characteristics"""
        analysis = {}

        for i, (response, viewpoint) in enumerate(zip(responses, test_case.viewpoint_variations)):
            view_id = viewpoint["view_id"]
            analysis[view_id] = {
                "response": response,
                "camera_params": viewpoint.get("camera_params"),
                "consistency_with_expected": test_case.expected_answer.lower() in response.lower()
            }

        return analysis

    def _check_ground_truth_alignment(self, responses: List[str],
                                    test_case: ViewpointTestCase) -> Dict[str, Any]:
        """Check how well responses align with ground truth"""
        alignment_scores = []

        for resp in responses:
            if test_case.test_type == ConsistencyTest.SPATIAL_RELATION_CONSISTENCY:
                aligned = test_case.expected_answer.lower() in resp.lower()
            elif test_case.test_type == ConsistencyTest.OBJECT_COUNT_CONSISTENCY:
                import re
                nums = re.findall(r'\d+', resp)
                expected = test_case.ground_truth["expected_count"]
                aligned = nums and int(nums[0]) == expected
            else:
                aligned = True  # For other types, we can't easily check alignment

            alignment_scores.append(aligned)

        return {
            "average_alignment": sum(alignment_scores) / len(alignment_scores),
            "perfect_alignment": all(alignment_scores),
            "alignment_scores": alignment_scores
        }

    def _extract_reasoning_patterns(self, responses: List[str]) -> List[str]:
        """Extract common reasoning patterns from responses"""
        patterns = []

        # Look for common phrases indicating reasoning
        reasoning_indicators = [
            "because", "since", "therefore", "thus", "so", "due to",
            "appears to be", "seems to", "looks like", "I can see"
        ]

        for resp in responses:
            for indicator in reasoning_indicators:
                if indicator in resp.lower():
                    patterns.append(f"Uses '{indicator}' reasoning")
                    break

        return list(set(patterns))  # Remove duplicates


def run_consistency_evaluation():
    """Run a complete viewpoint consistency evaluation"""
    print("🔍 7L-Worlds Viewpoint Consistency Evaluation")
    print("=" * 60)

    validator = ViewpointConsistencyValidator()

    # Example world IDs (would be loaded from actual data)
    example_worlds = ["world_001", "world_002", "world_003"]

    # Create test suite
    test_cases = validator.create_consistency_test_suite(example_worlds)

    print(f"📋 Created {len(test_cases)} viewpoint consistency tests")
    print()

    # Example evaluation (would use actual VLM responses)
    for i, test_case in enumerate(test_cases[:3]):  # Show first 3 tests
        print(f"🧪 Test {i+1}: {test_case.test_type.value}")
        print(f"   Question: {test_case.question}")
        print(f"   Expected: {test_case.expected_answer}")
        print(f"   Viewpoints: {len(test_case.viewpoint_variations)}")
        print(f"   Ground Truth: {test_case.ground_truth}")
        print()

    # Mock evaluation results
    print("📊 Evaluation Results (Mock Data):")
    print("- Spatial Relation Consistency: 0.85")
    print("- Object Count Consistency: 0.92")
    print("- Visibility Consistency: 0.78")
    print("- Overall Viewpoint Robustness: 0.85")
    print()

    print("🎯 Key Insights:")
    print("• 7L-Worlds enables testing viewpoint-robust reasoning")
    print("• Consistency scores show how well VLMs maintain reasoning across views")
    print("• Ground truth verification enables automated evaluation")
    print("• This demonstrates actual multimodal reasoning capabilities")


if __name__ == "__main__":
    run_consistency_evaluation()
