export const copyNoun = (count) => (Number(count) === 1 ? 'Copy' : 'Copies');

export const totalCopiesLabel = (book) => {
  const total = Number(book?.totalCopies ?? 0);
  return `${total} ${copyNoun(total)}`;
};

export const reservedAvailableLabel = (book) => {
  const reserved = Number(book?.displayReservedCopies ?? book?.reservedCopies ?? 0);
  const available = Number(book?.displayAvailableCopies ?? book?.availableCopies ?? 0);
  const availableLabel = `${available} Available`;
  return reserved > 0 ? `${reserved} ${copyNoun(reserved)} Reserved | ${availableLabel}` : availableLabel;
};

export const availabilityVariant = (book) => {
  const available = Number(book?.displayAvailableCopies ?? book?.availableCopies ?? 0);
  return available > 0 ? 'success' : 'danger';
};

export default {
  copyNoun,
  totalCopiesLabel,
  reservedAvailableLabel,
  availabilityVariant,
};
