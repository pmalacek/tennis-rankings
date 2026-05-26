
import db from "../../lib/db";

export default async function handler(req, res) {
  const result = await db.query(`
    SELECT * FROM rankings_snapshots
    WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM rankings_snapshots)
    ORDER BY rank ASC LIMIT 1000
  `);
  res.json(result.rows);
}
