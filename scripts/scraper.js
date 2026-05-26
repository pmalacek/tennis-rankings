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

  while (allPlayers.length < 1000) {
    console.log(`Scraping page, current total: ${allPlayers.length}`);

    await page.waitForSelector("table tbody tr");

    const players = await page.evaluate(() => {
      const rows = document.querySelectorAll("table tbody tr");

      return Array.from(rows)
        .map((row) => {
          const cols = row.querySelectorAll("td");
          if (cols.length < 6) return null;

          return {
            rank: parseInt(cols[0]?.innerText),
            name: cols[1]?.innerText.trim(),
            country: cols[3]?.innerText.trim(),
            points: parseFloat(cols[5]?.innerText),
          };
        })
        .filter(Boolean);
    });

    allPlayers.push(...players);

    console.log(`Collected: ${allPlayers.length}`);

    const nextButton = await page.$("button[aria-label='Next page']");

    if (!nextButton) {
      console.log("No next button found.");
      break;
    }

