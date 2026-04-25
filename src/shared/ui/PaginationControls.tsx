"use client";

type PaginationControlsProps = {
  totalItems: number;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function PaginationControls({
  totalItems,
  page,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="pagination-bar">
      <p className="muted">
        Showing {startIndex}-{endIndex} of {totalItems}
      </p>
      <div className="pagination-actions">
        <select
          className="input pagination-size"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <button
          className="btn"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Prev
        </button>
        <span className="pagination-page muted">
          Page {safePage} / {totalPages}
        </span>
        <button
          className="btn"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
