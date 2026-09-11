import { useState, useCallback, useMemo, useEffect } from 'react';
import { booksApi } from '../services/books';
import { BookContext } from './BookContext';

export const BookProvider = ({ children }) => {
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const [listResult, catResult] = await Promise.all([
        booksApi.list({ limit: 100 }),
        booksApi.categories(),
      ]);
      setCatalog(listResult?.books || []);
      setCategories(catResult || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const addBook = useCallback(
    async (data) => {
      const record = await booksApi.create(data);
      setCatalog((prev) => [record, ...prev]);
      refreshCatalog();
      return record;
    },
    [refreshCatalog]
  );

  const updateBook = useCallback(
    async (id, data) => {
      const record = await booksApi.update(id, data);
      setCatalog((prev) => prev.map((b) => (b.id === record.id ? record : b)));
      refreshCatalog();
      return record;
    },
    [refreshCatalog]
  );

  const deleteBook = useCallback(
    async (id) => {
      await booksApi.remove(id);
      setCatalog((prev) => prev.filter((b) => b.id !== id));
    },
    []
  );

  const getBook = useCallback(
    async (id) => {
      const existing = catalog.find((b) => String(b.id) === String(id));
      if (existing) return existing;
      try {
        return await booksApi.get(id);
      } catch {
        return null;
      }
    },
    [catalog]
  );

  const getCategoriesWithCounts = useCallback(
    () =>
      categories.length
        ? categories
        : catalog.reduce((acc, b) => {
            const existing = acc.find((c) => c.name === b.category);
            if (existing) existing.count += 1;
            else acc.push({ name: b.category, count: 1 });
            return acc;
          }, []),
    [catalog, categories]
  );

  const value = useMemo(
    () => ({
      books: catalog,
      categories,
      getCategoriesWithCounts,
      loading,
      error,
      addBook,
      updateBook,
      deleteBook,
      getBook,
      refreshCatalog,
    }),
    [catalog, categories, getCategoriesWithCounts, loading, error, addBook, updateBook, deleteBook, getBook, refreshCatalog]
  );

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
};