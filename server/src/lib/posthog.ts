import { PostHog } from "posthog-node";

/**
 * Single export for access to `PostHog` client
 */
export const PostHogClient =
  process.env.DISABLE_CAPTURE !== "true"
    ? new PostHog(process.env.POSTHOG_KEY as string, {
        host: "https://us.i.posthog.com",
      })
    : undefined;
