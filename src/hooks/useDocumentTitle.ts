import { useEffect } from 'react'

/** Définit le titre du document le temps du montage, puis le restaure. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
