"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";

type FolderKey = "menu" | "store";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

type Signature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

async function getSignature(folder: FolderKey): Promise<Signature> {
  const response = await fetch("/api/dashboard/upload-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  if (response.status === 401) {
    throw new Error("Your session expired. Sign in again to upload.");
  }

  if (!response.ok) {
    throw new Error("Couldn't start the upload. Please try again.");
  }

  return response.json();
}

/** Browser → Cloudinary (signed). Resolves with the secure image URL. */
function uploadToCloudinary(
  file: File,
  signature: Signature,
  onProgress: (fraction: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", signature.apiKey);
    body.append("timestamp", String(signature.timestamp));
    body.append("signature", signature.signature);
    body.append("folder", signature.folder);

    const request = new XMLHttpRequest();

    request.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    );

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };

    request.onload = () => {
      try {
        const data = JSON.parse(request.responseText);

        if (request.status >= 200 && request.status < 300 && data.secure_url) {
          resolve(data.secure_url as string);
          return;
        }

        reject(new Error(data?.error?.message ?? "Upload failed."));
      } catch {
        reject(new Error("Upload failed."));
      }
    };

    request.onerror = () =>
      reject(new Error("Network error. Check your connection and retry."));

    request.send(body);
  });
}

/**
 * Image picker that uploads to Cloudinary and exposes the resulting URL
 * through a hidden input, so the surrounding <form> saves it to Supabase
 * through the normal server action.
 */
export function ImageUploader({
  folder,
  name = "image",
  defaultValue,
  onBusyChange,
}: {
  folder: FolderKey;
  name?: string;
  defaultValue?: string | null;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const busyCallback = useRef(onBusyChange);

  const [url, setUrl] = useState(defaultValue ?? "");
  // Local preview shows instantly and stays until the hosted copy has loaded,
  // so the swap after upload never flashes empty.
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    busyCallback.current = onBusyChange;
  });

  useEffect(() => {
    busyCallback.current?.(uploading);
  }, [uploading]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image. Use a JPG, PNG or WebP.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("That image is over 8 MB. Choose a smaller one.");
      return;
    }

    setLocalPreview(URL.createObjectURL(file));
    setProgress(0);
    setUploading(true);

    try {
      const signature = await getSignature(folder);
      const uploadedUrl = await uploadToCloudinary(file, signature, setProgress);

      const preload = new Image();
      preload.onload = preload.onerror = () => setLocalPreview(null);
      preload.src = uploadedUrl;

      setUrl(uploadedUrl);
    } catch (uploadError) {
      setLocalPreview(null);
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setUploading(false);

      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function remove() {
    if (uploading) return;

    setUrl("");
    setLocalPreview(null);
    setError(null);
  }

  const previewSrc = localPreview ?? url;
  const hasImage = Boolean(previewSrc);

  const secondaryButton =
    "inline-flex items-center gap-1.5 rounded-full border border-roasted-coffee/20 px-3.5 py-1.5 font-sans text-xs text-roasted-coffee transition-[transform,border-color,opacity] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 [@media(hover:hover)]:hover:border-clay-pot";

  return (
    <div>
      <input type="hidden" name={name} value={url} />

      <input
        ref={fileInput}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
        disabled={uploading}
      />

      {hasImage ? (
        <div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-roasted-coffee/5">
            <img
              src={previewSrc}
              alt="Selected image preview"
              className="h-full w-full object-cover"
            />

            <div
              aria-hidden={!uploading}
              className="absolute inset-0 flex flex-col items-center justify-end bg-roasted-coffee/40 pb-4 motion-reduce:transition-none"
              style={{
                opacity: uploading ? 1 : 0,
                pointerEvents: uploading ? "auto" : "none",
                transition: `opacity 150ms ${EASE_OUT}`,
              }}
            >
              <span className="mb-2 font-sans text-xs font-medium text-coconut-cream">
                Uploading {Math.round(progress * 100)}%
              </span>

              <div className="h-1 w-3/5 overflow-hidden rounded-full bg-coconut-cream/30">
                <div
                  className="h-full w-full origin-left rounded-full bg-coconut-cream"
                  style={{
                    transform: `scaleX(${progress})`,
                    transition: "transform 120ms linear",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label
              htmlFor={inputId}
              aria-disabled={uploading}
              className={`${secondaryButton} cursor-pointer ${
                uploading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </label>

            <button
              type="button"
              onClick={remove}
              disabled={uploading}
              className={secondaryButton}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFile(event.dataTransfer.files?.[0]);
          }}
          className={`flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-center transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none ${
            dragging
              ? "border-clay-pot bg-clay-pot/10"
              : "border-roasted-coffee/25 bg-white/50 [@media(hover:hover)]:hover:border-clay-pot"
          }`}
        >
          <ImagePlus className="h-6 w-6 text-roasted-coffee/45" />

          <span className="font-sans text-sm text-roasted-coffee">
            Drop an image or <span className="text-clay-pot">browse</span>
          </span>

          <span className="font-sans text-xs text-roasted-coffee/50">
            JPG, PNG or WebP, up to 8 MB
          </span>
        </label>
      )}

      <p
        role="alert"
        aria-live="polite"
        className={`mt-2 font-sans text-xs text-alert ${error ? "" : "hidden"}`}
      >
        {error}
      </p>
    </div>
  );
}
