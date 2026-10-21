const skeletons = [
  "aspect-[4/5]",
  "aspect-[3/2]",
  "aspect-square",
  "aspect-[2/3]",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[5/4]",
  "aspect-[2/3]",
  "aspect-[3/2]",
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[5/6]",
  "aspect-[4/3]",
  "aspect-[2/3]",
  "aspect-square",
  "aspect-[3/5]",
  "aspect-[16/10]",
  "aspect-[4/5]",
  "aspect-square",
];

export default function GalleryLoading() {
  return (
    <main className="min-h-screen bg-coconut-cream">
      <section className="px-6 pb-10 pt-20 md:pb-14 md:pt-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto h-3 w-28 animate-pulse rounded-full bg-roasted-coffee/10" />

          <div className="mx-auto mt-6 h-12 w-64 animate-pulse rounded-xl bg-roasted-coffee/10 md:h-16 md:w-80" />

          <div className="mx-auto mt-6 h-4 w-full max-w-md animate-pulse rounded-full bg-roasted-coffee/10" />
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-5 md:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 flex justify-center gap-2 sm:mb-10 sm:gap-3 lg:mb-14">
            {[
              58,
              70,
              76,
              98,
            ].map(
              (
                width,
              ) => (
                <div
                  key={
                    width
                  }
                  className="h-9 animate-pulse rounded-full bg-roasted-coffee/10 sm:h-10"
                  style={{
                    width,
                  }}
                />
              ),
            )}
          </div>

          <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 lg:gap-5 2xl:columns-5">
            {skeletons.map(
              (
                ratio,
                index,
              ) => (
                <div
                  key={
                    index
                  }
                  className={`gallery-loading-card relative mb-3 break-inside-avoid overflow-hidden rounded-xl bg-roasted-coffee/10 sm:mb-4 sm:rounded-2xl lg:mb-5 ${ratio}`}
                  style={{
                    animationDelay:
                      `${Math.min(index * 45, 600)}ms`,
                  }}
                >
                  <div className="gallery-loading-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes galleryLoadingShimmer {
          100% {
            transform: translateX(
              100%
            );
          }
        }

        @keyframes galleryLoadingIn {
          0% {
            opacity: 0;
            transform: translateY(
              18px
            );
          }

          100% {
            opacity: 1;
            transform: translateY(
              0
            );
          }
        }

        .gallery-loading-shimmer {
          animation:
            galleryLoadingShimmer
            1.45s
            cubic-bezier(
              0.4,
              0,
              0.2,
              1
            )
            infinite;
        }

        .gallery-loading-card {
          opacity: 0;

          animation:
            galleryLoadingIn
            500ms
            ease-out
            forwards;
        }
      `}</style>
    </main>
  );
}