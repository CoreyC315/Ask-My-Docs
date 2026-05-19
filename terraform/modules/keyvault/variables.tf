variable "prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "tags" {
  type = map(string)
}

variable "tenant_id" {
  description = "Azure AD tenant ID, required by Key Vault."
  type        = string
}

variable "app_principal_id" {
  description = "Principal ID of the managed identity — granted Secrets User role."
  type        = string
}

variable "admin_principal_id" {
  description = "Object ID of the operator running Terraform — granted Secrets Officer role to populate secrets."
  type        = string
}

variable "soft_delete_retention_days" {
  description = "Days a deleted vault or secret is recoverable before permanent deletion."
  type        = number
  default     = 7
}
