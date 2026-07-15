import type { SlideContent } from "@/lib/types";

export default function SlideEditor({
  slides,
  onChange,
  disabled,
}: {
  slides: SlideContent[];
  onChange: (next: SlideContent[]) => void;
  disabled: boolean;
}) {
  function updateSlide(i: number, patch: Partial<SlideContent>) {
    onChange(slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  return (
    <div className="thin-scroll flex h-full min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 pt-0">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="flex flex-col rounded-lg border border-[var(--border)] bg-white p-2.5"
          >
            <span className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Slide {i + 1}
            </span>
            <div className="flex aspect-video flex-col rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--background)] p-3">
              <input
                value={slide.title}
                onChange={(e) => updateSlide(i, { title: e.target.value })}
                disabled={disabled}
                placeholder="Slide title"
                className="w-full bg-transparent text-sm font-semibold text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-subtle)] disabled:text-[var(--foreground-subtle)]"
              />
              <textarea
                value={slide.bullets}
                onChange={(e) => updateSlide(i, { bullets: e.target.value })}
                disabled={disabled}
                placeholder="Bullet points…"
                className="thin-scroll mt-2 w-full flex-1 resize-none bg-transparent text-xs leading-5 text-[var(--foreground-muted)] outline-none placeholder:text-[var(--foreground-subtle)] disabled:text-[var(--foreground-subtle)]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
