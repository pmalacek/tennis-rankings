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

  let allPlayers = [];

  while (true) {
    console.log(`Scraping page, current total: ${allPlayers.length}`);

    await page.waitForSelector("table tbody tr");

    const players = await page.evaluate(() => {
      const rows = document.querySelectorAll("table tbody tr");

      return Array.from(rows)
        .map((row) => {
          const cols = row.querySelectorAll("td");
          if (cols.length < 6) return null;

          return {
            rank: parseInt(cols[0]?.innerText || "0"),
            name: cols[1]?.innerText.trim(),
            country: cols[3]?.innerText.trim(),
            points: parseFloat(cols[5]?.innerText || "0"),
          };
        })
        .filter(Boolean);
    });

    allPlayers.push(...players);

    console.log(`Collected total: ${allPlayers.length}`);

    // stop if we reached 1000
    if (allPlayers.length >= 1000) {
      break;
    }

    const nextButton = await page.$("button[aria-label='Next page']");

    if (!nextButton) {
      console.log("No next button found, stopping.");
      break;
    }

    const isDisabled = await page.evaluate(btn => btn.disabled, nextButton);

    if (isDisabled) {
      console.log("Reached last page.");
      break;
    }

    await nextButton.click();

    // wait for next page load
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  await browser.close();

  console.log(`✅ Total players scraped: ${allPlayers.length}`);

  const today = new Date().toISOString().split("T")[0];

  for (const p of allPlayers.slice(0, 1000)) {
    try {
      await db.query(
        `INSERT INTO rankings_snapshots (player_name, rank, country, points, snapshot_date)
         VALUES ($1,$2,$3,$4,$5)`,
        [p.name, p.rank, p.country, p.points, today]
      );
    } catch (err) {
      console.error("DB insert error:", err.message);
    }
  }

  console.log("🎉 Scrape complete");
}

scrape().catch((err) => {
  console.error("❌ Scraper failed:", err);
  process.exit(1);
});
