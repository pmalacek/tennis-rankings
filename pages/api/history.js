
import db from "../../lib/db";

export default async function handler(req, res) {
  const { name } = req.query;
  const result = await db.query(
    `SELECT snapshot_date, rank, points FROM rankings_snapshots WHERE player_name=$1 ORDER BY snapshot_date ASC`,
    [name]
  );
  res.json(result.rows);
}
