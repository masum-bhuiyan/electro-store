import VideoSlider from "@/components/store/videoSlider";
import { buttonClass } from "@/components/ui/button";
import { en } from "@/lib/messages";
import { YOUTUBE_URL } from "@/lib/site";
import { HOME_VIDEOS } from "@/lib/videos";

export default function YoutubeSection() {
  if (HOME_VIDEOS.length === 0) return null;

  return (
    <section className="bg-brand-mist">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-7">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-brand-teal md:text-3xl">
              {en.videos.title}
            </h2>
            <p className="mt-2 max-w-xl text-gray-700">{en.videos.text}</p>
          </div>
          {YOUTUBE_URL && (
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "md")}
            >
              {en.videos.channel}
            </a>
          )}
        </div>

        <VideoSlider videos={HOME_VIDEOS} />
      </div>
    </section>
  );
}