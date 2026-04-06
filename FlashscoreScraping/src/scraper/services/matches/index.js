import { openPageAndNavigate, waitForSelectorSafe } from "../../index.js";

export const getMatchLinks = async (context, leagueSeasonUrl, type) => {
  const isSummaryPage = leagueSeasonUrl.includes("/futebol/portugal/");
  const targetUrl = isSummaryPage ? leagueSeasonUrl : `${leagueSeasonUrl}/${type}`;
  
  const page = await openPageAndNavigate(context, targetUrl);

  if (isSummaryPage) {
    console.log(`[Scraper] Summary page detected. Switching to "Agendados" tab...`);
    try {
      // Click the "Agendados" tab if it exists
      const agendadosBtn = await page.locator('text="Agendados"');
      await agendadosBtn.click();
      await page.waitForTimeout(2000); 
    } catch (err) {
      console.warn(`[Scraper] Could not click "Agendados" tab. Using default view.`);
    }
  }

  const LOAD_MORE_SELECTOR = '.wcl-buttonLink_jmSkY';
  const MATCH_SELECTOR = ".event__match";
  const CLICK_DELAY = 2200; 
  const MAX_LOAD_CYCLES = 12;

  // For summary pages, we usually don't need "Load More", but we'll try for robustness
  if (!isSummaryPage) {
    let cycles = 0;
    while (cycles < MAX_LOAD_CYCLES) {
      const countBefore = await page.$$eval(MATCH_SELECTOR, (els) => els.length);
      try {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000); 
        const loadMoreBtn = await page.waitForSelector(LOAD_MORE_SELECTOR, { timeout: 3000 });
        if (!loadMoreBtn) break;
        await loadMoreBtn.click();
        console.log(`[Scraper] Clicked "Load More" cycle ${cycles + 1}`);
        await page.waitForTimeout(CLICK_DELAY);
      } catch {
        break;
      }
      const countAfter = await page.$$eval(MATCH_SELECTOR, (els) => els.length);
      if (countAfter === countBefore) break;
      cycles++;
    }
  }

  await waitForSelectorSafe(page, [MATCH_SELECTOR]);

  const matchIdList = await page.evaluate(() => {
    const ALLOWED_LEAGUES = [
      "Liga Portugal Betclic",
      "Liga Portugal 2",
      "Taça de Portugal",
      "Taça da Liga",
      "Supertaça"
    ];

    const results = [];
    let currentLeague = "Unknown League";

    const container = document.querySelector(".leagues--live") || document.querySelector(".sportName.soccer");
    if (!container) return [];

    const items = container.querySelectorAll(".headerLeague__title, .event__match");
    
    items.forEach(el => {
      if (el.classList.contains('headerLeague__title')) {
        const fullTitle = el.innerText.trim();
        currentLeague = fullTitle.split(':').pop()?.trim() || "Unknown";
      } else if (el.classList.contains('event__match')) {
        // Skip unless league is in ALLOWED_LEAGUES (partial match for safety)
        const isAllowed = ALLOWED_LEAGUES.some(allowed => currentLeague.toLowerCase().includes(allowed.toLowerCase()));
        if (!isAllowed) return;

        const id = el?.id?.replace("g_1_", "");
        const url = el.querySelector("a.eventRowLink")?.href ?? null;
        
        if (id && url) {
          results.push({ id, url, league: currentLeague });
        }
      }
    });

    return results;
  });

  await page.close();
  console.info(`✅ Found ${matchIdList.length} matches for ${type}`);
  return matchIdList;
};

export const getMatchData = async (context, { id: matchId, url, league }) => {
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
  return { matchId, ...matchData, league };
};
