"use client";

interface RelatedPost {
  id: string;
  title: string;
  body: string;
  labels: string[];
}

interface RelatedPostsProps {
  posts: RelatedPost[];
  title: string;
  onPostClick: (id: string) => void;
}

export function RelatedPosts({ posts, title, onPostClick }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
        {title}
      </h3>
      <div className="space-y-0 divide-y divide-dashed divide-border/50">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => onPostClick(post.id)}
            className="group cursor-pointer py-3 first:pt-0 last:pb-0 transition-all duration-200 hover:pl-1"
          >
            <h4 className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {post.title}
            </h4>
            <p className="text-[11px] text-muted-foreground/70 line-clamp-1 leading-snug italic mb-1.5">
              {post.body}
            </p>
            <div className="flex items-center gap-1.5">
              {post.labels?.slice(0, 2).map((label: string) => (
                <span key={label} className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">
                  {label}
                </span>
              ))}
              {post.labels?.length > 2 && (
                <span className="text-[8px] text-muted-foreground/30">+{post.labels.length - 2}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
