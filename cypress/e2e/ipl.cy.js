describe('IPL Website Test', () => {
    beforeEach(() => {
        // Handle uncaught exceptions
        cy.on('uncaught:exception', (err, runnable) => {
            // returning false here prevents Cypress from failing the test
            console.log('Uncaught exception:', err.message);
            return false;
        });
    });

    it('should load the IPL results page and log team names', () => {
        // Visit the IPL results page
        cy.visit('https://www.iplt20.com/matches/results');

        // Wait for the page to load
        cy.wait(5000);

        // Get all matches from the team_archive element
        let arrOfObj = [];
        cy.get('#team_archive li').each(($match, index) => {
            // Get match order (e.g., Match 51)
            const matchOrder = $match.find('.vn-matchOrder').text().trim();

            // Get venue information
            const venue = $match.find('.vn-venueDet p').text().trim();

            // Get match date and time
            const dateTime = $match.find('.vn-matchDateTime').text().trim();

            // Get match result
            const result = $match.find('.vn-ticketTitle').text().trim();

            // Get home team information
            const homeTeam = {
                name: $match.find('.vn-shedTeam:first .vn-teamName h3').text().trim(),
                code: $match.find('.vn-shedTeam:first .vn-teamCode h3').text().trim(),
                isFirstBatting: $match.find('.vn-shedTeam:first .vn-teamCode h3').attr('ng-if')?.includes('FirstBattingTeamID') || false,
                score: $match.find('.vn-shedTeam:first p').text().trim(),
                overs: $match.find('.vn-shedTeam:first .ov-display').text().trim()
            };

            // Get away team information
            const awayTeam = {
                name: $match.find('.vn-shedTeam:last .vn-teamName h3').text().trim(),
                code: $match.find('.vn-shedTeam:last .vn-teamCode h3').text().trim(),
                isFirstBatting: $match.find('.vn-shedTeam:last .vn-teamCode h3').attr('ng-if')?.includes('FirstBattingTeamID') || false,
                score: $match.find('.vn-shedTeam:last p').text().trim(),
                overs: $match.find('.vn-shedTeam:last .ov-display').text().trim()
            };

            // Get match report link if available
            const matchReportLink = $match.find('.matchReportIcon').attr('href');

            // Get highlights link if available
            const highlightsLink = $match.find('.matchHLIcon').attr('href');
            const newObj = {
                matchOrder,
                venue,
                dateTime,
                result,
                homeTeam,
                awayTeam,
                matchReportLink,
                highlightsLink
            }; 
            arrOfObj.push(newObj);
        }).then(() => {
            cy.readFile('cypress/fixtures/team_data.json', { timeout: 10000 }).then((existingData = []) => {
                console.log(existingData, 'Existing team data');
    console.log(arrOfObj, 'Newly scraped data');

    // Filter only NEW matches that do NOT exist in existingData
    const newMatches = arrOfObj.filter(
      newItem => !existingData.some(existingItem => existingItem.matchOrder === newItem.matchOrder)
    );

    // Send Telegram message for each new match
    newMatches.forEach(match => {
      const message = `🏏 *New Match Update!*\n\n` +
        `*${match.homeTeam.name} vs ${match.awayTeam.name}*\n` +
        `📍 Venue: ${match.venue}\n🕒 ${match.dateTime}\n📊 Result: ${match.result}\n` +
        `[Match Report](${match.matchReportLink}) | [Highlights](${match.highlightsLink})`;

      cy.request({
        method: 'POST',
        url: `https://api.telegram.org/bot8064793125:AAHbWbXDjsCWt1hBdTBUHK7NztvpWwAPCwM/sendMessage`,
        body: {
          chat_id: '-4730818470',
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        }
      });
    });

    // ✅ Combine old + new matches, avoiding duplicates
    const updatedData = [
      ...existingData,
      ...newMatches
    ];

    cy.writeFile('cypress/fixtures/team_data.json', JSON.stringify(updatedData, null, 2));
    cy.log('New matches sent to Telegram and file updated.');
              });
        });
    })
}) 