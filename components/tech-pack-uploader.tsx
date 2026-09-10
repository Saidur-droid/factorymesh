"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function TechPackUploader({ orderId, hasFile }: { orderId: string; hasFile: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    const request = await fetch("/api/uploads/tech-pack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, fileName: file.name, mimeType: file.type, size: file.size }),
    });
    const signed = await request.json();
    if (!request.ok) {
      setMessage(signed.error ?? "Upload authorization failed");
      setBusy(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.storage.from("tech-packs").uploadToSignedUrl(signed.path, signed.token, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    const confirmation = await fetch("/api/uploads/tech-pack/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, path: signed.path }),
    });
    const confirmed = await confirmation.json();
    setMessage(confirmation.ok ? "Tech pack attached." : confirmed.error ?? "Upload confirmation failed");
    setBusy(false);
    if (confirmation.ok) router.refresh();
  }

  async function openFile() {
    setBusy(true);
    const response = await fetch(`/api/orders/${orderId}/tech-pack`);
    const body = await response.json();
    if (response.ok) window.open(body.url, "_blank", "noopener,noreferrer");
    else setMessage(body.error ?? "Unable to open tech pack");
    setBusy(false);
  }

  return (
    <div className="file-actions">
      <label className="secondary-button file-button">
        {busy ? "Working…" : hasFile ? "Replace tech pack" : "Upload tech pack"}
        <input
          type="file"
          hidden
          disabled={busy}
          accept=".pdf,.zip,.png,.jpg,.jpeg,.xlsx"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void upload(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {hasFile && <button className="secondary-button" type="button" disabled={busy} onClick={openFile}>Open</button>}
      {message && <small role="status">{message}</small>}
    </div>
  );
}
