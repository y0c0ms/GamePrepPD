import { openPageAndNavigate, waitForSelectorSafe } from "../../index.js";

export const getMatchLinks = async (context, leagueUrl, leagueName) => {
  const targetUrl = leagueUrl.endsWith("/") ? `${leagueUrl}lista/` : `${leagueUrl}/lista/`;
  const page = await openPageAndNavigate(context, targetUrl);

  const LOAD_MORE_SELECTOR = ".wcl-footer__button_OauhJ";
  const MATCH_SELECTOR = ".event__match";
  const CLICK_DELAY = 1500; 
  const MAX_LOAD_CYCLES = 12;

  console.info(`[Scraper] Starting pagination for ${leagueName}...`);

  // Pagination loop: Click "Mostrar mais jogos" until done
  let cycles = 0;
  while (cycles < MAX_LOAD_CYCLES) {
    try {
      // Scroll to bottom to ensure button is visible
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      const loadMoreBtn = await page.$(LOAD_MORE_SELECTOR);
      if (!loadMoreBtn) {
        console.info(`[Scraper] Pagination complete for ${leagueName} after ${cycles} cycles.`);
        break;
      }

      await loadMoreBtn.click();
      console.info(`[Scraper] Clicked "Show More" for ${leagueName} (Cycle ${cycles + 1})`);
      await page.waitForTimeout(CLICK_DELAY);
      cycles++;
    } catch (err) {
      break;
    }
  }

  // Wait for the final match container to be stable
  await waitForSelectorSafe(page, [MATCH_SELECTOR, ".no-scheduled-matches"], { timeout: 5000 });

  const now = new Date();
  const currentYear = now.getFullYear();

  const matchIdList = await page.evaluate(({ lName, cYear, todayDay, todayMonth }) => {
    const results = [];
    const container = document.querySelector(".sportName.soccer") || document.body;
    if (!container) return [];

    const matches = container.querySelectorAll(".event__match");
    
    matches.forEach(el => {
      const id = el?.id?.replace("g_1_", "");
      const url = el.querySelector("a.eventRowLink")?.href ?? null;
      const dateText = el.querySelector(".event__time")?.innerText?.trim() || ""; // Format: "DD.MM. HH:mm"
      
      if (!dateText || !id || !url) return;

      // Simple date filter: We only want today or future
      // dateText example: "06.04. 18:45"
      const [dayMonth, time] = dateText.split(" ");
      if (!dayMonth) return;
      const [day, month] = dayMonth.split(".").map(n => parseInt(n));

      // Comparison logic for today/future (handling year transition simply)
      // Since it's April, we only care about month >= 4
      if (month < todayMonth || (month === todayMonth && day < todayDay)) {
        return; // Skip past game
      }

      // Check for feminine/youth suffix in team names as a safety layer
      const teamText = el.innerText.toLowerCase();
      if (teamText.includes("feminina") || teamText.includes("sub-1") || teamText.includes("sub-2")) return;

      results.push({ id, url, league: lName, date: dateText });
    });

    return results;
  }, { 
    lName: leagueName, 
    cYear: currentYear, 
    todayDay: now.getDate(), 
    todayMonth: now.getMonth() + 1 
  });

  await page.close();
  
  if (matchIdList.length > 0) {
    console.info(`✅ Found ${matchIdList.length} future matches for ${leagueName}`);
  } else {
    console.info(`ℹ️ No future fixtures for ${leagueName}. Skipping.`);
  }

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
