import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
    }

    const payload = await request.text();
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    let evt: { type: string; data: Record<string, unknown> };
    try {
      const wh = new Webhook(secret);
      evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as { type: string; data: Record<string, unknown> };
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const data = evt.data as {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        first_name?: string | null;
        last_name?: string | null;
        image_url?: string | null;
      };
      const email = data.email_addresses?.[0]?.email_address ?? "";
      if (!email) {
        return new Response("No email", { status: 200 });
      }
      await ctx.runMutation(internal.profiles.upsertClerkWebhook, {
        clerkId: data.id,
        email,
        firstName: data.first_name ?? undefined,
        lastName: data.last_name ?? undefined,
        imageUrl: data.image_url ?? undefined,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
