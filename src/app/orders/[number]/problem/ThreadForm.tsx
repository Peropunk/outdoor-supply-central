"use client";

import { useState } from "react";
import { Camera, CircleAlert, X } from "lucide-react";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { PROBLEM_REASONS } from "@/lib/catalog";
import { resizeImage } from "@/lib/resize-image";
import { getBrowserClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/supabase/config";
import { postOrderMessage } from "./actions";

const MAX_PHOTOS = 4;

type Picked = { blob: Blob; preview: string };

/**
 * Message box for an order's problem thread. The first message asks what's
 * wrong; later ones are replies. Photos are shrunk on the phone, uploaded to
 * the author's own folder, then attached to the message.
 */
export function ThreadForm({
  number,
  orderId,
  userId,
  first,
}: {
  number: string;
  orderId: string;
  userId: string;
  first: boolean;
}) {
  const [reason, setReason] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const picked: Picked[] = [];
    for (const f of [...files].slice(0, room)) {
      try {
        const blob = await resizeImage(f);
        picked.push({ blob, preview: URL.createObjectURL(blob) });
      } catch {
        setError("One photo couldn't be read. Try a JPEG or PNG.");
      }
    }
    setPhotos((p) => [...p, ...picked]);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (first && !reason) return setError("Pick what's wrong.");
    if (!body.trim()) return setError("Write a message first.");
    setSending(true);
    try {
      const storage = getBrowserClient().storage.from(PHOTO_BUCKET);
      const paths: string[] = [];
      for (const p of photos) {
        const path = `${userId}/orders/${orderId}/${crypto.randomUUID()}.jpg`;
        const { error: upError } = await storage.upload(path, p.blob, { contentType: "image/jpeg", upsert: false });
        if (upError) throw new Error("A photo didn't upload. Check your connection and try again.");
        paths.push(path);
      }
      const result = await postOrderMessage(number, { reason: first ? reason : undefined, body, photoPaths: paths });
      if (!result.ok) throw new Error(result.error);
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setBody("");
      setReason("");
      setPhotos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send that. Please try again.");
    }
    setSending(false);
  }

  return (
    <form onSubmit={send} className="space-y-5">
      {first && (
        <fieldset>
          <legend className="font-semibold">What&apos;s wrong?</legend>
          <div className="mt-2 space-y-1">
            {PROBLEM_REASONS.map((r) => (
              <label key={r} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="size-5 accent-trail"
                />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Field label={first ? "Tell us what happened" : "Your reply"} htmlFor="message">
        <textarea
          id="message"
          rows={first ? 5 : 3}
          maxLength={4000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={p.preview} className="relative size-20 overflow-hidden rounded-md border border-line">
              {/* A local preview of a photo that hasn't been uploaded yet. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(p.preview);
                  setPhotos((all) => all.filter((x) => x !== p));
                }}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-ink/70 text-white"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-[13px] text-muted hover:bg-sand">
              <Camera className="size-5" aria-hidden="true" />
              Add photo
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <p className="mt-1 text-[14px] text-muted">Up to {MAX_PHOTOS} photos, such as damage or the packaging.</p>
      </div>

      {error && (
        <p role="alert" className="flex gap-2 font-semibold text-alert">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
      <button type="submit" disabled={sending} className={buttonClass("primary", "w-full")}>
        {sending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
