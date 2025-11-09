import { ReactNode } from 'react';

type CarouselProps = { children: ReactNode };

export default function Carousel({ children }: CarouselProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 snap-x snap-mandatory px-1">
        {/* Cada item filho deve usar 'snap-start' */}
        {children}
      </div>
    </div>
  );
}

