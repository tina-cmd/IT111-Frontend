import { useEffect } from "react";

/**
 * Custom hook to set the document title.
 * @param {string} title - The title to set for the document.
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}