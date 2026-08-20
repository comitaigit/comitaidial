output "instance_public_ip" {
  description = "Public IP of the EC2 instance — point both frontend_domain and api_domain's DNS A records here"
  value       = aws_eip.app.public_ip
}

output "frontend_domain" {
  value = local.frontend_domain
}

output "api_domain" {
  value = local.api_domain
}

output "instance_id" {
  value = aws_instance.app.id
}

output "ssh_command" {
  description = "SSH into the instance to run deploy.sh, check logs, or run certbot manually"
  value       = "ssh -i ~/.ssh/${var.ec2_key_name}.pem ec2-user@${aws_eip.app.public_ip}"
}

output "ecr_backend_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "db_endpoint" {
  description = "RDS Postgres endpoint (host:port) — only reachable from the EC2 instance, not the public internet"
  value       = aws_db_instance.main.endpoint
}

output "secret_prefix" {
  description = "Secrets Manager path prefix for this environment's backend secrets"
  value       = local.secret_prefix
}
