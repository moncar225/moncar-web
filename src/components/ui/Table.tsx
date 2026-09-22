interface Column<T> {
  key: string
  header: string
  /** Contenu de la cellule ; par défaut la valeur brute du champ `key`. */
  render?: (row: T) => ReactNode
  align?: 'left' | 'right'
}

interface TableProps<T> {
  columns: Array<Column<T>>
  rows: T[]
  /** Clé unique de ligne (id…). */
  rowKey: (row: T) => string
  caption: string
}

import type { ReactNode } from 'react'

/** Tableau du Design System MON CAR (scroll horizontal sur mobile). */
export function Table<T>({ columns, rows, rowKey, caption }: TableProps<T>) {
  return (
    <div className="mc-table-wrap">
      <table className="mc-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" style={column.align === 'right' ? { textAlign: 'right' } : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} style={column.align === 'right' ? { textAlign: 'right' } : undefined}>
                  {column.render !== undefined
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
