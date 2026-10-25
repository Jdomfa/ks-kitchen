import "server-only";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Folders the dashboard is allowed to upload into / delete from.
 * (The public gallery uses ks-kitchen/food, /drinks and /restaurant —
 * those are never touched here.)
 */
export const UPLOAD_FOLDERS = {
  menu: "ks-kitchen/menu",
  store: "ks-kitchen/store",
} as const;

export type UploadFolderKey = keyof typeof UPLOAD_FOLDERS;

export function isUploadFolderKey(value: unknown): value is UploadFolderKey {
  return typeof value === "string" && value in UPLOAD_FOLDERS;
}

/**
 * Signs an upload so the browser can send the file straight to Cloudinary
 * (no file ever passes through our server, so there are no body-size limits).
 * Only `folder` and `timestamp` are signed — the browser must send exactly those.
 */
export function signUpload(folderKey: UploadFolderKey) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  const folder = UPLOAD_FOLDERS[folderKey];
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    apiSecret,
  );

  return { cloudName, apiKey, timestamp, signature, folder };
}

/**
 * Pulls the public_id out of a Cloudinary delivery URL such as
 * https://res.cloudinary.com/<cloud>/image/upload/v123/ks-kitchen/menu/abc.jpg
 * Returns null for anything that isn't one of our dashboard uploads.
 */
function dashboardPublicIdFromUrl(url: string): string | null {
  const marker = "/image/upload/";
  const start = url.indexOf(marker);

  if (!url.includes("res.cloudinary.com") || start === -1) return null;

  const segments = url
    .slice(start + marker.length)
    .split("?")[0]
    .split("/");

  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  const idSegments =
    versionIndex === -1 ? segments : segments.slice(versionIndex + 1);

  if (idSegments.length === 0) return null;

  const publicId = decodeURIComponent(idSegments.join("/")).replace(
    /\.[a-z0-9]+$/i,
    "",
  );

  const allowed = Object.values(UPLOAD_FOLDERS).some((folder) =>
    publicId.startsWith(`${folder}/`),
  );

  return allowed ? publicId : null;
}

/**
 * Deletes an image that was uploaded through the dashboard.
 * Safe to call with any URL: legacy / external / gallery images are ignored.
 * Never throws — a failed cleanup must not fail the save that triggered it.
 */
export async function destroyDashboardImage(
  url: string | null | undefined,
): Promise<void> {
  if (!url) return;

  const publicId = dashboardPublicIdFromUrl(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.error("Cloudinary cleanup failed:", publicId, error);
  }
}
