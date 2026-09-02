import { useState, useCallback, useMemo } from 'react';
import {
  books as initialBooks,
  getCategoriesWithCounts,
  createBookRecord,
} from '../data/books';
import { BookContext } from './BookContext';

export const BookProvider = ({ children }) => {
  const [catalog, setCatalog] = useState(initialBooks);

  const addBook = useCallback((data) => {
    const record = createBookRecord(data);
    setCatalog((prev) => [...prev, record]);
    return record;
  }, []);

  const updateBook = useCallback((id, data) => {
    let updated;
    setCatalog((prev) =>
      prev.map((book) => {
        if (book.id !== Number(id)) return book;
        updated = { ...book, ...data, id: book.id };
        const availableCopies = (updated.copies || []).filter(
          (c) => c.status === 'available'
        ).length;
        return {
          ...updated,
          totalCopies: updated.copies ? updated.copies.length : book.totalCopies,
          availableCopies,
          available: availableCopies > 0,
        };
      })
    );
    return updated;
  }, []);

  const deleteBook = useCallback((id) => {
    setCatalog((prev) => prev.filter((b) => b.id !== Number(id)));
  }, []);

  const getBook = useCallback(
    (id) => catalog.find((b) => b.id === Number(id)) || null,
    [catalog]
  );

  const categories = useMemo(() => getCategoriesWithCounts(catalog), [catalog]);

  const value = useMemo(
    () => ({
      books: catalog,
      categories,
      addBook,
      updateBook,
      deleteBook,
      getBook,
    }),
    [catalog, categories, addBook, updateBook, deleteBook, getBook]
  );

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
};
