const CATEGORY_FILES = {
  "News": "news.html",
  "Tech": "tech.html",
  "AI": "ai.html",
  "YouTube": "youtube.html",
  "Business": "business.html",
  "Education": "education.html",
  "Devotional": "devotional.html",
  "Stories": "stories.html",
  "Tips": "tips.html",
  "Offers": "offers.html",
  "Movie Reviews": "movie-reviews.html",
  "Movie News": "movie-news.html",
  "AI Stories": "ai-stories.html"
};

const ICONS = {
  News:"📰",
  Tech:"📱",
  AI:"🤖",
  YouTube:"🎬",
  Business:"📈",
  Education:"🎓",
  Devotional:"🛕",
  Stories:"📖",
  Tips:"💡",
  Offers:"🏷️",
  "Movie Reviews":"🎬",
  "Movie News":"🍿",
  "AI Stories":"🤖📖"
};

function b64encode(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64decode(value) {
  const clean = value.replace(/\n/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);

  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}

function esc(s = "") {
  return s.replace(
    /[&<>"']/g,
    c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      "\"":"&quot;",
      "'":"&#39;"
    }[c])
  );
}

function safeSlug(s = "") {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function stripDangerous(html = "") {
  return html.replace(
    /<\/?(script|style|iframe|object|embed|form|input|button)[^>]*>/gi,
    ""
  );
}

function nowIndia() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
}

function escapeRegExp(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOldCategory(html = "") {
  for (const category of Object.keys(CATEGORY_FILES)) {
    const pattern =
      `<span class="badge">${escapeRegExp(ICONS[category] || "📰")} ${escapeRegExp(category)}</span>`;

    if (
      new RegExp(pattern, "i").test(html)
    ) {
      return category;
    }
  }

  return "";
}

function getOldDate(html = "") {
  const match = html.match(
    /<div class="meta">MANA360 Team\s*·\s*([^<]+)<\/div>/i
  );

  return match && match[1]
    ? match[1].trim()
    : nowIndia();
}

async function gh(env, path, options = {}) {
  if (!env.GITHUB_TOKEN) {
    throw new Error(
      "GITHUB_TOKEN is not configured in Cloudflare."
    );
  }

  const repo =
    env.GITHUB_REPO ||
    "gullipallivinodkumar-source/mana360";

  const branch =
    env.GITHUB_BRANCH ||
    "main";

  const url =
    `https://api.github.com/repos/${repo}/contents/${path}`;

  const headers = {
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "MANA360-CMS"
  };

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `GitHub ${res.status}: ${text.slice(0, 500)}`
    );
  }

  return text ? JSON.parse(text) : {};
}

