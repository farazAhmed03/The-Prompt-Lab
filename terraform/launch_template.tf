# ==============================================================================
# EC2 Launch Template (Spot Instances from Golden AMI)
# ==============================================================================

resource "aws_launch_template" "spot_lt" {
  name          = "devops-project-lt"
  image_id      = var.golden_ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.my_own_sg.id]

  # Provision only cheap Spot instances for burst scaling
  instance_market_options {
    market_type = "spot"
  }

  monitoring {
    enabled = true
  }

  block_device_mappings {
    device_name = "/dev/sda1"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name        = "devops-project-spot-worker"
      Environment = "production"
      Role        = "AutoScaling-Burst-Worker"
    }
  }

  tags = {
    Name = "devops-project-lt"
  }
}

