#!/usr/bin/env python3
"""
AWS Deployment Script for Quantum Visualization System
Deploys to AWS with Braket quantum computing integration
"""

import boto3
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional

# AWS Configuration
AWS_REGION = "us-east-1"  # Braket is available in us-east-1, us-west-1, us-west-2, eu-west-2
STACK_NAME = "quantum-visualization-stack"
APP_NAME = "quantum-viz"
ACCOUNT_ID = "233720365644"  # User's AWS account ID

# Quantum Hardware Configuration
QUANTUM_DEVICES = {
    "ionq_aria": f"arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1",
    "ionq_forte": f"arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1",
    "rigetti_aspen": f"arn:aws:braket:us-west-1::device/qpu/rigetti/Aspen-M-3",
    "iqm_garnet": f"arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet",
    "quera_aquila": f"arn:aws:braket:us-east-1::device/qpu/quera/Aquila",
}

class QuantumVisualizationDeployer:
    def __init__(self, region: str = AWS_REGION):
        self.region = region
        self.session = boto3.Session(region_name=region)
        self.cloudformation = self.session.client('cloudformation')
        self.ecs = self.session.client('ecs')
        self.ec2 = self.session.client('ec2')
        self.iam = self.session.client('iam')
        self.braket = self.session.client('braket')
        
    def create_cloudformation_template(self) -> Dict:
        """Create CloudFormation template for quantum visualization infrastructure"""
        template = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Quantum Visualization System with Braket Integration",
            "Parameters": {
                "InstanceType": {
                    "Type": "String",
                    "Default": "t3.medium",
                    "Description": "EC2 instance type for the application"
                },
                "KeyName": {
                    "Type": "AWS::EC2::KeyPair::KeyName",
                    "Description": "EC2 Key Pair for SSH access"
                }
            },
            "Resources": {
                # VPC and Networking
                "VPC": {
                    "Type": "AWS::EC2::VPC",
                    "Properties": {
                        "CidrBlock": "10.0.0.0/16",
                        "EnableDnsHostnames": True,
                        "EnableDnsSupport": True,
                        "Tags": [{"Key": "Name", "Value": f"{APP_NAME}-vpc"}]
                    }
                },
                "PublicSubnet": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "CidrBlock": "10.0.1.0/24",
                        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
                        "MapPublicIpOnLaunch": True,
                        "Tags": [{"Key": "Name", "Value": f"{APP_NAME}-public-subnet"}]
                    }
                },
                "InternetGateway": {
                    "Type": "AWS::EC2::InternetGateway",
                    "Properties": {
                        "Tags": [{"Key": "Name", "Value": f"{APP_NAME}-igw"}]
                    }
                },
                "AttachGateway": {
                    "Type": "AWS::EC2::VPCGatewayAttachment",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "InternetGatewayId": {"Ref": "InternetGateway"}
                    }
                },
                "RouteTable": {
                    "Type": "AWS::EC2::RouteTable",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "Tags": [{"Key": "Name", "Value": f"{APP_NAME}-rt"}]
                    }
                },
                "Route": {
                    "Type": "AWS::EC2::Route",
                    "DependsOn": "AttachGateway",
                    "Properties": {
                        "RouteTableId": {"Ref": "RouteTable"},
                        "DestinationCidrBlock": "0.0.0.0/0",
                        "GatewayId": {"Ref": "InternetGateway"}
                    }
                },
                "SubnetRouteTableAssociation": {
                    "Type": "AWS::EC2::SubnetRouteTableAssociation",
                    "Properties": {
                        "SubnetId": {"Ref": "PublicSubnet"},
                        "RouteTableId": {"Ref": "RouteTable"}
                    }
                },
                
                # Security Groups
                "SecurityGroup": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "GroupDescription": "Security group for Quantum Visualization",
                        "VpcId": {"Ref": "VPC"},
                        "SecurityGroupIngress": [
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 22,
                                "ToPort": 22,
                                "CidrIp": "0.0.0.0/0"
                            },
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 8050,
                                "ToPort": 8050,
                                "CidrIp": "0.0.0.0/0"
                            },
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 5555,
                                "ToPort": 5556,
                                "CidrIp": "10.0.0.0/16"
                            }
                        ],
                        "Tags": [{"Key": "Name", "Value": f"{APP_NAME}-sg"}]
                    }
                },
                
                # IAM Role for Braket Access
                "BraketExecutionRole": {
                    "Type": "AWS::IAM::Role",
                    "Properties": {
                        "AssumeRolePolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": {"Service": "ec2.amazonaws.com"},
                                    "Action": "sts:AssumeRole"
                                }
                            ]
                        },
                        "ManagedPolicyArns": [
                            "arn:aws:iam::aws:policy/AmazonBraketFullAccess",
                            "arn:aws:iam::aws:policy/AmazonS3FullAccess"
                        ],
                        "Policies": [
                            {
                                "PolicyName": "QuantumVisualizationPolicy",
                                "PolicyDocument": {
                                    "Version": "2012-10-17",
                                    "Statement": [
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "braket:*",
                                                "s3:GetObject",
                                                "s3:PutObject",
                                                "s3:ListBucket",
                                                "logs:CreateLogGroup",
                                                "logs:CreateLogStream",
                                                "logs:PutLogEvents"
                                            ],
                                            "Resource": "*"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                "InstanceProfile": {
                    "Type": "AWS::IAM::InstanceProfile",
                    "Properties": {
                        "Roles": [{"Ref": "BraketExecutionRole"}]
                    }
                },
                
                # EC2 Instance
                "QuantumVisualizationInstance": {
                    "Type": "AWS::EC2::Instance",
                    "Properties": {
                        "ImageId": "ami-0c7217cdde317cfec",  # Amazon Linux 2023
                        "InstanceType": {"Ref": "InstanceType"},
                        "KeyName": {"Ref": "KeyName"},
                        "SubnetId": {"Ref": "PublicSubnet"},
                        "SecurityGroupIds": [{"Ref": "SecurityGroup"}],
                        "IamInstanceProfile": {"Ref": "InstanceProfile"},
                        "UserData": {
                            "Fn::Base64": {
                                "Fn::Join": [
                                    "",
                                    [
                                        "#!/bin/bash\n",
                                        "yum update -y\n",
                                        "yum install -y git python3 python3-pip docker\n",
                                        "systemctl start docker\n",
                                        "systemctl enable docker\n",
                                        "usermod -a -G docker ec2-user\n",
                                        "pip3 install poetry\n",
                                        "cd /home/ec2-user\n",
                                        "git clone https://github.com/your-repo/quantum-visualizations.git\n",
                                        "cd quantum-visualizations\n",
                                        "poetry install\n",
                                        "# Start the services\n",
                                        "poetry run python -m src.quantum_visualization.realtime_service &\n",
                                        "poetry run python app.py &\n"
                                    ]
                                ]
                            }
                        },
                        "Tags": [{"Key": "Name", "Value": f"{APP_NAME}-instance"}]
                    }
                }
            },
            "Outputs": {
                "InstanceId": {
                    "Description": "Instance ID of the quantum visualization server",
                    "Value": {"Ref": "QuantumVisualizationInstance"}
                },
                "PublicIp": {
                    "Description": "Public IP address of the quantum visualization server",
                    "Value": {"Fn::GetAtt": ["QuantumVisualizationInstance", "PublicIp"]}
                },
                "DashboardUrl": {
                    "Description": "URL to access the quantum visualization dashboard",
                    "Value": {
                        "Fn::Join": [
                            "",
                            [
                                "http://",
                                {"Fn::GetAtt": ["QuantumVisualizationInstance", "PublicIp"]},
                                ":8050"
                            ]
                        ]
                    }
                }
            }
        }
        return template
    
    def deploy_stack(self, key_name: str, instance_type: str = "t3.medium") -> str:
        """Deploy the CloudFormation stack"""
        template = self.create_cloudformation_template()
        
        try:
            response = self.cloudformation.create_stack(
                StackName=STACK_NAME,
                TemplateBody=json.dumps(template),
                Parameters=[
                    {"ParameterKey": "KeyName", "ParameterValue": key_name},
                    {"ParameterKey": "InstanceType", "ParameterValue": instance_type}
                ],
                Capabilities=["CAPABILITY_IAM"]
            )
            
            print(f"✅ Stack creation initiated: {response['StackId']}")
            return response['StackId']
            
        except Exception as e:
            print(f"❌ Error creating stack: {e}")
            raise
    
    def get_available_quantum_devices(self) -> List[Dict]:
        """Get list of available quantum devices on Braket"""
        try:
            # Try to search for devices with minimal filters
            response = self.braket.search_devices(
                filters=[]  # No filters to get all devices
            )
            
            devices = []
            for device in response.get('devices', []):
                devices.append({
                    'name': device.get('deviceName', 'Unknown'),
                    'arn': device.get('deviceArn', ''),
                    'provider': device.get('providerName', 'Unknown'),
                    'type': device.get('deviceType', 'Unknown'),
                    'status': device.get('deviceStatus', 'Unknown')
                })
            
            return devices
            
        except Exception as e:
            print(f"⚠️  Note: Cannot query Braket devices (this is normal for new accounts): {e}")
            print("   Quantum simulators will still be available locally.")
            # Return default simulators that are always available
            return [
                {
                    'name': 'Local Simulator',
                    'arn': 'local://simulator',
                    'provider': 'AWS Braket',
                    'type': 'SIMULATOR',
                    'status': 'AVAILABLE'
                }
            ]
    
    def create_braket_s3_bucket(self) -> str:
        """Create S3 bucket for Braket results"""
        bucket_name = f"quantum-viz-braket-{self.region}-{os.urandom(4).hex()}"
        
        try:
            s3 = self.session.client('s3')
            
            if self.region == 'us-east-1':
                s3.create_bucket(Bucket=bucket_name)
            else:
                s3.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': self.region}
                )
            
            print(f"✅ Created S3 bucket: {bucket_name}")
            return bucket_name
            
        except Exception as e:
            print(f"❌ Error creating S3 bucket: {e}")
            raise
    
    def wait_for_stack_completion(self, stack_id: str):
        """Wait for stack creation to complete"""
        waiter = self.cloudformation.get_waiter('stack_create_complete')
        
        print("⏳ Waiting for stack creation to complete...")
        try:
            waiter.wait(StackName=stack_id)
            print("✅ Stack creation completed successfully!")
            
            # Get stack outputs
            response = self.cloudformation.describe_stacks(StackName=stack_id)
            stack = response['Stacks'][0]
            
            print("\n🎯 Deployment Information:")
            for output in stack.get('Outputs', []):
                print(f"  {output['Description']}: {output['OutputValue']}")
                
        except Exception as e:
            print(f"❌ Stack creation failed: {e}")
            raise


