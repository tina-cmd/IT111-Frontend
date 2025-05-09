import { useEffect } from "react";

/**
 * Custom hook to set the document title.
 * @param title - The title to set for the document.
 */
export default function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
