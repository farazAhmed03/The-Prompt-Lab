
output "main_server_public_ip" {
  description = "Public IP address of the permanent On-Demand Main Server"
  value       = aws_instance.devops_server.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the Main Server"
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_instance.devops_server.public_ip}"
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS Name"
  value       = aws_lb.main_alb.dns_name
}

output "live_https_url" {
  description = "Production HTTPS URL with valid ACM SSL Certificate"
  value       = "https://${var.domain_name}"
}

output "api_status_url" {
  description = "Direct Load Balancer Health Check & API Status Endpoint"
  value       = "https://${var.domain_name}/api/status"
}

output "target_group_arn" {
  description = "HTTPS Target Group ARN"
  value       = aws_lb_target_group.main_tg.arn
}

output "asg_name" {
  description = "Auto Scaling Group Name"
  value       = aws_autoscaling_group.spot_asg.name
}

output "acm_certificate_arn" {
  description = "Validated ACM SSL Certificate ARN"
  value       = aws_acm_certificate_validation.cert_validation.certificate_arn
}
