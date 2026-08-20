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
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.main.address}:5432/${var.db_name}?schema=public"
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
