import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

export const videoRouter = createTRPCRouter({
  presign: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().regex(/^video\//),
      }),
    )
    .mutation(async ({ input }) => {
      // This will be handled by the API route, but we can return instructions
      // The actual presign logic is in the API route
      return {
        success: true,
        message: "Use /api/upload/presign endpoint",
      };
    }),

  createMetadata: protectedProcedure
    .input(
      z.object({
        url: z.string().min(1), // Accept both absolute and relative URLs
        title: z.string().optional(),
        description: z.string().optional(),
        duration: z.number().int().positive().optional(),
        thumbnail: z.string().optional(), // Accept both absolute and relative URLs
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const video = await ctx.db.video.create({
        data: {
          url: input.url,
          title: input.title,
          description: input.description,
          duration: input.duration,
          thumbnail: input.thumbnail,
          userId: ctx.session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return { success: true, video };
    }),

  feed: publicProcedure
    .input(
      z
        .object({
          cursor: z.string().nullish(),
          limit: z.number().min(1).max(20).default(10),
        })
        .nullish(),
    )
    .query(async ({ input, ctx }) => {
      const limit = input?.limit ?? 10;
      const cursor = input?.cursor;

      const items = await ctx.db.video.findMany({
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const next = items.pop()!;
        nextCursor = next.id;
      }

      // Get like status for current user if authenticated
      const videos = await Promise.all(
        items.map(async (video) => {
          let isLiked = false;
          if (ctx.session?.user) {
            const like = await ctx.db.like.findUnique({
              where: {
                userId_videoId: {
                  userId: ctx.session.user.id,
                  videoId: video.id,
                },
              },
            });
            isLiked = !!like;
          }

          return {
            ...video,
            isLiked,
          };
        }),
      );

      return {
        videos,
        nextCursor,
      };
    }),

  like: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if already liked
      const existingLike = await ctx.db.like.findUnique({
        where: {
          userId_videoId: {
            userId: ctx.session.user.id,
            videoId: input.videoId,
          },
        },
      });

      if (existingLike) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Video already liked",
        });
      }

      // Use transaction to ensure consistency
      await ctx.db.$transaction(async (tx) => {
        await tx.like.create({
          data: {
            userId: ctx.session.user.id,
            videoId: input.videoId,
          },
        });

        await tx.video.update({
          where: { id: input.videoId },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        });
      });

      return { success: true };
    }),

  unlike: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existingLike = await ctx.db.like.findUnique({
        where: {
          userId_videoId: {
            userId: ctx.session.user.id,
            videoId: input.videoId,
          },
        },
      });

      if (!existingLike) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Like not found",
        });
      }

      // Use transaction to ensure consistency
      await ctx.db.$transaction(async (tx) => {
        await tx.like.delete({
          where: {
            userId_videoId: {
              userId: ctx.session.user.id,
              videoId: input.videoId,
            },
          },
        });

        await tx.video.update({
          where: { id: input.videoId },
          data: {
            likeCount: {
              decrement: 1,
            },
          },
        });
      });

      return { success: true };
    }),

  userLikes: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const userId = input?.userId ?? ctx.session.user.id;

      const likes = await ctx.db.like.findMany({
        where: { userId },
        select: {
          videoId: true,
        },
      });

      return {
        videoIds: likes.map((like) => like.videoId),
      };
    }),
});

