import type {
  Metadata,
} from "next";

import GalleryClient from "@/components/gallery/GalleryClient";

import {
  getGalleryImages,
} from "@/lib/cloudinary/gallery";

export const metadata: Metadata =
  {
    title:
      "Gallery | K's Kitchen",

    description:
      "Explore food, drinks and moments from K's Kitchen.",
  };

export const revalidate =
  300;

export default async function GalleryPage() {
  let images =
    [] as Awaited<
      ReturnType<
        typeof getGalleryImages
      >
    >;

  try {
    images =
      await getGalleryImages();
  } catch (error) {
    console.error(
      "Unable to load Cloudinary gallery:",
      error,
    );
  }

  return (
    <main className="min-h-screen bg-coconut-cream">
      <section
        className="
          relative
          overflow-hidden
          px-6
          pb-10
          pt-20
          md:pb-14
          md:pt-28
        "
      >
        <div
          className="
            relative
            z-10
            mx-auto
            max-w-5xl
            text-center
          "
        >
          <p
            className="
              text-sm
              font-medium
              uppercase
              tracking-[0.28em]
              text-clay-pot
            "
          >
            K&apos;s Kitchen
          </p>

          <h1
            className="
              mt-4
              font-display
              text-4xl
              text-roasted-coffee
              md:text-6xl
            "
          >
            Our Gallery
          </h1>

          <p
            className="
              mx-auto
              mt-5
              max-w-xl
              text-base
              leading-7
              text-tamarind-bark/70
              md:text-lg
            "
          >
            A collection of
            food, drinks and
            moments from
            K&apos;s Kitchen.
          </p>
        </div>
      </section>

      <section
        className="
          px-4
          pb-24
          sm:px-5
          md:px-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1600px]
          "
        >
          <GalleryClient
            images={
              images
            }
          />
        </div>
      </section>
    </main>
  );
}