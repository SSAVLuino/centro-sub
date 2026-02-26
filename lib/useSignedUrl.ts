"use client"

import { useState, useEffect } from "react"

/**
 * Risolve una signed URL per un file in un bucket privato Supabase.
 * Ritorna null finché non è pronta, poi la URL firmata.
 */
export function useSignedUrl(bucket: string | null, path: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!bucket || !path) { setUrl(null); return }
    let cancelled = false

    fetch(`/api/signed-url?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`)
      .then(r => r.json())
      .then(data => { if (!cancelled && data.url) setUrl(data.url) })
      .catch(() => { if (!cancelled) setUrl(null) })

    return () => { cancelled = true }
  }, [bucket, path])

  return url
}

/**
 * Risolve più signed URL in parallelo.
 * Ritorna una Map<path, signedUrl>.
 */
export function useSignedUrls(bucket: string | null, paths: (string | null)[]): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (!bucket) { setUrls(new Map()); return }
    const validPaths = paths.filter((p): p is string => !!p)
    if (validPaths.length === 0) { setUrls(new Map()); return }

    let cancelled = false

    Promise.all(
      validPaths.map(path =>
        fetch(`/api/signed-url?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`)
          .then(r => r.json())
          .then(data => ({ path, url: data.url as string | undefined }))
          .catch(() => ({ path, url: undefined }))
      )
    ).then(results => {
      if (cancelled) return
      const m = new Map<string, string>()
      for (const { path, url } of results) {
        if (url) m.set(path, url)
      }
      setUrls(m)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, paths.join("|")])

  return urls
}
