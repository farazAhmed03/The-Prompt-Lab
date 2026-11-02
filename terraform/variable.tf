# ==============================================================================
# Terraform Input Variables Definition
# ==============================================================================

variable "aws_region" {
  description = "The AWS region to create resources in."
  type        = string
}

variable "key_name" {
  description = "The name of the key pair to use for EC2 instances."
  type        = string
}

variable "instance_type" {
  description = "EC2 Instance type (Free Tier eligible: t2.micro or t3.micro)"
  type        = string
  default     = "t3.micro"
}
