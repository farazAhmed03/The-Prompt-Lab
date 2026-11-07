
# Permanent Protected On-Demand Main Server
resource "aws_instance" "devops_server" {
  ami                    = var.golden_ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.my_own_sg.id]

  # Protected from accidental deletion (Cannot be deleted by ASG or API calls)
  disable_api_termination = true

  # 1-Minute Detailed CloudWatch Monitoring for High/Low CPU Alarms
  monitoring = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name        = "devops-project-main-server"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
