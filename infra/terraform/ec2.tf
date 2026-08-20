# Single EC2 instance running both containers (backend + frontend) behind
# Nginx, mirroring how fechou-backend is deployed — Docker + Nginx on the
# instance itself, no ALB/ECS. Graviton (arm64) for the same reason Fechai
# uses it: cheaper per unit of compute than the x86 equivalent.

data "aws_ami" "al2023_arm64" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

# --- IAM: what the instance itself is allowed to do (pull from ECR, read
# secrets) — mirrors fechou-ec2-instance-role. -------------------------------

resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ecr_readonly" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Scoped to just this environment's own secrets — not every secret in the
# account.
resource "aws_iam_role_policy" "ec2_secrets_read" {
  name = "${local.name_prefix}-secrets-read"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.secret_prefix}/*"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-instance-profile"
  role = aws_iam_role.ec2.name
}

data "aws_caller_identity" "current" {}

# --- Elastic IP, reserved before the instance so its address is known up
# front (used as the CORS fallback origin in user_data below when no domain
# is set yet). -----------------------------------------------------------------

resource "aws_eip" "app" {
  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-app-eip"
  }
}

# --- Instance ------------------------------------------------------------------

resource "aws_instance" "app" {
  ami                    = data.aws_ami.al2023_arm64.id
  instance_type          = local.ec2_instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  key_name               = var.ec2_key_name

  root_block_device {
    volume_size = var.ec2_volume_size_gb
    volume_type = "gp3"
  }

  # Installs Docker + Nginx + certbot, writes /home/ec2-user/deploy.sh, and
  # runs it once on first boot. Re-running deploy.sh by hand (over SSH) is
  # how you ship new image tags afterwards — see README.md.
  user_data = templatefile("${path.module}/templates/user_data.sh.tftpl", {
    aws_region            = var.aws_region
    ecr_backend_repo_url  = aws_ecr_repository.backend.repository_url
    ecr_frontend_repo_url = aws_ecr_repository.frontend.repository_url
    secret_prefix         = local.secret_prefix
    backend_image_tag     = var.backend_image_tag
    frontend_image_tag    = var.frontend_image_tag
    frontend_domain       = local.frontend_domain
    api_domain            = local.api_domain
    enable_https          = var.enable_https
    cookie_secure         = coalesce(var.cookie_secure, var.enable_https ? "true" : "false")
    cookie_domain         = var.cookie_domain
    scheme                = var.enable_https ? "https" : "http"
    # CORS must be exact origins (credentials:true forbids a wildcard) —
    # scheme flips to https once enable_https is on. In dev only, also allow
    # localhost:3000 so a frontend running locally (e.g. `pnpm dev` on
    # someone's laptop) can call the dev API — never added in prod.
    cors_origins = join(",", compact([
      "${var.enable_https ? "https" : "http"}://${local.frontend_domain}",
      local.environment == "dev" ? "http://localhost:3000" : "",
    ]))
  })

  # Changing user_data alone doesn't re-run it on an existing instance — see
  # README.md's "deploy new code" section for the actual redeploy flow
  # (SSH in, re-run deploy.sh). user_data only matters for a fresh instance.
  tags = {
    Name = "${local.name_prefix}-app"
  }
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}
