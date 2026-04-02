import { openPageAndNavigate, waitForSelectorSafe } from "../../index.js";

export const getMatchLinks = async (context, leagueSeasonUrl, type) => {
  const page = await openPageAndNavigate(context, `${leagueSeasonUrl}/${type}`);

  const LOAD_MORE_SELECTOR = '[data-testid="wcl-buttonLink"]';
  const MATCH_SELECTOR = ".event__match";
  const CLICK_DELAY = 600;
  const MAX_EMPTY_CYCLES = 4;

  let emptyCycles = 0;

  while (true) {
    const countBefore = await page.$$eval(MATCH_SELECTOR, (els) => els.length);

    const loadMoreBtn = await page.$(LOAD_MORE_SELECTOR);
    if (!loadMoreBtn) break;

    try {
      await loadMoreBtn.click();
      await page.waitForTimeout(CLICK_DELAY);
    } catch {
      break;
    }

    const countAfter = await page.$$eval(MATCH_SELECTOR, (els) => els.length);

    if (countAfter === countBefore) {
      emptyCycles++;
      if (emptyCycles >= MAX_EMPTY_CYCLES) break;
    } else {
      emptyCycles = 0;
    }
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
