import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * useSEO — fetches SEO settings from the DB for a given pageKey
 * and updates document.title + meta tags dynamically.
 *
 * Usage: useSEO("home") or useSEO("tipul-zugi")
 */
export function useSEO(pageKey: string) {
  const { data: page } = trpc.adminSeo.getByPage.useQuery(
    { pageKey },
    { staleTime: 5 * 60 * 1000 } // cache for 5 minutes
  );

  useEffect(() => {
    if (!page) return;

    // Update document title
    if (page.metaTitle) {
      document.title = page.metaTitle;
    }

    // Helper to set/create meta tag
    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    if (page.metaDescription) setMeta("description", page.metaDescription);
    if (page.keywords) setMeta("keywords", page.keywords);
    if (page.ogTitle) setMeta("og:title", page.ogTitle, true);
    if (page.ogDescription) setMeta("og:description", page.ogDescription, true);
    if (page.ogImage) setMeta("og:image", page.ogImage, true);
    if (page.canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = page.canonical;
    }
  }, [page, pageKey]);
}
