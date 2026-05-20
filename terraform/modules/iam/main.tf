# Storage Blob Data Contributor — lets the managed identity read and write blobs.
# The ingest function needs this to read uploaded PDFs from the documents container.
# The Function App runtime also uses the same identity for its own internal storage
# (trigger state, distributed locks), so Contributor is required — Reader isn't enough.
resource "azurerm_role_assignment" "storage_blob" {
  scope                = var.storage_account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = var.principal_id
}

# Search Index Data Contributor — lets the managed identity push document chunks
# into the AI Search index and manage the index schema.
# The ingest function writes here after chunking and embedding each PDF.
# The query function reads from here to find relevant chunks for each question.
resource "azurerm_role_assignment" "search_index" {
  scope                = var.search_service_id
  role_definition_name = "Search Index Data Contributor"
  principal_id         = var.principal_id
}
