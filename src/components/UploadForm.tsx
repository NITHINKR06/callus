"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { api } from "@/trpc/react";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const createMetadata = api.video.createMetadata.useMutation();

  const handleFileChange = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be less than 20MB");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileChange(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Get presigned URL
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { presignedUrl, finalUrl: initialFinalUrl, local, key } = await presignResponse.json();

      // Step 2: Upload file
      let finalUrl = initialFinalUrl;
      if (local) {
        // Local upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", key);

        const uploadResponse = await fetch("/api/upload/local", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        const { url } = await uploadResponse.json();
        finalUrl = url;
      } else {
        // S3 upload
        if (!presignedUrl) {
          throw new Error("No presigned URL received");
        }

        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload to S3");
        }
      }

      // Step 3: Create metadata
      await createMetadata.mutateAsync({
        url: finalUrl,
        title: title || undefined,
        description: description || undefined,
      });

      // Success - redirect to feed
      router.push("/feed");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An error occurred during upload",
      );
      setUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
            Please sign in to upload videos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="mb-2 text-4xl font-bold gradient-text">
          Upload Video
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Share your amazing content with the world
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-200 animate-slide-in">
            {error}
          </div>
        )}

        {/* File Upload Area */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Video File (MP4, max 20MB)
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
              isDragging
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105"
                : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
            } ${preview ? "p-4" : "p-12"}`}
          >
            <input
              ref={fileInputRef}
              id="file"
              name="file"
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              required
              className="hidden"
            />
            {preview ? (
              <div className="space-y-4">
                <video
                  src={preview}
                  controls
                  className="w-full rounded-xl shadow-lg max-h-96"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  Remove video
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Drop your video here or click to browse
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  MP4, WebM, or MOV (max 20MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Title (optional)
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
            placeholder="Give your video a catchy title..."
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 resize-none"
            placeholder="Tell people what your video is about..."
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={uploading || !file}
            className="btn-primary w-full"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Uploading your video...
              </span>
            ) : (
              "Upload Video"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

