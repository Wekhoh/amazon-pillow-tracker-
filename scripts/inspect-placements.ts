import * as XLSX from "xlsx";
import dotenv from "dotenv";
dotenv.config();

const path = process.env.EXCEL_SOURCE_PATH!;
const wb = XLSX.readFile(path, { cellDates: true });

for (const label of ["BLK Placement明细", "DBL Placement明细"]) {
	if (!wb.Sheets[label]) {
		console.log(`\nMISSING: ${label}`);
		continue;
	}
	const ws = wb.Sheets[label];
	const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
	console.log(`\n=== ${label} ===`);
	console.log(
		`Range: ${ws["!ref"]} (rows: ${range.e.r + 1}, cols: ${range.e.c + 1})`,
	);
	for (let r = 0; r <= Math.min(4, range.e.r); r++) {
		const row: string[] = [];
		for (let c = 0; c <= Math.min(24, range.e.c); c++) {
			const addr = XLSX.utils.encode_cell({ r, c });
			const cell = ws[addr];
			row.push(cell ? String(cell.v).slice(0, 18) : "");
		}
		console.log(`R${r}:`, row.map((v, i) => `[${i}]${v}`).join(" "));
	}
}
