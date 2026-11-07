
# Default VPC Lookup
data "aws_vpc" "default" {
  default = true
}

# Default Subnets Lookup across all AZs
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group inside default VPC
resource "aws_security_group" "my_own_sg" {
  name        = "devops-project-sg"
  description = "Security Group for devops-project (SSH 22, Frontend 80, HTTPS 443, Backend 5000, Mongo-Express 8081)"
  vpc_id      = data.aws_vpc.default.id

  # Port 22: Remote SSH Administrative Access
  ingress {
    description = "SSH Administrative Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Port 80: Public Web Traffic (HTTP)
  ingress {
    description = "Frontend HTTP Public Access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Port 443: Secure HTTPS Encrypted Traffic
  ingress {
    description = "HTTPS Encrypted Web Access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Port 5000: Node.js Backend API Direct Access  its optional i only use for demo project
  # ingress {
  #   description = "Backend API Port"
  #   from_port   = 5000
  #   to_port     = 5000
  #   protocol    = "tcp"
  #   cidr_blocks = ["0.0.0.0/0"]
  # }

  # Port 8081: Mongo-Express Database Web GUI Dashboard
  ingress {
    description = "Mongo-Express GUI Dashboard"
    from_port   = 8081
    to_port     = 8081
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] // Only use MY IP in prod 
  }

  # Outbound: Full internet access
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "devops-project-sg"
  }
}
