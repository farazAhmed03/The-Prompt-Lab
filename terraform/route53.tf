
# Route 53 Public Hosted Zone for the domain
resource "aws_route53_zone" "primary" {
  name          = var.domain_name
  comment       = "Managed by Terraform for PromptVerse High-Availability Cluster"
  force_destroy = false

  tags = {
    Name        = "devops-project-zone"
    Project     = "The-Prompt-Lab"
    Environment = "production"
  }
}

# Apex A-Record (devops-project-demo.study) -> ALB Alias
resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main_alb.dns_name
    zone_id                = aws_lb.main_alb.zone_id
    evaluate_target_health = true
  }
}

# Subdomain A-Record (www.devops-project-demo.study) -> ALB Alias
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main_alb.dns_name
    zone_id                = aws_lb.main_alb.zone_id
    evaluate_target_health = true
  }
}
