'use client'

export type TOCEntry = {
  level: number
  title: string
  id: string
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function extractTOC(markdown: string): TOCEntry[] {
  const lines = markdown.split('\n')
  const result: TOCEntry[] = []

  lines.forEach(line => {
    const match = line.match(/^(#{1,3})\s+(.*)$/)
    if (match) {
      const level = match[1].length
      const title = match[2].trim()
      const id = slugifyHeading(title)
      result.push({ level, title, id })
    }
  })

  return result
}
