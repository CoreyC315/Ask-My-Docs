variable "prefix" {
  description = "Resource name prefix, e.g. askmydocs-dev."
  type        = string
}

variable "location" {
  description = "Azure region inherited from the resource group."
  type        = string
}

variable "rg_name" {
  description = "Resource group to deploy into."
  type        = string
}

variable "tags" {
  description = "Tags applied to every resource in this module."
  type        = map(string)
}

variable "retention_days" {
  description = "Log retention in days for the Log Analytics workspace."
  type        = number
  default     = 30
}
