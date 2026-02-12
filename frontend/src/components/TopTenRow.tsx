import React from "react";
import { cn } from "@/lib/utils";

interface TopTenItem {
  id: number;
  rank: number;
  title: string;
  posterPath: string;
  mediaType: "movie" | "tv";
  isNew?: boolean;
}

interface TopTenRowProps {
  title: string;
  items: TopTenItem[];
}

import { createSlug } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";

export function TopTenRow({ title, items }: TopTenRowProps) {
  const navigate = useNavigate();

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
        {title}
      </h2>

      {/* Horizontal scrollable row */}
      <div className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth py-4" style={{ scrollBehavior: "smooth" }}>
        <div className="flex gap-4 min-w-max px-1">
          {items.slice(0, 10).map((item, idx) => (
            <div
              key={item.id}
              className="relative flex items-end group cursor-pointer transition-transform duration-300 hover:scale-105 origin-center z-10 hover:z-20"
              style={{ width: "240px", height: "180px" }} // Restored wider container
              onClick={() => navigate(`/${item.mediaType}/${createSlug(item.title)}`, { state: { id: item.id } })}
            >
              {/* Large Outline Number (SVG) */}
              <div
                className={cn(
                  "absolute left-0 bottom-0 h-full z-0 flex items-end justify-end -mr-4 pointer-events-none",
                  idx === 9 ? "w-[70%]" : "w-[50%]"
                )}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={idx === 9 ? "-40 0 300 300" : "0 0 240 300"}
                  preserveAspectRatio="xMaxYMin meet"
                  className="drop-shadow-lg"
                >
                  <text
                    x={idx === 9 ? "240" : "200"}
                    y="280"
                    fill="none"
                    stroke="#5a5a5a"
                    strokeWidth="4"
                    textAnchor="end"
                    fontSize="300"
                    fontFamily="Impact, sans-serif"
                    fontWeight="900"
                    className="group-hover:stroke-white transition-colors duration-300"
                  >
                    {idx + 1}
                  </text>
                </svg>
              </div>

              {/* Poster Image */}
              <div className="relative w-[130px] h-[180px] ml-auto rounded-md overflow-hidden shadow-lg z-10 bg-card">
                <img
                  src={item.posterPath}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Recently Added Badge (Red bar at bottom) */}
                {item.isNew && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] bg-red-600 text-white text-[10px] font-bold py-1 px-2 rounded-sm text-center shadow-md uppercase tracking-wide">
                    Recently Added
                  </div>
                )}

                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