async function getFile(env, path) {
  const repo =
    env.GITHUB_REPO ||
    "gullipallivinodkumar-source/mana360";

  const branch =
    env.GITHUB_BRANCH ||
    "main";

  const url =
    `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;

  const headers = {
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "MANA360-CMS"
  };

  const res = await fetch(url, { headers });

  if (res.status === 404) {
    return null;
  }

  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `GitHub ${res.status}: ${text.slice(0, 500)}`
    );
  }

  const j = JSON.parse(text);

  return {
    sha: j.sha,
    content: b64decode(j.content || "")
  };
}

async function putFile(
  env,
  path,
  content,
  message,
  sha
) {
  const branch =
    env.GITHUB_BRANCH ||
    "main";

  const body = {
    message,
    content: b64encode(content),
    branch
  };

  if (sha) {
    body.sha = sha;
  }

  return gh(env, path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function deleteFile(
  env,
  path,
  sha,
  message
) {
  const branch =
    env.GITHUB_BRANCH ||
    "main";

  return gh(env, path, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      sha,
      branch
    })
  });
}

function articleHtml({
  title,
  description,
  category,
  content,
  date,
  slug
}) {
  const icon =
    ICONS[category] || "📰";

  return `<!doctype html>
<html lang="te">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${esc(title)} | MANA360</title>

<meta name="description" content="${esc(description)}">

<link rel="canonical" href="https://www.mana360.in/articles/${esc(slug)}.html">

<link rel="stylesheet" href="../assets/style.css">

<style>
.article-wrap{
  padding:30px 0 70px
}

.article-hero{
  background:linear-gradient(
    135deg,
    #061a43,
    #0752b8 55%,
    #08a0ef
  );
  color:#fff;
  border-radius:26px;
  padding:42px;
  box-shadow:0 20px 50px rgba(5,35,90,.18);
  margin-bottom:25px
}

.badge{
  display:inline-block;
  background:#ff2b8a;
  border-radius:999px;
  padding:8px 14px;
  font-weight:800;
  font-size:13px;
  margin-bottom:16px
}

.article-hero h1{
  font-size:clamp(30px,5vw,48px);
  line-height:1.3;
  margin:0 0 14px
}

.article-hero p{
  font-size:16px;
  line-height:1.9;
  color:#e5f1ff;
  max-width:900px;
  margin:0
}

.meta{
  margin-top:17px;
  color:#c8ddff;
  font-size:13px
}

.article-layout{
  display:grid;
  grid-template-columns:minmax(0,1fr) 290px;
  gap:24px
}

.article-body{
  background:#fff;
  border:1px solid #e2e9f3;
  border-radius:20px;
  padding:30px;
  box-shadow:0 10px 30px rgba(10,35,70,.07)
}

.article-body h2{
  color:#102d5a;
  font-size:25px;
  line-height:1.4;
  margin:28px 0 9px
}

.article-body p{
  color:#34465e;
  font-size:16px;
  line-height:2;
  margin:0 0 16px
}

.article-body ul,
.article-body ol{
  line-height:1.9;
  color:#34465e
}

.article-body img{
  max-width:100%;
  height:auto;
  display:block;
  border-radius:14px;
  margin:20px auto
}

.tip{
  background:#eff7ff;
  border-left:5px solid #0878df;
  padding:18px 19px;
  border-radius:12px;
  margin:22px 0;
  color:#263e5b;
  line-height:1.9
}

.article-side{
  background:#061a43;
  color:#fff;
  border-radius:20px;
  padding:22px;
  height:max-content;
  position:sticky;
  top:15px
}

.article-side h3{
  margin:0 0 10px
}

.article-side a{
  display:block;
  color:#dcecff;
  text-decoration:none;
  padding:10px 0;
  border-bottom:1px solid rgba(255,255,255,.13)
}

.back{
  display:inline-block;
  margin-top:22px;
  color:#1262c4;
  font-weight:800;
  text-decoration:none
}

@media(max-width:800px){
  .article-hero{
    padding:28px 21px
  }

  .article-body{
    padding:22px 18px
  }

  .article-layout{
    grid-template-columns:1fr
  }

  .article-side{
    position:static
  }
}
</style>
</head>

<body>

<main class="container article-wrap">

<section class="article-hero">

<span class="badge">
${icon} ${esc(category)}
</span>

<h1>${esc(title)}</h1>

<p>${esc(description)}</p>

<div class="meta">
MANA360 Team · ${esc(date)}
</div>

</section>

<div class="article-layout">

<article class="article-body">

${stripDangerous(content)}

<div class="tip">
<b>ముఖ్యమైన takeaway:</b>
ఈ సమాచారాన్ని మీ అవసరానికి అనుగుణంగా ఉపయోగించండి.
అవసరమైన చోట reliable sourcesతో verify చేయండి.
</div>

<a
class="back"
href="../categories/${esc(
  CATEGORY_FILES[category] || "news.html"
)}"
>
← ${esc(category)} Categoryకి తిరిగి వెళ్లండి
</a>

</article>

<aside class="article-side">

<h3>📚 Related Topics</h3>

