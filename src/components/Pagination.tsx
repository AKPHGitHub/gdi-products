export function Pagination({
  page,
  onPrev,
  onNext,
  hasNext = true,
  hasPrev = true,
  totalPages = null as number | null,
}: {
  page: number;
  onPrev: () => void;
  onNext: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  totalPages?: number | null;
}) {
  return (
    <div data-testid="pagination" className="flex gap-4 items-center justify-center my-4">
      <button data-testid="prev-btn" onClick={onPrev} disabled={!hasPrev} aria-label="Previous">
        Previous
      </button>
      <span data-testid="page-indicator">
        Page {page}
        {totalPages != null ? ` of ${totalPages}` : ''}
      </span>
      <button data-testid="next-btn" onClick={onNext} disabled={!hasNext} aria-label="Next">
        Next
      </button>
    </div>
  );
}
