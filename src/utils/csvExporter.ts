/**
 * Utility helper to export JavaScript object arrays to downloadable CSV files
 */
export const exportToCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || !rows.length) {
    console.warn("No data available to export to CSV");
    return;
  }

  // Extract keys for header
  const headers = Object.keys(rows[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of rows) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === "object") {
        if (val.toDate) {
          // Firestore Timestamp
          return `"${val.toDate().toISOString()}"`;
        }
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(","));
  }

  // Create Blob and trigger download
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
