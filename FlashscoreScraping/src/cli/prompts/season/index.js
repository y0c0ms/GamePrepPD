import inquirer from "inquirer";

import { getListOfSeasons } from "../../../scraper/services/seasons/index.js";

import { start, stop } from "../../loader/index.js";

export const selectSeason = async (context, leagueUrl) => {
  start();
  const seasons = await getListOfSeasons(context, leagueUrl);
  stop();

  // If running in CI environment (GitHub Actions), default to current season without prompting
  if (process.env.CI === 'true' || !process.stdout.isTTY) {
    const defaultSeason = seasons[0];
    console.info(
      `✔ Non-interactive environment detected. Defaulting to current season: ${defaultSeason.name}`
    );
    return defaultSeason;
  }

  const options = seasons.map((season) => season.name);

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Select a league season:",
      choices: [...options, "Cancel", new inquirer.Separator()],
    },
  ]);

  if (choice === "Cancel") {
    console.info("\nNo option selected. Exiting...\n");
    throw Error;
  }

  return seasons.find((season) => season.name === choice);
};
