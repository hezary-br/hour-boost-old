export const toSQL = (values: any[]) => `(${values.map(v => JSON.stringify(v)).join(", ")})`.trim()
export const toPostgreSQL = (values: any[]) =>
  `(${values.map(v => JSON.stringify(v).replaceAll('"', "'")).join(", ")})`.trim()
export const toSQLDate = (date: Date) => date.toISOString().slice(0, 19).replace("T", " ")