<a href="../categories/tech.html">
📱 Tech
</a>

<a href="../categories/ai.html">
🤖 AI
</a>

<a href="../categories/business.html">
📈 Business
</a>

<a href="../categories/education.html">
🎓 Education
</a>

<a href="../index.html">
🏠 MANA360 Home
</a>

</aside>

</div>

</main>

</body>
</html>`;
}

function homeCard({
  title,
  category,
  slug,
  date
}) {
  const icon =
    ICONS[category] || "📰";

  return `<a class="card" href="articles/${esc(slug)}.html">
<div class="card-image">${icon}</div>
<div class="card-body">
<span class="category">${esc(category)}</span>
<h3>${esc(title)}</h3>
<div class="date">${esc(date)}</div>
</div>
</a>`;
}

function catCard({
  title,
  category,
  slug,
  description
}) {
  const icon =
    ICONS[category] || "📰";

  return `<a class="cat-card" href="../articles/${esc(slug)}.html">
<div class="cat-card-top">${icon}</div>
<div class="cat-card-body">
<small>${esc(category)}</small>
<h3>${esc(title)}</h3>
<p>${esc(description)}</p>
</div>
</a>`;
}

async function uploadImage(
  env,
  fileName,
  base64Data
) {
  const path =
    `assets/images/${fileName}`;

  const existing =
    await getFile(env, path);

  const repo =
    env.GITHUB_REPO ||
    "gullipallivinodkumar-source/mana360";

  const branch =
    env.GITHUB_BRANCH ||
    "main";

  const body = {
    message:
      `Upload image: ${fileName}`,
    content: base64Data,
    branch
  };

  if (existing?.sha) {
    body.sha = existing.sha;
  }

  await gh(env, path, {
    method: "PUT",
    headers: {
      "Content-Type":
        "application/json"
    },
    body: JSON.stringify(body)
  });

  return `https://raw.githubusercontent.com/${repo}/${branch}/assets/images/${fileName}`;
}

async function publish(env, data) {

  const title =
    (data.title || "").trim();

  const description =
    (data.description || "").trim();

  const category =
    (data.category || "").trim();

  const content =
    stripDangerous(
      data.content || ""
    ).trim();

  if (
    !title ||
    !description ||
    !category ||
    !content
  ) {
    throw new Error(
      "Title, description, category and content are required."
    );
  }

  if (!CATEGORY_FILES[category]) {
    throw new Error(
      "Invalid category."
    );
  }

  const slug =
    safeSlug(
      data.slug || title
    );

  if (!slug) {
    throw new Error(
      "Valid slug is required."
    );
  }

  if (
    data.image &&
    data.image.name &&
    data.image.data
  ) {
    await uploadImage(
      env,
      data.image.name,
      data.image.data
    );
  }

  const date =
    nowIndia();

  const articlePath =
    `articles/${slug}.html`;

  const existing =
    await getFile(
      env,
      articlePath
    );

  if (existing) {
    throw new Error(
      "This slug already exists. Use a different slug."
    );
  }

  await putFile(
    env,
    articlePath,
    articleHtml({
      title,
      description,
      category,
      content,
      date,
      slug
    }),
    `Publish article: ${title}`
  );

  const index =
    await getFile(
      env,
      "index.html"
    );

  if (index) {

    const marker =
      '<div class="grid">';

    const card =
      homeCard({
        title,
        category,
        slug,
        date
      });

    const updated =
      index.content.includes(marker)
        ? index.content.replace(
            marker,
            marker + card
          )
        : index.content;

    if (
      updated !== index.content
    ) {
      await putFile(
        env,
        "index.html",
        updated,
        `Add ${title} to homepage`,
        index.sha
      );
    }
  }

  const catPath =
    `categories/${CATEGORY_FILES[category]}`;

  const cat =
    await getFile(
      env,
      catPath
    );

  if (cat) {

    const marker =
      '<section class="cat-grid">';

    const card =
      catCard({
        title,
        category,
        slug,
        description
      });

    const updated =
      cat.content.includes(marker)
        ? cat.content.replace(
            marker,
            marker + card
          )
        : cat.content;

    if (
      updated !== cat.content
    ) {
      await putFile(
        env,
        catPath,
        updated,
        `Add ${title} to ${category} category`,
        cat.sha
      );
    }
  }

  const search =
    await getFile(
      env,
      "search.html"
    );

  if (search) {

    const m =
      search.content.match(
        /const data=(\[.*?\]);/s
      );

    if (m) {

      try {

        const arr =
          JSON.parse(m[1]);

        arr.unshift({
          title,
          cat: category,
          icon:
            ICONS[category] || "📰",
          slug
        });

        const updated =
          search.content.replace(
            m[0],
            `const data=${JSON.stringify(
              arr.slice(0, 100)
            )};`
          );

        await putFile(
          env,
          "search.html",
          updated,
          `Add ${title} to search index`,
          search.sha
        );

      } catch (e) {}
    }
  }

  const sitemap =
    await getFile(
      env,
      "sitemap.xml"
    );

  if (sitemap) {

    const line =
      `<url><loc>https://www.mana360.in/articles/${slug}.html</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;

    if (
      !sitemap.content.includes(
        `/articles/${slug}.html`
      )
    ) {

      const updated =
        sitemap.content.replace(
          "</urlset>",
          line + "</urlset>"
        );

      await putFile(
        env,
        "sitemap.xml",
        updated,
        `Add ${title} to sitemap`,
        sitemap.sha
      );
    }
  }

  return {
    ok: true,
    slug,
    url:
      `https://www.mana360.in/articles/${slug}.html`
  };
}

