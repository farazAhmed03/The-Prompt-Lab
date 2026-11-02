# ==============================================================================
# AWS EC2 Infrastructure Definition & Server Bootstrap
# ==============================================================================

data "aws_ami" "ubuntu_24_04" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Single EC2 Instance: devops-project
resource "aws_instance" "devops_server" {
  ami                    = data.aws_ami.ubuntu_24_04.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.my_own_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  # Server Bootstrap Script (Embedded directly in main.tf)
  # Provisions:
  # 1. 2GB Swap Memory (Prevents OOM freeze on 1GB RAM instances)
  # 2. Essential system utilities (curl, git, ca-certificates, gnupg)
  # 3. Official Docker Engine & Docker Compose Plugin
  # 4. User permissions (Adds 'ubuntu' to the docker group)
  # NOTE: Zero application code here; application deployment is managed by CD pipeline.
  user_data = <<-EOF
              #!/bin/bash
              set -euo pipefail
              export DEBIAN_FRONTEND=noninteractive

              # 1. Setup 2GB Swap Memory
              if [ ! -f /swapfile ]; then
                  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
                  chmod 600 /swapfile
                  mkswap /swapfile
                  swapon /swapfile
                  echo '/swapfile none swap sw 0 0' >> /etc/fstab
                  sysctl vm.swappiness=10
                  echo 'vm.swappiness=10' >> /etc/sysctl.conf
              fi

              # 2. Install Essential Base Packages
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg lsb-release git

              # 3. Install Official Docker Engine & Docker Compose Plugin
              install -m 0755 -d /etc/apt/keyrings
              if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
                  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
                  chmod a+r /etc/apt/keyrings/docker.gpg
              fi

              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

              # 4. Enable Docker Service and Configure User Permissions
              systemctl enable docker
              systemctl start docker

              if id "ubuntu" &>/dev/null; then
                  usermod -aG docker ubuntu
              fi
              EOF

  tags = {
    Name = "devops-project"
  }
}
