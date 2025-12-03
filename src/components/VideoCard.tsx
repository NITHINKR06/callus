"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";

type Video = RouterOutputs["video"]["feed"]["videos"][0];

export function VideoCard({ video }: { video: Video }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [isHovered, setIsHovered] = useState(false);
  const { data: session } = useSession();

  const likeMutation = api.video.like.useMutation();
  const unlikeMutation = api.video.unlike.useMutation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            videoRef.current?.play().catch(() => {
              // Autoplay failed, user interaction required
            });
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 },
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLike = async () => {
    if (!session) {
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (prev + (isLiked ? -1 : 1)));

    try {
      if (isLiked) {
        await unlikeMutation.mutateAsync({ videoId: video.id });
      } else {
        await likeMutation.mutateAsync({ videoId: video.id });
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl glass shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Container */}
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-slate-900 to-slate-800">
        <video
          ref={videoRef}
          src={video.url}
          muted
          playsInline
          loop
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          controls
        />
        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity duration-300">
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-md">
              <svg
                className="h-12 w-12 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* User Info */}
        <div className="mb-4 flex items-center gap-3">
          {video.user.image ? (
            <img
              src={video.user.image}
              alt={video.user.name ?? "User"}
              className="h-12 w-12 rounded-full ring-2 ring-blue-500/50 transition-all duration-300 group-hover:ring-blue-500"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
              {(video.user.name ?? video.user.email)?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {video.user.name ?? video.user.email}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(video.createdAt)}
            </p>
          </div>
        </div>

        {/* Title and Description */}
        {video.title && (
          <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
            {video.title}
          </h3>
        )}
        {video.description && (
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
            {video.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={!session || likeMutation.isPending || unlikeMutation.isPending}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-all duration-300 ${
              isLiked
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
          >
            <svg
              className={`h-5 w-5 transition-transform duration-300 ${isLiked ? "scale-110" : ""}`}
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="font-bold">{likeCount}</span>
          </button>
        </div>
      </div>

      {/* Gradient Border Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-20 pointer-events-none" />
    </div>
  );
}

