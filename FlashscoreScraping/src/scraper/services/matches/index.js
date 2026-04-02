import { openPageAndNavigate, waitForSelectorSafe } from "../../index.js";

export const getMatchLinks = async (context, leagueSeasonUrl, type) => {
  const page = await openPageAndNavigate(context, `${leagueSeasonUrl}/${type}`);

  const LOAD_MORE_SELECTOR = '.wcl-buttonLink_jmSkY';
  const MATCH_SELECTOR = ".event__match";
  const CLICK_DELAY = 2200; // 2.2 seconds for safety
  const MAX_LOAD_CYCLES = 12; // To get roughly a month's worth of games

  let cycles = 0;
  while (cycles < MAX_LOAD_CYCLES) {
    const countBefore = await page.$$eval(MATCH_SELECTOR, (els) => els.length);

    try {
      // Scroll to bottom to ensure button is visible
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000); 

      // Target the specific button provided by the user
      const loadMoreBtn = await page.waitForSelector('.wcl-buttonLink_jmSkY', { timeout: 5000 });
      if (!loadMoreBtn) break;
      
      await loadMoreBtn.click();
      console.log(`[Scraper] Clicked "Load More" cycle ${cycles + 1}`);
      await page.waitForTimeout(CLICK_DELAY);
    } catch {
      console.log(`[Scraper] Load More button not found or already expanded after ${cycles} cycles.`);
      break;
    }

    const countAfter = await page.$$eval(MATCH_SELECTOR, (els) => els.length);
    if (countAfter === countBefore) {
       break; // Content didnt change
    }
    
    cycles++;
  }

  await waitForSelectorSafe(page, [MATCH_SELECTOR]);

  const matchIdList = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(".event__match")
    ).map((element) => {
      const id = element?.id?.replace("g_1_", "");
      const url = element.querySelector("a.eventRowLink")?.href ?? null;
      return { id, url };
    });
  });

  await page.close();

  console.info(`✅ Found ${matchIdList.length} matches for ${type}`);
  return matchIdList;
};

export const getMatchData = async (context, { id: matchId, url }) => {
  const page = await openPageAndNavigate(context, url);

  await waitForSelectorSafe(page, [
    ".duelParticipant__startTime",
    ".duelParticipant__home .participant__participantName",
    ".duelParticipant__away .participant__participantName",
  ]);

  const matchData = await page.evaluate(() => {
    return {
      date: document.querySelector(".duelParticipant__startTime")?.innerText.trim(),
      home: {
        name: document.querySelector(".duelParticipant__home .participant__participantName")?.innerText.trim(),
      },
      away: {
        name: document.querySelector(".duelParticipant__away .participant__participantName")?.innerText.trim(),
      },
    };
  });

  await page.close();
  return { matchId, ...matchData };
};