async function updateArticle(
  env,
  data
) {

  const oldSlug =
    safeSlug(
      data.oldSlug || ""
    );

  const title =
    (data.title || "").trim();

  const description =
    (data.description || "").trim();

  const category =
    (data.category || "").trim();

  const content =
    stripDangerous(
      data.content || ""
    ).trim();

  const newSlug =
    safeSlug(
      data.slug || title
    );

  if (
    !oldSlug ||
    !title ||
    !description ||
    !category ||
    !content ||
    !newSlug
  ) {
    throw new Error(
      "Old slug, title, description, category, content and slug are required."
    );
  }

  if (!CATEGORY_FILES[category]) {
    throw new Error(
      "Invalid category."
    );
  }

  const oldPath =
    `articles/${oldSlug}.html`;

  const oldFile =
    await getFile(
      env,
      oldPath
    );

  if (!oldFile) {
    throw new Error(
      "Original article not found."
    );
  }

  const oldCategory =
    getOldCategory(
      oldFile.content
    );

  const date =
    getOldDate(
      oldFile.content
    );

  if (newSlug !== oldSlug) {

    const newExisting =
      await getFile(
        env,
        `articles/${newSlug}.html`
      );

    if (newExisting) {
      throw new Error(
        "New slug already exists. Please use a different slug."
      );
    }
  }

  const newHtml =
    articleHtml({
      title,
      description,
      category,
      content,
      date,
      slug: newSlug
    });

  const newPath =
    `articles/${newSlug}.html`;

  if (newSlug === oldSlug) {

    await putFile(
      env,
      oldPath,
      newHtml,
      `Update article: ${title}`,
      oldFile.sha
    );

  } else {

    await putFile(
      env,
      newPath,
      newHtml,
      `Update article: ${title}`
    );
  }

  /* HOME PAGE */

  const index =
    await getFile(
      env,
      "index.html"
    );

  if (index) {

    const escaped =
      escapeRegExp(
        oldSlug
      );

    const oldCardRegex =
      new RegExp(
        `<a[^>]*class=["']card["'][^>]*href=["']articles/${escaped}\\.html["'][\\s\\S]*?<\\/a>`,
        "i"
      );

    let updated =
      index.content.replace(
        oldCardRegex,
        ""
      );

    const marker =
      '<div class="grid">';

    const newCard =
      homeCard({
        title,
        category,
        slug: newSlug,
        date
      });

    if (updated.includes(marker)) {

      updated =
        updated.replace(
          marker,
          marker + newCard
        );
    }

    if (
      updated !== index.content
    ) {

      await putFile(
        env,
        "index.html",
        updated,
        `Update ${title} on homepage`,
        index.sha
      );
    }
  }

  /* OLD CATEGORY */

  if (
    oldCategory &&
    CATEGORY_FILES[oldCategory]
  ) {

    const oldCatPath =
      `categories/${CATEGORY_FILES[oldCategory]}`;

    const oldCat =
      await getFile(
        env,
        oldCatPath
      );

    if (oldCat) {

      const escaped =
        escapeRegExp(
          oldSlug
        );

      const oldCatRegex =
        new RegExp(
          `<a[^>]*class=["']cat-card["'][^>]*href=["']\\.\\./articles/${escaped}\\.html["'][\\s\\S]*?<\\/a>`,
          "i"
        );

      const updated =
        oldCat.content.replace(
          oldCatRegex,
          ""
        );

      if (
        updated !== oldCat.content
      ) {

        await putFile(
          env,
          oldCatPath,
          updated,
          `Remove old article from ${oldCategory}`,
          oldCat.sha
        );
      }
    }
  }

  /* NEW CATEGORY */

  const newCatPath =
    `categories/${CATEGORY_FILES[category]}`;

  const newCat =
    await getFile(
      env,
      newCatPath
    );

  if (newCat) {

    const escaped =
      escapeRegExp(
        newSlug
      );

    const existingRegex =
      new RegExp(
        `<a[^>]*class=["']cat-card["'][^>]*href=["']\\.\\./articles/${escaped}\\.html["'][\\s\\S]*?<\\/a>`,
        "i"
      );

    let updated =
      newCat.content.replace(
        existingRegex,
        ""
      );

    const marker =
      '<section class="cat-grid">';

    const newCard =
      catCard({
        title,
        category,
        slug: newSlug,
        description
      });

    if (updated.includes(marker)) {

      updated =
        updated.replace(
          marker,
          marker + newCard
        );
    }

    if (
      updated !== newCat.content
    ) {

      await putFile(
        env,
        newCatPath,
        updated,
        `Update ${title} in ${category} category`,
        newCat.sha
      );
    }
  }

  /* SEARCH */

  const search =
    await getFile(
      env,
      "search.html"
    );

  if (search) {

    const m =
      search.content.match(
        /const data=(\[.*?\]);/s
      );

    if (m) {

      try {

        const arr =
          JSON.parse(m[1]);

        const filtered =
          arr.filter(
            item =>
              item.slug !== oldSlug &&
              item.slug !== newSlug
          );

        filtered.unshift({
          title,
          cat: category,
          icon:
            ICONS[category] || "📰",
          slug: newSlug
        });

        const updated =
          search.content.replace(
            m[0],
            `const data=${JSON.stringify(
              filtered.slice(0, 100)
            )};`
          );

        if (
          updated !== search.content
        ) {

          await putFile(
            env,
            "search.html",
            updated,
            `Update ${title} in search index`,
            search.sha
          );
        }

      } catch (e) {}
    }
  }

  /* SITEMAP */

  const sitemap =
    await getFile(
      env,
      "sitemap.xml"
    );

  if (sitemap) {

    const escapedOld =
      escapeRegExp(
        oldSlug
      );

    const oldSitemapRegex =
      new RegExp(
        `<url>\\s*<loc>https://www\\.mana360\\.in/articles/${escapedOld}\\.html<\\/loc>[\\s\\S]*?<\\/url>`,
        "gi"
      );

    let updated =
      sitemap.content.replace(
        oldSitemapRegex,
        ""
      );

    const newEntry =
      `<url><loc>https://www.mana360.in/articles/${esc(newSlug)}.html</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;

    if (
      !updated.includes(
        `/articles/${newSlug}.html`
      )
    ) {

      updated =
        updated.replace(
          "</urlset>",
          newEntry + "</urlset>"
        );
    }

    if (
      updated !== sitemap.content
    ) {

      await putFile(
        env,
        "sitemap.xml",
        updated,
        `Update ${title} in sitemap`,
        sitemap.sha
      );
    }
  }

  /* DELETE OLD SLUG AFTER SUCCESS */

  if (newSlug !== oldSlug) {

    await deleteFile(
      env,
      oldPath,
      oldFile.sha,
      `Remove old article: ${oldSlug}`
    );
  }

  return {
    ok: true,
    slug: newSlug,
    url:
      `https://www.mana360.in/articles/${newSlug}.html`
  };
}

