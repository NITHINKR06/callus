"use client";

import { useState, useEffect } from "react";

import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { VideoCard } from "./VideoCard";

type Video = RouterOutputs["video"]["feed"]["videos"][0];

export function Feed() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const { data, isLoading, refetch } = api.video.feed.useQuery(
    { cursor, limit: 10 },
  );

  useEffect(() => {
    if (data) {
      if (cursor === null) {
        // First load
        setAllVideos(data.videos);
      } else {
        // Append new videos
        setAllVideos((prev) => [...prev, ...data.videos]);
      }
    }
  }, [data, cursor]);

  const handleLoadMore = async () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
      await refetch();
    }
  };

  if (isLoading && allVideos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-300">
            Loading amazing videos...
          </p>
        </div>
      </div>
    );
  }

  if (allVideos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-6">
              <svg
                className="h-16 w-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-slate-200">
            No videos yet
          </h2>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            Be the first to share something amazing!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="mb-2 text-4xl font-bold gradient-text">
          Discover
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Explore amazing short videos from creators
        </p>
      </div>
      <div className="space-y-8">
        {allVideos.map((video, index) => (
          <div
            key={video.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <VideoCard video={video} />
          </div>
        ))}
      </div>
      {data?.nextCursor && (
        <div className="mt-12 text-center animate-fade-in">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Loading...
              </span>
            ) : (
              "Load More Videos"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

