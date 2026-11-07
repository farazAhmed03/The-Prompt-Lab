# ==============================================================================
# Terraform Input Variables Definition
# ==============================================================================

variable "aws_region" {
  description = "The AWS region to create resources in."
  type        = string
  default     = "us-east-1"
}

variable "key_name" {
  description = "The name of the key pair to use for EC2 instances."
  type        = string
  default     = "faraz"
}

variable "instance_type" {
  description = "EC2 Instance type (Free Tier eligible: t2.micro or t3.micro)"
  type        = string
  default     = "t3.micro"
}

variable "domain_name" {
  description = "Custom domain name for Route 53 DNS routing"
  type        = string
  default     = "devops-project-demo.study"
}

variable "golden_ami_id" {
  description = "Golden AMI containing pre-configured PromptVerse Docker containers"
  type        = string
  default     = "ami-031e70f1ea741dc87"
}

variable "sns_topic_arn" {
  description = "SNS Topic ARN for CloudWatch Alarm notifications"
  type        = string
  default     = "arn:aws:sns:us-east-1:244924579304:Devops-project-alarm"
}
