# Generated once and stored in Secrets Manager (see secrets.tf) — nobody
# needs to type or pass this password anywhere; deploy.sh reads it from
# Secrets Manager on the instance, same as Fechai's pattern.
resource "random_password" "db" {
  length  = 32
  special = false # keep it simple to embed in a DATABASE_URL without escaping
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${local.name_prefix}-db-subnets"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-postgres"
  engine         = "postgres"
  engine_version = "17"

  instance_class    = local.db_instance_class
  allocated_storage = local.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Single instance, no read replica, no Multi-AZ — matches the current dev
  # setup. Turn on multi_az and bump the instance class if this needs to
  # survive an AZ outage later.
  multi_az = false

  backup_retention_period   = 7
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name_prefix}-postgres-final"
  deletion_protection       = true

  tags = {
    Name = "${local.name_prefix}-postgres"
  }
}
