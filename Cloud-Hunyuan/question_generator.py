#!/usr/bin/env python3
"""
Question Generation System for 7L-Worlds Multimodal Reasoning
Creates viewpoint-robust reasoning tasks for VLM training and evaluation
"""

import json
import random
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class QuestionType(Enum):
    SPATIAL_RELATIONS = "spatial_relations"
    OBJECT_COUNTING = "object_counting"
    VISIBILITY_REASONING = "visibility_reasoning"
    SYMBOLIC_CONSTRAINTS = "symbolic_constraints"
    VIEWPOINT_CONSISTENCY = "viewpoint_consistency"


@dataclass
class GeneratedQuestion:
    question: str
    question_type: QuestionType
    target_answer: str
    symbolic_program: str
    required_views: List[int]
    reasoning_chain: List[str]


class QuestionGenerator:
    """Generates multimodal reasoning questions from scene graphs"""

    def __init__(self):
        self.spatial_relations = ["left_of", "right_of", "above", "below", "in_front_of", "behind", "touching"]
        self.question_templates = {
            QuestionType.SPATIAL_RELATIONS: [
                "What is {obj1} doing in relation to {obj2}?",
                "From this viewpoint, is {obj1} to the left or right of {obj2}?",
                "Is {obj1} visible from behind {obj2}?",
            ],
            QuestionType.OBJECT_COUNTING: [
                "How many {color} objects are in this scene?",
                "Count the objects that are {spatial_relation} the {reference_object}.",
                "How many objects can you see from this angle?",
            ],
            QuestionType.VISIBILITY_REASONING: [
                "Can you see the {object} from this viewpoint?",
                "Which objects are occluded from this camera position?",
                "Is the {object} visible when looking from behind?",
            ],
            QuestionType.SYMBOLIC_CONSTRAINTS: [
                "Is this scene physically possible?",
                "Are there any impossible spatial relationships?",
                "Does this violate any physical constraints?",
            ],
            QuestionType.VIEWPOINT_CONSISTENCY: [
                "Would this scene look the same from the opposite side?",
                "How does the relative position of {obj1} and {obj2} change when viewed from different angles?",
                "Is the spatial relationship between {obj1} and {obj2} consistent across viewpoints?",
            ]
        }

    def generate_questions_for_scene(self, scene_graph: Dict[str, Any],
                                   constraints: Dict[str, Any],
                                   num_questions: int = 5) -> List[GeneratedQuestion]:
        """Generate diverse reasoning questions for a scene"""
        questions = []

        objects = scene_graph.get("objects", [])
        relations = scene_graph.get("relations", [])

        if len(objects) < 2:
            return []  # Need at least 2 objects for meaningful questions

        # Generate spatial relation questions
        spatial_questions = self._generate_spatial_questions(objects, relations)
        questions.extend(spatial_questions[:num_questions//3])

        # Generate counting questions
        counting_questions = self._generate_counting_questions(objects, relations)
        questions.extend(counting_questions[:num_questions//3])

        # Generate viewpoint consistency questions
        viewpoint_questions = self._generate_viewpoint_questions(objects, relations)
        questions.extend(viewpoint_questions[:num_questions//3])

        return questions

    def _generate_spatial_questions(self, objects: List[Dict], relations: List[Dict]) -> List[GeneratedQuestion]:
        """Generate questions about spatial relationships"""
        questions = []

        for relation in relations[:3]:  # Use first few relations
            obj1_name = self._get_object_name(objects, relation["subject"])
            obj2_name = self._get_object_name(objects, relation["object"])

            if obj1_name and obj2_name:
                template = random.choice(self.question_templates[QuestionType.SPATIAL_RELATIONS])
                question = template.format(obj1=obj1_name, obj2=obj2_name)

                symbolic_program = f"""
                (define-fun is_{relation["type"]} ((x Real) (y Real) (z Real)) Bool
                  (and (= x {obj1_name}_x) (= y {obj1_name}_y) (= z {obj1_name}_z)
                       (= x {obj2_name}_x) (= y {obj2_name}_y) (= z {obj2_name}_z)))
                """

                questions.append(GeneratedQuestion(
                    question=question,
                    question_type=QuestionType.SPATIAL_RELATIONS,
                    target_answer=f"{obj1_name} is {relation['type'].replace('_', ' ')} {obj2_name}",
                    symbolic_program=symbolic_program,
                    required_views=[0, 1],  # Need multiple views to verify spatial relationships
                    reasoning_chain=[
                        f"Identify positions of {obj1_name} and {obj2_name}",
                        f"Determine spatial relationship: {relation['type']}",
                        "Verify consistency across viewpoints"
                    ]
                ))

        return questions

    def _generate_counting_questions(self, objects: List[Dict], relations: List[Dict]) -> List[GeneratedQuestion]:
        """Generate questions about object counting"""
        questions = []

        # Count objects by color
        color_counts = {}
        for obj in objects:
            color = obj.get("material", {}).get("color", "unknown")
            color_counts[color] = color_counts.get(color, 0) + 1

        for color, count in color_counts.items():
            if color != "unknown" and count > 1:
                question = f"How many {color} objects are in this scene?"
                symbolic_program = f"""
                (define-fun count_{color}_objects () Int
                  (count_{color} objects))
                """

                questions.append(GeneratedQuestion(
                    question=question,
                    question_type=QuestionType.OBJECT_COUNTING,
                    target_answer=str(count),
                    symbolic_program=symbolic_program,
                    required_views=[0],  # Single view sufficient for counting
                    reasoning_chain=[
                        f"Identify all objects with color: {color}",
                        f"Count distinct objects: {count}",
                        "Verify count is consistent across viewpoints"
                    ]
                ))

        return questions

    def _generate_viewpoint_questions(self, objects: List[Dict], relations: List[Dict]) -> List[GeneratedQuestion]:
        """Generate questions about viewpoint consistency"""
        questions = []

        if len(objects) >= 2:
            obj1 = objects[0]
            obj2 = objects[1]

            obj1_name = obj1.get("label", f"object_{obj1['id']}")
            obj2_name = obj2.get("label", f"object_{obj2['id']}")

            template = random.choice(self.question_templates[QuestionType.VIEWPOINT_CONSISTENCY])
            question = template.format(obj1=obj1_name, obj2=obj2_name)

            symbolic_program = f"""
            (define-fun viewpoint_consistent () Bool
              (forall ((view Int))
                (= (spatial_relation view {obj1['id']} {obj2['id']})
                   (spatial_relation 0 {obj1['id']} {obj2['id']}))))
            """

            questions.append(GeneratedQuestion(
                question=question,
                question_type=QuestionType.VIEWPOINT_CONSISTENCY,
                target_answer="The spatial relationships should remain consistent across different viewpoints",
                symbolic_program=symbolic_program,
                required_views=list(range(3)),  # Need multiple views for consistency check
                reasoning_chain=[
                    f"Examine {obj1_name} and {obj2_name} from multiple viewpoints",
                    "Compare spatial relationships across views",
                    "Verify relationship consistency"
                ]
            ))

        return questions

    def _get_object_name(self, objects: List[Dict], object_id: str) -> Optional[str]:
        """Get human-readable object name from object ID"""
        for obj in objects:
            if str(obj["id"]) == str(object_id):
                return obj.get("label", f"object_{obj['id']}")
        return None


def create_training_sample(scene_graph: Dict, constraints: Dict,
                          image_uris: List[str], camera_data: Dict,
                          questions: List[GeneratedQuestion]) -> Dict[str, Any]:
    """Create a complete training sample with questions and answers"""

    # Select the most diverse question for this training sample
    if questions:
        primary_question = random.choice(questions)
    else:
        # Fallback if no questions generated
        primary_question = GeneratedQuestion(
            question="Describe the spatial layout of objects in this scene.",
            question_type=QuestionType.SPATIAL_RELATIONS,
            target_answer="Objects are arranged in 3D space with defined spatial relationships.",
            symbolic_program="(define-fun describe_scene () String \"scene_description\")",
            required_views=[0],
            reasoning_chain=["Analyze object positions", "Identify spatial relationships"]
        )

    return {
        "world_id": scene_graph["world_id"],
        "question": primary_question.question,
        "images": image_uris,
        "cameras": camera_data,
        "program": primary_question.symbolic_program,
        "target_answer": primary_question.target_answer,
        "constraints": constraints,
        "scene_graph": scene_graph,
        "question_type": primary_question.question_type.value,
        "required_views": primary_question.required_views,
        "reasoning_chain": primary_question.reasoning_chain
    }


def main():
    """Example usage of the question generation system"""
    print("🧠 7L-Worlds Question Generation System")
    print("=" * 50)

    # Example scene graph
    example_scene = {
        "world_id": "test_world_123",
        "objects": [
            {"id": "1", "label": "red_chair", "material": {"color": "red"}},
            {"id": "2", "label": "blue_table", "material": {"color": "blue"}},
            {"id": "3", "label": "green_lamp", "material": {"color": "green"}}
        ],
        "relations": [
            {"type": "left_of", "subject": "1", "object": "2"},
            {"type": "above", "subject": "3", "object": "2"}
        ]
    }

    example_constraints = {
        "world_id": "test_world_123",
        "format": "smt-lib",
        "constraints": [
            {"description": "Chair should not intersect table", "statement": "(not (intersects chair table))"}
        ]
    }

    # Generate questions
    generator = QuestionGenerator()
    questions = generator.generate_questions_for_scene(example_scene, example_constraints, 5)

    print(f"Generated {len(questions)} questions for scene {example_scene['world_id']}:")
    print()

    for i, q in enumerate(questions, 1):
        print(f"{i}. {q.question}")
        print(f"   Type: {q.question_type.value}")
        print(f"   Answer: {q.target_answer}")
        print(f"   Required views: {q.required_views}")
        print()

    # Create training sample
    training_sample = create_training_sample(
        scene_graph=example_scene,
        constraints=example_constraints,
        image_uris=["gs://7l-data/renders/test_world_123/view_000.png"],
        camera_data={"view_000": {"pose": [[1,0,0,0], [0,1,0,0], [0,0,1,0], [0,0,0,1]]}},
        questions=questions
    )

    print("📋 Complete Training Sample Structure:")
    print(json.dumps({
        k: v for k, v in training_sample.items()
        if k not in ["scene_graph", "constraints"]  # Skip large objects for display
    }, indent=2))


if __name__ == "__main__":
    main()
