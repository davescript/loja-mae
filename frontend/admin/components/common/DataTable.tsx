import * as React from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronUp, Search, Filter, MoreVertical } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { cn } from "../../../utils/cn"

export interface Column<T> {
  key: string
  header: string
  accessor?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (size: number) => void
  }
  selection?: {
    selected: string[]
    onSelect: (ids: string[]) => void
    getId: (row: T) => string
  }
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onRowClick,
  actions,
  searchable = true,
  searchPlaceholder = "Pesquisar...",
  onSearch,
  pagination,
  selection,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleSelectAll = (checked: boolean) => {
    if (!selection) return
    if (checked) {
      const allIds = data.map(selection.getId)
      setSelectedRows(new Set(allIds))
      selection.onSelect(allIds)
    } else {
      setSelectedRows(new Set())
      selection.onSelect([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!selection) return
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
    selection.onSelect(Array.from(newSelected))
  }

  React.useEffect(() => {
    if (selection) {
      setSelectedRows(new Set(selection.selected))
    }
  }, [selection?.selected])

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [data, sortColumn, sortDirection])

  return (
    <Card>
      {searchable && (
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {pagination && (
              <div className="text-sm text-muted-foreground">
                {pagination.total} resultados
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {selection && (
                  <th className="w-12 p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === data.length && data.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "p-4 text-left text-sm font-medium text-muted-foreground",
                      column.sortable && "cursor-pointer hover:bg-muted/70",
                      column.width
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortColumn === column.key && (
                        sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                ))}
                {actions && <th className="w-12 p-4"></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => {
                  const rowId = selection?.getId(row) || index.toString()
                  return (
                    <motion.tr
                      key={rowId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "border-b hover:bg-muted/50 transition-colors",
                        onRowClick && "cursor-pointer"
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selection && (
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(rowId)}
                            onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.key} className="p-4">
                          {column.accessor
                            ? column.accessor(row)
                            : row[column.key]}
                        </td>
                      ))}
                      {actions && (
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          {actions(row)}
                        </td>
                      )}
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Página {pagination.page} de {Math.ceil(pagination.total / pagination.pageSize)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

