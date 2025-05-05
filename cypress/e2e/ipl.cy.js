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
            cy.readFile('cypress/fixtures/team_data.json').then((existingData) => {
                console.log(existingData, 'Existing team data');
              
                // New data you want to write
                if(arrOfObj.length > existingData.length){

                    const TELEGRAM_BOT_TOKEN = '8064793125:AAHbWbXDjsCWt1hBdTBUHK7NztvpWwAPCwM';
                    const TELEGRAM_CHAT_ID = '-4730818470';
                    const newMatch = arrOfObj[0];

                const message = `🏏 *New Match Update!*\n\n` +
                    `*${newMatch.homeTeam.name} vs ${newMatch.awayTeam.name}*\n` +
                    `📍 Venue: ${newMatch.venue}\n🕒 ${newMatch.dateTime}\n📊 Result: ${newMatch.result}\n` +
                    `[Match Report](${newMatch.matchReportLink}) | [Highlights](${newMatch.highlightsLink})`;

                cy.request({
                    method: 'POST',
                    url: `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                    body: {
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: false
                    }
                });
                }


                console.log(arrOfObj, 'arrOfObj');
              
                // Write new data to the same file
                cy.writeFile('cypress/fixtures/team_data.json', JSON.stringify(arrOfObj, null, 2));
                cy.log('Team data has been written to team_data.json');
              });
        });
    })
}) 