import "server-only";

import { v2 as cloudinary } from "cloudinary";

import type {
  GalleryCategory,
  GalleryImage,
} from "@/types/gallery";

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,
  api_key:
    process.env.CLOUDINARY_API_KEY,
  api_secret:
    process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
};

const GALLERY_FOLDERS: Record<
  GalleryCategory,
  string
> = {
  food: "ks-kitchen/food",
  drinks: "ks-kitchen/drinks",
  restaurant:
    "ks-kitchen/restaurant",
};

async function getImagesFromFolder(
  category: GalleryCategory,
): Promise<GalleryImage[]> {
  const folder =
    GALLERY_FOLDERS[
      category
    ];

  const result =
    await cloudinary.search
      .expression(
        `asset_folder="${folder}"`,
      )
      .sort_by(
        "created_at",
        "desc",
      )
      .max_results(100)
      .execute();

  const resources =
    (result.resources ??
      []) as CloudinaryResource[];

  console.log(
    `[Gallery] ${category}:`,
    resources.length,
    "images",
  );

  return resources.map(
    (resource) => ({
      publicId:
        resource.public_id,

      url:
        resource.secure_url,

      width:
        resource.width,

      height:
        resource.height,

      format:
        resource.format,

      category,
    }),
  );
}

export async function getGalleryImages(): Promise<
  GalleryImage[]
> {
  const categories: GalleryCategory[] =
    [
      "food",
      "drinks",
      "restaurant",
    ];

  const results =
    await Promise.all(
      categories.map(
        getImagesFromFolder,
      ),
    );

  const images =
    results.flat();

  console.log(
    "[Gallery] Total:",
    images.length,
  );

  return images;
}