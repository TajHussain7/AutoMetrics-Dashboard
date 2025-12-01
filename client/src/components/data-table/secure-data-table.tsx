import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { BlurOverlay } from "@/components/auth/blur-overlay";

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (value: any) => React.ReactNode;
}

interface EnhancedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function SecureDataTable<T extends { id: string }>({
  data,
  columns,
  onRefresh,
  isLoading,
}: EnhancedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuth();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredData.map((item) => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const filteredData = React.useMemo(() => {
    return data.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? result : -result;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="relative">
        <div className="opacity-10">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={String(column.accessor)}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={String(column.accessor)}>•••••</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <BlurOverlay />
      </div>
    );
  }

  return (
    <Card className="p-4 bg-white border border-slate-200 shadow-sm">
      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            Refresh
          </Button>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    sortedData.length > 0 &&
                    sortedData.every((item) => selectedRows.has(item.id))
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {columns.map((column) => (
                <TableHead
                  key={String(column.accessor)}
                  className="cursor-pointer"
                  onClick={() => handleSort(String(column.accessor))}
                >
                  {column.header}
                  {sortColumn === column.accessor && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(item.id)}
                    onCheckedChange={() => handleSelectRow(item.id)}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={String(column.accessor)}>
                    {column.render
                      ? column.render(item[column.accessor])
                      : String(item[column.accessor] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
