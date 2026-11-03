# ==============================================================================
# AWS Route 53 DNS Configuration (Dedicated File)
# ==============================================================================

# 1. Create Route 53 Public Hosted Zone for the domain
resource "aws_route53_zone" "primary" {
  name          = var.domain_name
  comment       = "Managed by Terraform for PromptVerse / The-Prompt-Lab"
  force_destroy = false

  tags = {
    Name        = "devops-project-zone"
    Project     = "The-Prompt-Lab"
    Environment = "production"
  }
}

# 2. Apex A Record: devops-project-demo.study -> EC2 Public IP
resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_instance.devops_server.public_ip]
}

# 3. Subdomain A Record: www.devops-project-demo.study -> EC2 Public IP
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"
  ttl     = 300
  records = [aws_instance.devops_server.public_ip]
}

