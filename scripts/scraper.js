import puppeteer from "puppeteer";
import db from "../lib/db.js";

async function scrape() {
  console.log("Starting scraper...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.goto(
    "https://www.itftennis.com/en/rankings/world-tennis-tour-junior-rankings/?juniorRankingType=ITF",
    { waitUntil: "networkidle2" }
  );

  console.log("Page loaded");

  const players = await page.evaluate(() => {
    const rows = document.querySelectorAll("table tbody tr");

    return Array.from(rows)
      .map((row) => {
        const cols = row.querySelectorAll("td");
        if (cols.length < 6) return null;

        return {
          rank: parseInt(cols[0].innerText) || null,
          name: cols[1].innerText.trim(),
          country: cols[3].innerText.trim(),
          points: parseFloat(cols[5].innerText) || 0,
        };
      })
      .filter(Boolean);
  });

  console.log(`Scraped ${players.length} players`);

  await browser.close();

  const today = new Date().toISOString().split("T")[0];

  for (const p of players) {
    try {
      await db.query(
        `INSERT INTO rankings_snapshots 
         (player_name, rank, country, points, snapshot_date)
         VALUES ($1,$2,$3,$4,$5)`,
        [p.name, p.rank, p.country, p.points, today]
      );
    } catch (err) {
      console.error("DB insert error:", err.message);
    }
  }

  console.log("✅ Scrape complete");
}

scrape().catch((err) => {
  console.error("❌ Scraper failed:", err);
  process.exit(1);
});
