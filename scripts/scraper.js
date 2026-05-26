
import puppeteer from "puppeteer";
import db from "../lib/db.js";

export default async function scrape() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://www.itftennis.com/en/rankings/world-tennis-tour-junior-rankings/?juniorRankingType=ITF", { waitUntil: "networkidle2" });

  const players = await page.evaluate(() => {
    const rows = document.querySelectorAll("table tbody tr");
    return Array.from(rows).map(r => {
      const c = r.querySelectorAll("td");
      return {
        rank: parseInt(c[0]?.innerText),
        name: c[1]?.innerText.trim(),
        country: c[3]?.innerText.trim(),
        points: parseFloat(c[5]?.innerText)
      };
    });
  });

  await browser.close();

  const today = new Date().toISOString().split("T")[0];

  for (const p of players) {
    await db.query(
      `INSERT INTO rankings_snapshots (player_name, rank, country, points, snapshot_date) VALUES ($1,$2,$3,$4,$5)`,
      [p.name, p.rank, p.country, p.points, today]
    );
  }

  console.log("Scrape complete");
}

scrape();
}
