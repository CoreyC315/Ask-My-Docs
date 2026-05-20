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

variable "sku" {
  description = "SignalR SKU: Free (dev) or Standard (prod)."
  type        = string
}
