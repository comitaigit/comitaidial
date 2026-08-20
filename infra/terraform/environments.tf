# Environment (dev/prod) comes from the Terraform workspace, not a
# hand-typed variable — this makes it impossible to `apply` against prod
# while believing you're in dev. Switch with:
#   terraform workspace select dev   (or prod)
#   terraform workspace new dev      (first time)
#
# The default workspace is refused on purpose (see the precondition below) so
# nobody accidentally applies un-namespaced resources outside dev/prod.

locals {
  environment = terraform.workspace

  name_prefix = "${var.project_name}-${local.environment}"

  vpc_cidr             = var.vpc_cidr_by_env[local.environment]
  db_instance_class    = var.db_instance_class_by_env[local.environment]
  db_allocated_storage = var.db_allocated_storage_by_env[local.environment]
  ec2_instance_type    = var.ec2_instance_type_by_env[local.environment]

  frontend_domain = var.frontend_domain_by_env[local.environment]
  api_domain      = var.api_domain_by_env[local.environment]
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Select a workspace before applying: `terraform workspace select dev` or `terraform workspace select prod` (create with `terraform workspace new <name>` first time). Refusing to apply against the 'default' workspace."
    }
  }
}
