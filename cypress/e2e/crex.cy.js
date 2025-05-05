describe('CREX Cricket Website Test', () => {
    beforeEach(() => {
        // Handle uncaught exceptions
        cy.on('uncaught:exception', (err, runnable) => {
            console.log('Uncaught exception:', err.message);
            return false;
        });
    });

    it('should visit CREX, go to live match, and log each over data with over number or result', () => {
        // Visit the CREX cricket website
        cy.visit('https://crex.com/');

        // Wait for the live match cards to appear, get the first one's parent <a>, and log its href
        cy.get('a[href*="/scoreboard/"] .live-card-middle', { timeout: 20000 })
            .should('be.visible')
            .first()
            .parents('a[href*="/scoreboard/"]')
            .invoke('attr', 'href')
            .then((liveMatchUrl) => {
                cy.log('Live Match URL:', liveMatchUrl);

                // Optionally, visit the live match page
                cy.visit(`https://crex.com${liveMatchUrl}`);

                let resultFound = false; // Flag to stop polling after result
                const allOverUpdates = []; // Array to collect all updates

                // Poll for overs or result
                Cypress._.times(12, (i) => {
                    cy.wait(5000 * i).then(() => {
                        if (resultFound) return; // Stop if result already found

                        cy.get('body').then($body => {
                            const overUpdates = [];
                            // Check if overs-slide exists
                            if ($body.find('.overs-slide .content').length > 0 && $body.find('.overs-slide .content .total').length > 0) {
                                $body.find('.overs-slide .content').each((_, contentEl) => {
                                    const $content = Cypress.$(contentEl);
                                    $content.find('.total').each((idx, totalEl) => {
                                        // Get balls for this over
                                        const balls = [];
                                        let $el = Cypress.$(totalEl).prev();
                                        while ($el.length && $el.hasClass('over-ball')) {
                                            balls.unshift($el.text().trim());
                                            $el = $el.prev();
                                        }
                                        // Find the over number from the preceding <span>
                                        let overNumber = null;
                                        while ($el.length) {
                                            if ($el[0].tagName === 'SPAN') {
                                                const text = $el.text().trim();
                                                const match = text.match(/^(\d+)[a-z]{2} Over:/i);
                                                if (match) {
                                                    overNumber = parseInt(match[1], 10);
                                                }
                                                break;
                                            }
                                            $el = $el.prev();
                                        }
                                        // Get total as number
                                        let total = Cypress.$(totalEl).text().replace('=', '').trim();
                                        if (total) total = parseInt(total, 10);

                                        // If over number is not found, infer as last over + 1
                                        if (overNumber === null && overUpdates.length > 0) {
                                            overNumber = overUpdates[overUpdates.length - 1].over + 1;
                                        }

                                        if (balls.length > 0 && total && overNumber !== null) {
                                            const overObj = {
                                                over: overNumber,
                                                balls: balls.join(','),
                                                total: total
                                            };
                                            overUpdates.push(overObj);

                                            // Only add if not already present in allOverUpdates
                                            if (!allOverUpdates.some(o => o.over === overObj.over && o.balls === overObj.balls && o.total === overObj.total)) {
                                                allOverUpdates.push(overObj);
                                            }
                                        }
                                    });
                                });
                            } else {
                                // If no overs, get the result
                                const resultText = $body.find('.team-result .result-box .font3.font4').text().trim();
                                if (resultText) {
                                    const resultObj = { result: resultText };
                                    allOverUpdates.push(resultObj);
                                    resultFound = true; // Set flag to stop further polling

                                    // Save to file immediately when result is found
                                    cy.writeFile('cypress/results/overUpdates.json', allOverUpdates);
                                }
                            }

                            if(allOverUpdates.length == 0){
                                const resultText = $body.find('.team-result .result-box .font3').text().trim();
                                if (resultText) {
                                    const resultObj = { result: resultText };
                                    allOverUpdates.push(resultObj);
                                    // resultFound = true; // Set flag to stop further polling

                                    // Save to file immediately when result is found
                                    cy.writeFile('cypress/results/overUpdates.json', allOverUpdates);
                                }
                            }

                            // Log all overs or result found in this poll
                            cy.log(`Overs/Result at poll [${i + 1}]: ${JSON.stringify(overUpdates)}`);
                            console.log(`Overs/Result at poll [${i + 1}]:`, overUpdates);

                            // If this is the last poll and result wasn't found, save whatever we have
                            if (i === 11 && !resultFound) {
                                cy.writeFile('cypress/results/overUpdates.json', allOverUpdates);
                            }
                        });
                });
            });
        });
    });
}); 