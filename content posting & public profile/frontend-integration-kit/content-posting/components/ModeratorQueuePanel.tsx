import React, { useEffect, useState } from "react";
import type { PostLite } from "../../shared/types";

type GqlFn = <T>(query: string, variables?: Record<string, any>) => Promise<T>;

const PENDING = `
  query PendingPosts {
    pendingPosts {
      id title content status createdAt
      author { id username displayName }
      campaign { id title }
    }
  }
`;

const APPROVE = `
  mutation ApprovePost($postId: ID!) {
    approvePost(postId: $postId) { id status }
  }
`;

const REJECT = `
  mutation RejectPost($input: RejectPostInput!) {
    rejectPost(input: $input) { id status rejectionReason }
  }
`;

export function ModeratorQueuePanel({ gql }: { gql: GqlFn }) {
  const [posts, setPosts] = useState<PostLite[]>([]);
  const [selected, setSelected] = useState<PostLite | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await gql<{ pendingPosts: PostLite[] }>(PENDING);
    setPosts(data.pendingPosts);
  }

  useEffect(() => {
    load().catch(e => setError(e.message));
  }, []);

  async function approve() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await gql(APPROVE, { postId: selected.id });
      setSelected(null);
      setReason("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      if (!reason.trim()) throw new Error("Vyplň důvod zamítnutí.");
      await gql(REJECT, { input: { id: selected.id, reason } });
      setSelected(null);
      setReason("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
      <div>
        <h3>Čeká na schválení</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {posts.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                border: "1px solid #ddd",
                padding: 10,
                cursor: "pointer",
                background: selected?.id === p.id ? "#f5f5f5" : "#fff"
              }}
            >
              <div style={{ fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 12 }}>
                Autor, {p.author?.displayName || p.author?.username || "N/A"}
              </div>
              {p.campaign && <div style={{ fontSize: 12 }}>Kampaň, {p.campaign.title}</div>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3>Revize</h3>
        {error && <div style={{ color: "#b00020", marginBottom: 8 }}>{error}</div>}

        {!selected && <div>Vyber příspěvek.</div>}

        {selected && (
          <>
            <h4>{selected.title}</h4>
            <pre style={{ whiteSpace: "pre-wrap", border: "1px solid #eee", padding: 10 }}>
{selected.content}
            </pre>

            <label>Důvod zamítnutí</label>
            <input
              disabled={busy}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={busy} onClick={approve}>Schválit</button>
              <button disabled={busy} onClick={reject}>Zamítnout</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