export default {
  async fetch(request, env) {

    const url =
      new URL(request.url);

    /* =========================
       GET ARTICLES
    ========================= */

    if (
      url.pathname === "/api/articles" &&
      request.method === "GET"
    ) {

      try {

        const password =
          request.headers.get(
            "x-admin-password"
          ) || "";

        if (!env.ADMIN_PASSWORD) {
          return new Response(
            JSON.stringify({
              error:
                "ADMIN_PASSWORD is not configured in Cloudflare."
            }),
            {
              status: 500,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        if (
          password !==
          env.ADMIN_PASSWORD
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Wrong admin password."
            }),
            {
              status: 401,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        const files =
          await gh(
            env,
            "articles",
            {
              method: "GET"
            }
          );

        const articles =
          (Array.isArray(files)
            ? files
            : [])
            .filter(
              f =>
                f.type === "file" &&
                f.name.endsWith(".html")
            )
            .map(
              f => ({
                name: f.name,
                slug:
                  f.name.replace(
                    /\.html$/,
                    ""
                  ),
                url:
                  `/articles/${f.name}`
              })
            );

        return new Response(
          JSON.stringify({
            ok: true,
            articles
          }),
          {
            headers: {
              "content-type":
                "application/json"
            }
          }
        );

      } catch (e) {

        return new Response(
          JSON.stringify({
            error:
              e.message || String(e)
          }),
          {
            status: 400,
            headers: {
              "content-type":
                "application/json"
            }
          }
        );
      }
    }

    /* =========================
       GET SINGLE ARTICLE
    ========================= */

    if (
      url.pathname === "/api/article" &&
      request.method === "GET"
    ) {

      try {

        const password =
          request.headers.get(
            "x-admin-password"
          ) || "";

        if (!env.ADMIN_PASSWORD) {
          return new Response(
            JSON.stringify({
              error:
                "ADMIN_PASSWORD is not configured in Cloudflare."
            }),
            {
              status: 500,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        if (
          password !==
          env.ADMIN_PASSWORD
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Wrong admin password."
            }),
            {
              status: 401,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        const slug =
          url.searchParams.get(
            "slug"
          ) || "";

        if (!slug) {
          return new Response(
            JSON.stringify({
              error:
                "Slug is required."
            }),
            {
              status: 400,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        const path =
          `articles/${safeSlug(slug)}.html`;

        const file =
          await getFile(
            env,
            path
          );

        if (!file) {
          return new Response(
            JSON.stringify({
              error:
                "Article not found."
            }),
            {
              status: 404,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        return new Response(
          JSON.stringify({
            ok: true,
            content:
              file.content
          }),
          {
            headers: {
              "content-type":
                "application/json"
            }
          }
        );

      } catch (e) {

        return new Response(
          JSON.stringify({
            error:
              e.message || String(e)
          }),
          {
            status: 400,
            headers: {
              "content-type":
                "application/json"
            }
          }
        );
      }
    }

    /* =========================
       UPLOAD IMAGE
    ========================= */

    if (
      url.pathname === "/api/upload-image" &&
      request.method === "POST"
    ) {

      try {

        const password =
          request.headers.get(
            "x-admin-password"
          ) || "";

        if (!env.ADMIN_PASSWORD) {
          return new Response(
            JSON.stringify({
              error:
                "ADMIN_PASSWORD is not configured in Cloudflare."
            }),
            {
              status: 500,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        if (
          password !==
          env.ADMIN_PASSWORD
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Wrong admin password."
            }),
            {
              status: 401,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        const data =
          await request.json();

        const fileName =
          String(
            data.fileName || ""
          )
            .toLowerCase()
            .replace(
              /[^a-z0-9._-]/g,
              "-"
            )
            .slice(0, 100);

        const base64 =
          String(
            data.base64 || ""
          );

        if (
          !fileName ||
          !base64
        ) {
          throw new Error(
            "Image file and data are required."
          );
        }

        if (
          !/\.(jpg|jpeg|png|webp)$/i.test(
            fileName
          )
        ) {
          throw new Error(
            "Only JPG, PNG and WebP images are allowed."
          );
        }

        const imageUrl =
          await uploadImage(
            env,
            fileName,
            base64
          );

        return new Response(
          JSON.stringify({
            ok: true,
            url: imageUrl
          }),
          {
            headers: {
              "content-type":
                "application/json"
            }
          }
        );

      } catch (e) {

        return new Response(
          JSON.stringify({
            error:
              e.message || String(e)
          }),
          {
            status: 400,
            headers: {
              "content-type":
                "application/json"
            }
          }
        );
      }
    }

    /* =========================
       UPDATE ARTICLE
    ========================= */

    if (
      url.pathname === "/api/update-article" &&
      request.method === "POST"
    ) {

      try {

        const password =
          request.headers.get(
            "x-admin-password"
          ) || "";

        if (!env.ADMIN_PASSWORD) {
          return new Response(
            JSON.stringify({
              error:
                "ADMIN_PASSWORD is not configured in Cloudflare."
            }),
            {
              status: 500,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        if (
          password !==
          env.ADMIN_PASSWORD
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Wrong admin password."
            }),
            {
              status: 401,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        const data =
          await request.json();

        const result =
          await updateArticle(
            env,
            data
          );

        return new Response(
          JSON.stringify(result),
          {
            headers: {
              "content-type":
                "application/json"
            }
          }
        );

      } catch (e) {

        return new Response(
          JSON.stringify({
            error:
              e.message || String(e)
          }),
          {
            status: 400,
            headers: {
              "content-type":
                "application/json"
            }
          }
        );
      }
    }

    /* =========================
       PUBLISH ARTICLE
    ========================= */

    if (
      url.pathname === "/api/publish" &&
      request.method === "POST"
    ) {

      try {

        const password =
          request.headers.get(
            "x-admin-password"
          ) || "";

        if (!env.ADMIN_PASSWORD) {
          return new Response(
            JSON.stringify({
              error:
                "ADMIN_PASSWORD is not configured in Cloudflare."
            }),
            {
              status: 500,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        if (
          password !==
          env.ADMIN_PASSWORD
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Wrong admin password."
            }),
            {
              status: 401,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          );
        }

        const data =
          await request.json();

        const result =
          await publish(
            env,
            data
          );

        return new Response(
          JSON.stringify(result),
          {
            headers: {
              "content-type":
                "application/json"
            }
          }
        );

      } catch (e) {

        return new Response(
          JSON.stringify({
            error:
              e.message || String(e)
          }),
          {
            status: 400,
            headers: {
              "content-type":
                "application/json"
            }
          }
        );
      }
    }

    return env.ASSETS.fetch(
      request
    );
  }
};
