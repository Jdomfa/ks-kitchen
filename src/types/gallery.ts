export type GalleryCategory =
  | "food"
  | "drinks"
  | "restaurant";

export type GalleryImage = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  category: GalleryCategory;
};