def main():
    """Main deployment function"""
    if len(sys.argv) < 2:
        print("Usage: python aws_deploy.py <ec2-key-pair-name> [instance-type]")
        print("Example: python aws_deploy.py my-key-pair t3.medium")
        sys.exit(1)
    
    key_name = sys.argv[1]
    instance_type = sys.argv[2] if len(sys.argv) > 2 else "t3.medium"
    
    deployer = QuantumVisualizationDeployer()
    
    print("🚀 Starting AWS Quantum Visualization Deployment")
    print(f"   Region: {AWS_REGION}")
    print(f"   Key Pair: {key_name}")
    print(f"   Instance Type: {instance_type}")
    
    # Check available quantum devices
    print("\n🔬 Checking available quantum devices...")
    devices = deployer.get_available_quantum_devices()
    if devices:
        print("Available quantum devices:")
        for device in devices:
            print(f"  - {device['name']} ({device['provider']}) - {device['status']}")
    else:
        print("  No quantum devices currently available")
    
    # Create S3 bucket for Braket
    print("\n📦 Creating S3 bucket for Braket results...")
    bucket_name = deployer.create_braket_s3_bucket()
    
    # Deploy the stack
    print("\n☁️  Deploying CloudFormation stack...")
    stack_id = deployer.deploy_stack(key_name, instance_type)
    
    # Wait for completion
    deployer.wait_for_stack_completion(stack_id)
    
    print(f"\n✅ Deployment completed successfully!")
    print(f"   S3 Bucket: {bucket_name}")
    print(f"   Stack ID: {stack_id}")
    print("\n🎉 Your quantum visualization system is now running on AWS!")


if __name__ == "__main__":
    main() 