import { app } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

// Connect to blob storage using a connection string locally (from AzureWebJobsStorage)
// and managed identity in Azure (via AZURE_STORAGE_ACCOUNT_NAME).
function getBlobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AzureWebJobsStorage ?? '';
  if (connectionString && !connectionString.includes('UseDevelopmentStorage=true')) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }
  return new BlobServiceClient(
    `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    new DefaultAzureCredential()
  );
}

// HTTP trigger — the browser POSTs the PDF here as multipart/form-data.
// This function writes it to blob storage and returns immediately.
// The blob trigger on the ingest function fires automatically once the file lands.
app.http('upload', {
  methods: ['POST'],
  route: 'upload',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return { status: 400, jsonBody: { error: 'Expected multipart/form-data' } };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return { status: 400, jsonBody: { error: 'No file provided' } };
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return { status: 400, jsonBody: { error: 'Only PDF files are supported' } };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Prefix with timestamp so re-uploading the same filename doesn't silently
    // overwrite — the ingest function uses the filename as a document ID.
    const blobName = `${Date.now()}-${file.name}`;

    const containerClient = getBlobServiceClient().getContainerClient(
      process.env.DOCUMENTS_CONTAINER!
    );
    await containerClient.uploadBlockBlob(blobName, buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' },
    });

    context.log(`Uploaded ${blobName} (${buffer.length} bytes)`);
    return {
      status: 202,
      jsonBody: { filename: blobName, message: 'Upload received — ingestion starting.' },
    };
  },
});
