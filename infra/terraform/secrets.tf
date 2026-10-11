# Secrets Manager entries, one per config value the backend needs at
# runtime — mirrors Fechai's fechou/backend/<NAME> pattern, just with the
# comitai/ prefix. Terraform creates the entries (and fills in what it can
# generate itself: the DB password and JWT secrets), but you should rotate
# the JWT secrets independently per environment if you ever hand-edit them.
#
# deploy.sh on the EC2 instance (see ec2.tf's user_data / README.md) reads
# these by name and writes them into /home/ec2-user/app.env before starting
# the containers — nothing here is baked into the Docker image.

locals {
  secret_prefix = "comitai/${local.environment}/backend"
}

resource "random_password" "jwt_access_secret" {
  length  = 64
  special = false
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "database_url" {
  name = "${local.secret_prefix}/DATABASE_URL"
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  # sslmode=no-verify: RDS enforces TLS by default (rejects plaintext
  # connections with "no pg_hba.conf entry ... no encryption", discovered
  # deploying against the real instance), but its certificate isn't from a
  # CA the pg driver trusts out of the box. no-verify keeps the connection
  # encrypted without validating that chain — acceptable here since the RDS
  # endpoint is only reachable from inside the VPC in the first place.
  secret_string = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.main.address}:5432/${var.db_name}?schema=public&sslmode=no-verify"
}

resource "aws_secretsmanager_secret" "jwt_access_secret" {
  name = "${local.secret_prefix}/JWT_ACCESS_SECRET"
}

resource "aws_secretsmanager_secret_version" "jwt_access_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_access_secret.id
  secret_string = random_password.jwt_access_secret.result
}

resource "aws_secretsmanager_secret" "jwt_refresh_secret" {
  name = "${local.secret_prefix}/JWT_REFRESH_SECRET"
}

resource "aws_secretsmanager_secret_version" "jwt_refresh_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_refresh_secret.id
  secret_string = random_password.jwt_refresh_secret.result
}

# --- Application secrets beyond the DB/JWT trio ------------------------------
#
# The backend refuses to boot without these (see
# apps/backend/src/config/env.validation.ts), and deploy.sh reads every one
# of them from Secrets Manager. Two kinds:
#
# 1. Generated here: TOKEN_ENCRYPTION_KEY (AES-256-GCM key, 32 bytes hex)
#    encrypts each BDR's Gmail refresh token at rest. DON'T rotate it on a
#    database that already holds connected Gmail accounts — those tokens
#    become unreadable and every BDR has to reconnect Gmail.
# 2. Created EMPTY here, filled in by hand after the first apply — the values
#    come from third-party consoles (Twilio, Anthropic, Deepgram, Google
#    Cloud, Lusha), see apps/backend/.env.example for where to find each one.
#    deploy.sh stops with a clear message while any of them is still empty.

resource "random_id" "token_encryption_key" {
  byte_length = 32
}

resource "aws_secretsmanager_secret" "token_encryption_key" {
  name = "${local.secret_prefix}/TOKEN_ENCRYPTION_KEY"
}

resource "aws_secretsmanager_secret_version" "token_encryption_key" {
  secret_id     = aws_secretsmanager_secret.token_encryption_key.id
  secret_string = random_id.token_encryption_key.hex
}

locals {
  manual_secret_names = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "TWILIO_API_KEY_SID",
    "TWILIO_API_KEY_SECRET",
    "TWILIO_TWIML_APP_SID",
    "ANTHROPIC_API_KEY",
    "DEEPGRAM_API_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "LUSHA_API_KEY",
  ]
}

resource "aws_secretsmanager_secret" "manual" {
  for_each    = toset(local.manual_secret_names)
  name        = "${local.secret_prefix}/${each.key}"
  description = "Set by hand after the first apply — see infra/terraform/README.md"
}
