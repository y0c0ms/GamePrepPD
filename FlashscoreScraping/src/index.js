import { chromium } from "playwright";
import pLimit from "p-limit";
import chalk from "chalk";

import { OUTPUT_PATH } from "./constants/index.js";
import { parseArguments } from "./cli/arguments/index.js";
import { promptUserOptions } from "./cli/prompts/index.js";
import { start, stop } from "./cli/loader/index.js";
import { initializeProgressbar } from "./cli/progressbar/index.js";

import {
  getMatchLinks,
  getMatchData,
} from "./scraper/services/matches/index.js";

import { writeDataToFile } from "./files/handle/index.js";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const withRetry = async (fn, retries = 3) => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    const delay = (4 - retries) * 500;
    console.warn(`⚠️ Retry in ${delay}ms...`);
    await sleep(delay);
    return withRetry(fn, retries - 1);
  }
};

(async () => {
  let browser;
  let context;

  try {
    const cliOptions = parseArguments();

    browser = await chromium.launch({ headless: cliOptions.headless });
    
    // User-Agent rotation for stealth
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    context = await browser.newContext({
      userAgent: randomUserAgent,
      viewport: { width: 1920, height: 1080 }
    });

    const { fileName, season, fileType } = await promptUserOptions(
      context,
      cliOptions
    );

    start();

    const matchLinks = await getMatchLinks(
      context,
      season?.url,
      "fixtures"
    );

    if (matchLinks.length === 0) {
      throw Error(
        `❌ No matches found on the results page\n` +
        `Please verify that the league name provided is correct`
      );
    }

    stop();

    const progressbar = initializeProgressbar(matchLinks.length);
    const limit = pLimit(cliOptions.concurrency);

    const matchData = {};
    let processedCount = 0;

    const tasks = matchLinks.map((matchLink) =>
      limit(async () => {
        // Random human-like delay between 1 and 3 seconds
        await sleep(Math.floor(Math.random() * 2000) + 1000);
        
        const data = await withRetry(() => getMatchData(context, matchLink));
        matchData[matchLink.id] = data;

        processedCount += 1;
        if (processedCount % cliOptions.saveInterval === 0) {
          writeDataToFile(matchData, fileName, fileType);
        }

        progressbar.increment();
      })
    );

    await Promise.all(tasks);

    progressbar.stop();
    writeDataToFile(matchData, fileName, fileType);

    console.info("\n✅ Data collection and file writing completed!");
    console.info(
      `📁 File saved to: ${chalk.cyan(
        `${OUTPUT_PATH}/${fileName}${fileType.extension}`
      )}\n`
    );
  } catch (error) {
    stop();
    if (error.message) console.error(`\n${error.message}\n`);
  } finally {
    await context?.close();
    await browser?.close();
  }
})();
