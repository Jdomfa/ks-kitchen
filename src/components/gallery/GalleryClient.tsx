"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  GalleryCategory,
  GalleryImage,
} from "@/types/gallery";

type GalleryFilter =
  | "all"
  | GalleryCategory;

type Props = {
  images: GalleryImage[];
};

const categories: {
  id: GalleryFilter;
  label: string;
}[] = [
  {
    id: "all",
    label: "All",
  },
  {
    id: "food",
    label: "Food",
  },
  {
    id: "drinks",
    label: "Drinks",
  },
  {
    id: "restaurant",
    label: "Restaurant",
  },
];

function shuffleImages<T>(
  items: T[],
): T[] {
  const shuffled = [
    ...items,
  ];

  for (
    let i =
      shuffled.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
          (i + 1),
      );

    [
      shuffled[i],
      shuffled[j],
    ] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
}

function GalleryImageCard({
  image,
  index,
  onClick,
}: {
  image: GalleryImage;
  index: number;
  onClick: () => void;
}) {
  const [
    loaded,
    setLoaded,
  ] =
    useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="gallery-card group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl bg-roasted-coffee/5 text-left sm:mb-4 sm:rounded-2xl lg:mb-5"
      style={{
        animationDelay:
          `${Math.min(index * 60, 720)}ms`,
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 z-10 overflow-hidden bg-roasted-coffee/10">
          <div className="gallery-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      )}

      <img
        src={image.url}
        alt=""
        width={image.width}
        height={image.height}
        loading="lazy"
        onLoad={() =>
          setLoaded(true)
        }
        className={`h-auto w-full object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035] ${
          loaded
            ? "scale-100 opacity-100 blur-0"
            : "scale-[1.04] opacity-0 blur-md"
        }`}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/0 transition duration-500 group-hover:ring-white/20" />
    </button>
  );
}

export default function GalleryClient({
  images,
}: Props) {
  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState<GalleryFilter>(
      "all",
    );

  const [
    randomizedImages,
    setRandomizedImages,
  ] =
    useState<
      GalleryImage[]
    >([]);

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<GalleryImage | null>(
      null,
    );

  useEffect(() => {
    setRandomizedImages(
      shuffleImages(
        images,
      ),
    );
  }, [
    images,
  ]);

  const filteredImages =
    useMemo(() => {
      if (
        activeCategory ===
        "all"
      ) {
        return randomizedImages;
      }

      return randomizedImages.filter(
        (image) =>
          image.category ===
          activeCategory,
      );
    }, [
      randomizedImages,
      activeCategory,
    ]);

  function changeCategory(
    category: GalleryFilter,
  ) {
    setActiveCategory(
      category,
    );

    setRandomizedImages(
      (current) =>
        shuffleImages(
          current,
        ),
    );
  }

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setSelectedImage(
          null,
        );
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow =
        "";
    };
  }, [
    selectedImage,
  ]);

  return (
    <>
      <div className="mb-8 flex flex-wrap justify-center gap-2 sm:mb-10 sm:gap-3 lg:mb-14">
        {categories.map(
          (
            category,
          ) => {
            const active =
              activeCategory ===
              category.id;

            return (
              <button
                key={
                  category.id
                }
                type="button"
                onClick={() =>
                  changeCategory(
                    category.id,
                  )
                }
                className={`relative overflow-hidden rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 sm:px-6 sm:py-2.5 sm:text-sm ${
                  active
                    ? "border-clay-pot bg-clay-pot text-coconut-cream shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                    : "border-roasted-coffee/20 text-roasted-coffee hover:-translate-y-0.5 hover:border-clay-pot hover:text-clay-pot"
                }`}
              >
                {
                  category.label
                }
              </button>
            );
          },
        )}
      </div>

      {filteredImages.length >
      0 ? (
        <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 lg:gap-5 2xl:columns-5">
          {filteredImages.map(
            (
              image,
              index,
            ) => (
              <GalleryImageCard
                key={
                  `${activeCategory}-${image.publicId}`
                }
                image={
                  image
                }
                index={
                  index
                }
                onClick={() =>
                  setSelectedImage(
                    image,
                  )
                }
              />
            ),
          )}
        </div>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center text-center">
          <p className="max-w-md text-base text-roasted-coffee/55">
            No photos have
            been added to
            this category yet.
          </p>
        </div>
      )}

      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="gallery-lightbox fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md md:p-10"
          onClick={() =>
            setSelectedImage(
              null,
            )
          }
        >
          <button
            type="button"
            aria-label="Close image"
            onClick={() =>
              setSelectedImage(
                null,
              )
            }
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl text-white backdrop-blur-md transition duration-300 hover:rotate-90 hover:bg-white/20 sm:right-5 sm:top-5 sm:h-11 sm:w-11"
          >
            ×
          </button>

          <div
            className="gallery-lightbox-image relative flex max-h-[92vh] max-w-[94vw] items-center justify-center"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <img
              src={
                selectedImage.url
              }
              alt=""
              width={
                selectedImage.width
              }
              height={
                selectedImage.height
              }
              className="max-h-[92vh] max-w-[94vw] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes galleryShimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes galleryCardIn {
          0% {
            opacity: 0;
            transform: translateY(24px)
              scale(0.975);
          }

          60% {
            opacity: 1;
          }

          100% {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        @keyframes galleryLightboxIn {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }

        @keyframes galleryLightboxImageIn {
          0% {
            opacity: 0;
            transform: translateY(18px)
              scale(0.94);
          }

          100% {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        .gallery-shimmer {
          animation:
            galleryShimmer
            1.45s
            cubic-bezier(
              0.4,
              0,
              0.2,
              1
            )
            infinite;
        }

        .gallery-card {
          opacity: 0;

          animation:
            galleryCardIn
            720ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            forwards;

          will-change:
            transform,
            opacity;
        }

        .gallery-lightbox {
          animation:
            galleryLightboxIn
            220ms
            ease-out
            forwards;
        }

        .gallery-lightbox-image {
          animation:
            galleryLightboxImageIn
            420ms
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            forwards;
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .gallery-card,
          .gallery-lightbox,
          .gallery-lightbox-image,
          .gallery-shimmer {
            animation: none;
          }

          .gallery-card {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}