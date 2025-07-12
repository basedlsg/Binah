#!/usr/bin/env python3
"""
Simple AWS Deployment for Quantum Visualization System
Direct EC2 deployment without CloudFormation
"""

import boto3
import time
import sys
import base64
from typing import Dict, List

# Configuration
AWS_REGION = "us-west-2"
ACCOUNT_ID = "233720365644"
INSTANCE_TYPE = "t3.medium"
KEY_NAME = "quantum-viz-key"

class SimpleQuantumDeployer:
    def __init__(self):
        self.ec2 = boto3.client('ec2', region_name=AWS_REGION)
        self.session = boto3.Session(region_name=AWS_REGION)
        
    def get_latest_amazon_linux_ami(self) -> str:
        """Get the latest Amazon Linux 2023 AMI"""
        response = self.ec2.describe_images(
            Owners=['amazon'],
            Filters=[
                {'Name': 'name', 'Values': ['al2023-ami-*-x86_64']},
                {'Name': 'state', 'Values': ['available']},
                {'Name': 'architecture', 'Values': ['x86_64']},
            ]
        )
        
        # Sort by creation date and get the latest
        images = sorted(response['Images'], key=lambda x: x['CreationDate'], reverse=True)
        return images[0]['ImageId']
    
    def create_security_group(self) -> str:
        """Create security group for quantum visualization"""
        try:
            # Check if security group already exists
            try:
                response = self.ec2.describe_security_groups(
                    GroupNames=['quantum-viz-sg']
                )
                sg_id = response['SecurityGroups'][0]['GroupId']
                print(f"✅ Using existing security group: {sg_id}")
                return sg_id
            except:
                pass
            
            # Create new security group
            response = self.ec2.create_security_group(
                GroupName='quantum-viz-sg',
                Description='Security group for Quantum Visualization System'
            )
            sg_id = response['GroupId']
            
            # Add inbound rules
            self.ec2.authorize_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 22,
                        'ToPort': 22,
                        'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'SSH access'}]
                    },
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 8050,
                        'ToPort': 8050,
                        'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'Dash web app'}]
                    }
                ]
            )
            
            print(f"✅ Created security group: {sg_id}")
            return sg_id
            
        except Exception as e:
            print(f"❌ Error creating security group: {e}")
            raise
    
    def create_iam_role(self) -> str:
        """Create IAM role for Braket access"""
        iam = boto3.client('iam')
        role_name = 'QuantumVisualizationRole'
        
        try:
            # Check if role exists
            try:
                response = iam.get_role(RoleName=role_name)
                print(f"✅ Using existing IAM role: {role_name}")
                return role_name
            except iam.exceptions.NoSuchEntityException:
                pass
            
            # Create role
            trust_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            
            iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=str(trust_policy).replace("'", '"'),
                Description='Role for Quantum Visualization with Braket access'
            )
            
            # Attach policies
            policies = [
                'arn:aws:iam::aws:policy/AmazonBraketFullAccess',
                'arn:aws:iam::aws:policy/AmazonS3FullAccess'
            ]
            
            for policy in policies:
                iam.attach_role_policy(RoleName=role_name, PolicyArn=policy)
            
            # Create instance profile
            try:
                iam.create_instance_profile(InstanceProfileName=role_name)
                iam.add_role_to_instance_profile(
                    InstanceProfileName=role_name,
                    RoleName=role_name
                )
            except:
                pass  # May already exist
            
            print(f"✅ Created IAM role: {role_name}")
            return role_name
            
        except Exception as e:
            print(f"❌ Error creating IAM role: {e}")
            return None
    
    def create_user_data_script(self) -> str:
        """Create user data script for instance initialization"""
        script = f'''#!/bin/bash
set -e

# Update system
yum update -y

# Install dependencies
yum install -y git python3 python3-pip

# Install poetry
curl -sSL https://install.python-poetry.org | python3 -
export PATH="/root/.local/bin:$PATH"

# Clone repository (you'll need to replace this with your actual repo)
cd /home/ec2-user
# For now, we'll create the files directly
mkdir -p /home/ec2-user/quantum-visualizations
cd /home/ec2-user/quantum-visualizations

# Create a simple startup script
cat > start_quantum_viz.sh << 'EOL'
#!/bin/bash
cd /home/ec2-user/quantum-visualizations
echo "Quantum Visualization System starting on AWS!"
echo "Visit http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8050"
python3 -m http.server 8050
EOL

chmod +x start_quantum_viz.sh

# Start the service
./start_quantum_viz.sh > /var/log/quantum-viz.log 2>&1 &

# Create status file
echo "Quantum Visualization System deployed successfully!" > /home/ec2-user/deployment-status.txt
echo "Time: $(date)" >> /home/ec2-user/deployment-status.txt
echo "Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)" >> /home/ec2-user/deployment-status.txt
'''
        return base64.b64encode(script.encode()).decode()
    
    def launch_instance(self) -> Dict:
        """Launch EC2 instance"""
        try:
            # Get AMI ID
            ami_id = self.get_latest_amazon_linux_ami()
            print(f"📀 Using AMI: {ami_id}")
            
            # Create security group
            sg_id = self.create_security_group()
            
            # Create IAM role
            role_name = self.create_iam_role()
            
            # Wait for instance profile to be ready
            if role_name:
                print("⏳ Waiting for IAM role to propagate...")
                time.sleep(10)
            
            # Create user data
            user_data = self.create_user_data_script()
            
            # Launch instance
            launch_params = {
                'ImageId': ami_id,
                'MinCount': 1,
                'MaxCount': 1,
                'InstanceType': INSTANCE_TYPE,
                'KeyName': KEY_NAME,
                'SecurityGroupIds': [sg_id],
                'UserData': user_data,
                'TagSpecifications': [
                    {
                        'ResourceType': 'instance',
                        'Tags': [
                            {'Key': 'Name', 'Value': 'Quantum-Visualization-System'},
                            {'Key': 'Project', 'Value': 'QuantumViz'},
                            {'Key': 'Environment', 'Value': 'Production'}
                        ]
                    }
                ]
            }
            
            # Add IAM instance profile if available
            if role_name:
                launch_params['IamInstanceProfile'] = {'Name': role_name}
            
            response = self.ec2.run_instances(**launch_params)
            instance_id = response['Instances'][0]['InstanceId']
            
            print(f"🚀 Launched instance: {instance_id}")
            return {
                'instance_id': instance_id,
                'security_group_id': sg_id,
                'iam_role': role_name
            }
            
        except Exception as e:
            print(f"❌ Error launching instance: {e}")
            raise
    
    def wait_for_instance(self, instance_id: str) -> str:
        """Wait for instance to be running and get public IP"""
        print("⏳ Waiting for instance to start...")
        
        waiter = self.ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        
        # Get instance details
        response = self.ec2.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        public_ip = instance.get('PublicIpAddress')
        
        print(f"✅ Instance is running!")
        print(f"📍 Public IP: {public_ip}")
        
        return public_ip
    
    def deploy(self) -> Dict:
        """Main deployment function"""
        print("🚀 Starting Simple AWS Quantum Visualization Deployment")
        print(f"   Region: {AWS_REGION}")
        print(f"   Account: {ACCOUNT_ID}")
        print(f"   Instance Type: {INSTANCE_TYPE}")
        
        # Launch instance
        result = self.launch_instance()
        
        # Wait for it to be ready
        public_ip = self.wait_for_instance(result['instance_id'])
        
        result['public_ip'] = public_ip
        result['dashboard_url'] = f"http://{public_ip}:8050"
        
        return result

def main():
    deployer = SimpleQuantumDeployer()
    
    try:
        result = deployer.deploy()
        
        print("\n🎉 Deployment Completed Successfully!")
        print(f"   Instance ID: {result['instance_id']}")
        print(f"   Public IP: {result['public_ip']}")
        print(f"   Dashboard URL: {result['dashboard_url']}")
        print(f"   Security Group: {result['security_group_id']}")
        print(f"   IAM Role: {result['iam_role']}")
        
        print("\n📋 Next Steps:")
        print("1. Wait 2-3 minutes for the application to start")
        print(f"2. Visit: {result['dashboard_url']}")
        print(f"3. SSH access: ssh -i quantum-viz-key.pem ec2-user@{result['public_ip']}")
        print("4. Check logs: tail -f /var/log/quantum-viz.log")
        
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 