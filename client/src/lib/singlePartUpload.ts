import type AwsS3 from "@uppy/aws-s3";

/**
 * Single PUT uploads succeed on HTTP 2xx. An ETag is not required to finish a
 * non-multipart upload; some storage/browser CORS responses do not expose it.
 * The SDK's default uploader otherwise leaves that successful request pending.
 */
export const uploadSinglePart: typeof AwsS3.uploadPartBytes = ({
  signature: { url, method = "PUT", headers, expires },
  body, size, onProgress, onComplete, signal,
}) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  let settled = false;
  const finish = (error?: Error) => {
    if (settled) return;
    settled = true;
    signal?.removeEventListener("abort", abort);
    if (error) {
      Object.assign(error, { source: { status: xhr.status } });
      reject(error);
      return;
    }
    const etag = xhr.getResponseHeader("etag") || "";
    onProgress?.({ loaded: size, total: size, lengthComputable: true });
    // Empty means unavailable metadata, not a fabricated storage ETag.
    onComplete?.(etag);
    resolve({ ETag: etag });
  };
  const abort = () => {
    xhr.abort();
    finish(new DOMException("Upload cancelled", "AbortError"));
  };
  if (signal?.aborted) {
    abort();
    return;
  }
  xhr.open(method, url, true);
  xhr.timeout = Math.min(expires ?? 900, 900) * 1000;
  for (const [key, value] of Object.entries(headers || {})) xhr.setRequestHeader(key, value);
  xhr.upload.addEventListener("progress", event => onProgress?.(event));
  xhr.addEventListener("load", () => {
    if (xhr.status >= 200 && xhr.status < 300) finish();
    else finish(new Error(xhr.status === 403 && xhr.responseText.includes("Request has expired")
      ? "Request has expired" : "Upload did not complete"));
  });
  xhr.addEventListener("error", () => finish(new Error("Upload connection interrupted")));
  xhr.addEventListener("timeout", () => finish(new Error("Upload connection timed out")));
  xhr.addEventListener("abort", () => finish(new DOMException("Upload cancelled", "AbortError")));
  signal?.addEventListener("abort", abort, { once: true });
  xhr.send(body);
});
