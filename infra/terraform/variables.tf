variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "sa-east-1"
}

variable "project_name" {
  description = "Short name used to prefix/tag all resources"
  type        = string
  default     = "comitai"
}

# --- Networking --------------------------------------------------------------

# One VPC CIDR per Terraform workspace, so dev and prod never overlap (in
# case they're ever peered, or just to keep route tables unambiguous when
# debugging with both open side by side). Add an entry here for any new
# workspace beyond dev/prod.
variable "vpc_cidr_by_env" {
  description = "VPC CIDR block, keyed by environment (terraform.workspace)"
  type        = map(string)
  default = {
    dev  = "10.10.0.0/16"
    prod = "10.20.0.0/16"
  }
}

variable "az_count" {
  description = "Number of availability zones to spread subnets across"
  type        = number
  default     = 2
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH into the EC2 instance. Defaults to open (0.0.0.0/0) — narrow this to your actual IP (\"x.x.x.x/32\") once known, same as you'd want for fechou-backend."
  type        = string
  default     = "0.0.0.0/0"
}

# --- Database ------------------------------------------------------------------

variable "db_name" {
  description = "Postgres database name"
  type        = string
  default     = "comitai"
}

variable "db_username" {
  description = "Postgres master username"
  type        = string
  default     = "comitai"
}

variable "db_instance_class_by_env" {
  description = "RDS instance class, keyed by environment (terraform.workspace)"
  type        = map(string)
  default = {
    dev  = "db.t4g.micro"
    prod = "db.t4g.micro"
  }
}

variable "db_allocated_storage_by_env" {
  description = "RDS allocated storage in GB, keyed by environment"
  type        = map(number)
  default = {
    dev  = 20
    prod = 20
  }
}

# --- EC2 -----------------------------------------------------------------------

# Graviton (arm64) — same family Fechai runs on: cheaper than the x86
# equivalent for the same performance. Docker images must be built with
# --platform linux/arm64 to match (see infra/terraform/README.md).
variable "ec2_instance_type_by_env" {
  description = "EC2 instance type, keyed by environment (must be an arm64/Graviton type)"
  type        = map(string)
  default = {
    dev  = "t4g.small"
    prod = "t4g.small"
  }
}

variable "ec2_key_name" {
  description = <<-EOT
    Name of an existing EC2 key pair (create via `aws ec2 create-key-pair` or
    the console) used for SSH access — same pattern as fechou-ec2-key. Must
    already exist in this account/region before applying.
  EOT
  type        = string
}

variable "ec2_volume_size_gb" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 30
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy for the backend service"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Docker image tag to deploy for the frontend service"
  type        = string
  default     = "latest"
}

# --- TLS / domains ---------------------------------------------------------------
#
# Frontend and API live on sibling subdomains of comitai.app, one pair per
# environment:
#   prod: comitai.app          / api.comitai.app
#   dev:  dev.comitai.app      / dev.api.comitai.app
# Nginx on the instance routes by server_name (vhost), not by path — see
# templates/user_data.sh.tftpl. Both defaults below derive from
# terraform.workspace so you don't have to repeat them per environment;
# override only if you want something other than this convention.

variable "frontend_domain_by_env" {
  description = "Frontend domain, keyed by environment"
  type        = map(string)
  default = {
    dev  = "dev.comitai.app"
    prod = "comitai.app"
  }
}

variable "api_domain_by_env" {
  description = "API (backend) domain, keyed by environment"
  type        = map(string)
  default = {
    dev  = "dev.api.comitai.app"
    prod = "api.comitai.app"
  }
}

variable "enable_https" {
  description = <<-EOT
    Whether Nginx should request Let's Encrypt certificates via certbot for
    both domains. Leave false until both DNS records (frontend + api) are
    actually pointed at this instance's Elastic IP — certbot fails if they
    don't resolve yet. Flip to true and re-apply (or SSH in and run certbot
    manually) once DNS is live.
  EOT
  type        = bool
  default     = false
}

variable "cookie_secure" {
  description = <<-EOT
    Overrides the backend's refresh-cookie Secure flag. Defaults to "true"
    only when enable_https is true; otherwise "false", since a Secure
    cookie is silently dropped by browsers over plain HTTP. Override
    explicitly only if you know what you're doing.
  EOT
  type        = string
  default     = null
}

variable "cookie_domain" {
  description = <<-EOT
    Overrides the backend's refresh-cookie Domain attribute. Defaults to
    ".comitai.app" so the cookie is shared between the frontend and API
    subdomains of the same environment (e.g. dev.comitai.app and
    dev.api.comitai.app both fall under .comitai.app). Only override if you
    move off this domain entirely.
  EOT
  type        = string
  default     = ".comitai.app"
}

# --- Secrets ---------------------------------------------------------------------
#
# Unlike the ECS version of this config, secrets are NOT passed as Terraform
# variables — they live in AWS Secrets Manager under comitai/backend/<NAME>,
# matching Fechai's pattern, and are fetched by deploy.sh on the instance at
# deploy time (see ec2.tf's user_data and README.md). Terraform only creates
# the (empty) secret entries; you fill in real values via the CLI or console
# after the first apply, same as Fechai's fechou/backend/<NAME> secrets.
