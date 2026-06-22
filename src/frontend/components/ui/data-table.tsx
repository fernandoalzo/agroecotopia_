import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/frontend/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/frontend/context/LanguageContext";
import { Loading } from "@/frontend/components/ui/Loading";

interface DataTableProps<TData, TValue = any> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
  
  // Pagination
  pageCount?: number;
  currentPage?: number;
  pageSize?: number;
  totalEntries?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  
  // Empty State
  emptyTitle?: string;
  emptyDescription?: React.ReactNode;
  emptyIcon?: React.ElementType;
  
  // Interaction & Styling
  onRowClick?: (row: TData) => void;
  selectedRowId?: string | number | null;
  getRowId?: (row: TData) => string | number;
  getRowClassName?: (row: TData, index: number) => string;
  
  // Stats rendering block (optional custom left footer)
  footerLeftContent?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  pageCount = 1,
  currentPage = 1,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  emptyTitle,
  emptyDescription,
  emptyIcon: EmptyIcon,
  onRowClick,
  selectedRowId,
  getRowId,
  getRowClassName,
  footerLeftContent,
}: DataTableProps<TData, TValue>) {
  const { t } = useLanguage();
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      {/* Table Container */}
      <div className="flex-1 overflow-auto overscroll-contain relative border-y border-border/20">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
            <Loading text={t.dataTable.loading} subtext="" className="py-0 scale-75" />
          </div>
        )}
        <Table>
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b border-border/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-10 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 py-2"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => {
                const isSelected = getRowId && selectedRowId !== undefined
                  ? getRowId(row.original) === selectedRowId
                  : false;

                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer group",
                      getRowClassName?.(row.original, i)
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48" />
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center text-muted-foreground hover:bg-transparent">
                  <div className="flex flex-col items-center justify-center w-full">
                    {EmptyIcon && <EmptyIcon className="h-10 w-10 text-muted-foreground/30 mb-4" />}
                    <p className="text-sm font-semibold text-muted-foreground">
                      {emptyTitle || t.dataTable.emptyTitle}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1 max-w-md">
                      {emptyDescription || t.dataTable.emptyDescription}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer / Pagination */}
      <div className="pt-4 pb-2 shrink-0">
        {footerLeftContent && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
            {footerLeftContent}
          </div>
        )}
        
        <div className="flex items-center justify-between border-t border-border/20 pt-4">
          {/* Left: Size selector */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs font-medium">{t.dataTable.rowsPerPage}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="h-8 rounded-md border border-border/40 bg-transparent px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          {/* Right: Shadcn Pagination */}
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) onPageChange?.(currentPage - 1);
                  }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  {t.dataTable.previous}
                </PaginationPrevious>
              </PaginationItem>

              <PaginationItem>
                <span className="text-xs font-medium px-4 text-muted-foreground">
                  {t.dataTable.page} <strong className="text-foreground">{currentPage}</strong> {t.dataTable.of} {pageCount}
                </span>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < pageCount) onPageChange?.(currentPage + 1);
                  }}
                  className={currentPage >= pageCount ? "pointer-events-none opacity-50" : ""}
                >
                  {t.dataTable.next}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
