# ==============================================================================
# Terraform Infrastructure Outputs
# ==============================================================================

output "server_public_ip" {
  description = "Public IP address of the provisioned devops-project EC2 Server"
  value       = aws_instance.devops_server.public_ip
}

output "ssh_command" {
  description = "SSH convenience command to connect to the EC2 server"
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_instance.devops_server.public_ip}"
}

output "frontend_url" {
  description = "Public HTTP URL for the React/Nginx Frontend (IP Based)"
  value       = "http://${aws_instance.devops_server.public_ip}"
}

output "mongo_express_url" {
  description = "Public HTTP URL for the Mongo-Express Administrative Dashboard"
  value       = "http://${aws_instance.devops_server.public_ip}:8081"
}

output "custom_domain_url" {
  description = "Live Custom Domain URL (Route 53)"
  value       = "http://${var.domain_name}"
}

output "route53_nameservers" {
  description = "AWS Route 53 Assigned Name Servers (Copy these to your domain registrar settings)"
  value       = aws_route53_zone.primary.name_servers
}
