export function PaginationControls({
  pageInfo,
  currentPage,
  onPageChange
}) {
  const pages = Math.max(1, pageInfo?.pages || 1);
  return <div className="table-pagination">
      <span>
        Showing page <strong>{currentPage}</strong> of {pages}
        {pageInfo?.total != null && <> · {pageInfo.total} records</>}
      </span>
      <div>
        <button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>Previous</button>
        <span className="page-current">{currentPage}</span>
        <button disabled={currentPage >= pages} onClick={() => onPageChange(currentPage + 1)}>Next</button>
      </div>
    </div>;
}
