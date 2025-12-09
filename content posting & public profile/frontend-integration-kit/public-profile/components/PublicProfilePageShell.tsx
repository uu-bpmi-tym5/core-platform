import React from "react";
import type { CampaignLite, PostLite, PublicProfileDto } from "../../shared/types";

export function PublicProfilePageShell({
  profile,
  campaigns,
  posts
}: {
  profile: PublicProfileDto;
  campaigns: CampaignLite[];
  posts: PostLite[];
}) {
  const user = profile.user;
  const initials = (user.displayName || user.username || "?").slice(0, 1).toUpperCase();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <section style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "#eee",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32
        }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>{user.displayName || user.username}</h1>
          <div style={{ color: "#666", marginBottom: 8 }}>@{user.username}</div>
          {user.bio && <div style={{ marginBottom: 8 }}>{user.bio}</div>}
          {user.websiteUrl && (
            <a href={user.websiteUrl} target="_blank" rel="noreferrer">{user.websiteUrl}</a>
          )}
        </div>

        <div style={{ border: "1px solid #ddd", padding: 12, minWidth: 220 }}>
          <div><strong>Kampaně</strong> {profile.campaignsCount}</div>
          <div><strong>Celkem vybráno</strong> {profile.totalRaised.toLocaleString()}</div>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Kampaně</h2>
        {campaigns.length === 0 && <div>Žádné kampaně.</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {campaigns.map(c => (
            <article key={c.id} style={{ border: "1px solid #ddd", padding: 12 }}>
              <div style={{ fontSize: 12, color: c.isActive ? "#0a7" : "#888" }}>
                {c.isActive ? "Aktivní" : "Ukončená"}
              </div>
              <h3 style={{ marginTop: 6 }}>{c.title}</h3>
              {c.description && <div style={{ fontSize: 14, marginBottom: 8 }}>{c.description}</div>}
              {(c.raisedAmount != null && c.goalAmount != null) && (
                <div style={{ fontSize: 12 }}>
                  Vybráno {c.raisedAmount} / Cíl {c.goalAmount}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Aktuality</h2>
        {posts.length === 0 && <div>Žádné publikované příspěvky.</div>}
        <div style={{ display: "grid", gap: 12 }}>
          {posts.map(p => (
            <article key={p.id} style={{ border: "1px solid #ddd", padding: 12 }}>
              <h3 style={{ marginBottom: 6 }}>{p.title}</h3>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}
                {p.campaign?.title ? `, ${p.campaign.title}` : ""}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{p.content}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
