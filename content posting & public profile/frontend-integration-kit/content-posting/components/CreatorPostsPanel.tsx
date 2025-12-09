import React, { useEffect, useMemo, useState } from "react";
import type { PostLite } from "../../shared/types";

type GqlFn = <T>(query: string, variables?: Record<string, any>) => Promise<T>;

const MY_POSTS = `
  query MyPosts {
    myPosts {
      id title content status rejectionReason createdAt updatedAt publishedAt
      campaign { id title }
    }
  }
`;

const CREATE_POST = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) { id }
  }
`;

const UPDATE_POST = `
  mutation UpdatePost($input: UpdatePostInput!) {
    updatePost(input: $input) { id }
  }
`;

const SUBMIT_POST = `
  mutation SubmitPost($postId: ID!) {
    submitPost(postId: $postId) { id status }
  }
`;

export function CreatorPostsPanel({
  gql,
  defaultCampaignId
}: {
  gql: GqlFn;
  defaultCampaignId?: string | null;
}) {
  const [posts, setPosts] = useState<PostLite[]>([]);
  const [selected, setSelected] = useState<PostLite | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await gql<{ myPosts: PostLite[] }>(MY_POSTS);
    setPosts(data.myPosts);
  }

  useEffect(() => {
    load().catch(e => setError(e.message));
  }, []);

  function resetForm() {
    setSelected(null);
    setTitle("");
    setContent("");
  }

  function pick(p: PostLite) {
    setSelected(p);
    setTitle(p.title);
    setContent(p.content);
  }

  const editable = useMemo(() => {
    if (!selected) return true;
    return selected.status === "DRAFT" || selected.status === "REJECTED";
  }, [selected]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      if (!title.trim() || !content.trim()) throw new Error("Vyplň název a obsah.");

      if (!selected) {
        await gql(CREATE_POST, { input: { title, content, campaignId: defaultCampaignId ?? null } });
      } else {
        await gql(UPDATE_POST, { input: { id: selected.id, title, content } });
      }

      await load();
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(p: PostLite) {
    setBusy(true);
    setError(null);
    try {
      await gql(SUBMIT_POST, { postId: p.id });
      await load();
      if (selected?.id === p.id) resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Moje příspěvky</h3>
          <button onClick={resetForm}>Nový</button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {posts.map(p => (
            <div
              key={p.id}
              onClick={() => pick(p)}
              style={{
                border: "1px solid #ddd",
                padding: 10,
                cursor: "pointer",
                background: selected?.id === p.id ? "#f5f5f5" : "#fff"
              }}
            >
              <div style={{ fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 12 }}>{p.status}</div>
              {p.status === "REJECTED" && p.rejectionReason && (
                <div style={{ fontSize: 12, color: "#b00020" }}>
                  Důvod, {p.rejectionReason}
                </div>
              )}
              {(p.status === "DRAFT" || p.status === "REJECTED") && (
                <button
                  onClick={(e) => { e.stopPropagation(); submit(p); }}
                  style={{ marginTop: 6 }}
                >
                  Odeslat ke schválení
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3>{selected ? "Upravit" : "Vytvořit"}</h3>
        {error && <div style={{ color: "#b00020", marginBottom: 8 }}>{error}</div>}

        <label>Název</label>
        <input
          disabled={!editable || busy}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />

        <label>Obsah</label>
        <textarea
          disabled={!editable || busy}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />

        <button disabled={!editable || busy} onClick={save}>
          {selected ? "Uložit změny" : "Uložit koncept"}
        </button>

        {!editable && selected && (
          <div style={{ marginTop: 8, fontSize: 12 }}>
            Příspěvek je uzamčený během schvalování a po publikaci.
          </div>
        )}
      </div>
    </div>
  );
}
