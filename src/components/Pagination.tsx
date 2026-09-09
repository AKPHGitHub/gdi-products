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
    <div className="flex gap-4 items-center justify-center my-4">
      <button onClick={onPrev} disabled={!hasPrev} aria-label="Previous">
        Previous
      </button>
      <span>
        Page {page}
        {totalPages != null ? ` of ${totalPages}` : ''}
      </span>
      <button onClick={onNext} disabled={!hasNext} aria-label="Next">
        Next
      </button>
    </div>
  );
}
