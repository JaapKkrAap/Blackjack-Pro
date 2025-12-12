/**
 * Blackjack Strategy Engine voor Premier Blackjack (TOTO)
 *
 * Deze engine bevat alle basic strategy regels geïmplementeerd in code.
 * Geen gekopieerde tabellen - alle logica is zelf geïmplementeerd.
 *
 * Optimized version with:
 * - Query result caching
 * - Lookup tables for fast decisions
 * - Minimal object creation
 */

class BlackjackStrategy {
    constructor() {
        // Dealer kaart waarden voor logica
        this.dealerValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 10, 'Q': 10, 'K': 10, 'A': 11
        };

        // Cache voor herhaalde queries (max 100 entries)
        this.cache = new Map();
        this.cacheMaxSize = 100;

        // Pre-computed lookup tables voor snellere beslissingen
        this.initializeLookupTables();
    }

    /**
     * Initialize lookup tables voor common scenarios
     */
    initializeLookupTables() {
        // Dealer zwakke kaarten (2-6) - high bust probability
        this.weakDealerCards = new Set([2, 3, 4, 5, 6]);

        // Dealer sterke kaarten (7-A)
        this.strongDealerCards = new Set([7, 8, 9, 10, 11]);

        // Pairs die altijd split zijn
        this.alwaysSplitPairs = new Set([8, 11]); // 8,8 en A,A

        // Pairs die nooit split zijn
        this.neverSplitPairs = new Set([5, 10]); // 5,5 en 10,10
    }

    /**
     * Genereer cache key voor een query
     */
    getCacheKey(hand, dealerValue, availableActions) {
        return `${hand.total}-${hand.isSoft}-${hand.isPair}-${dealerValue}-${availableActions.join(',')}`;
    }

    /**
     * Haal resultaat uit cache of bereken nieuw
     */
    getCachedAdvice(hand, dealerValue, availableActions) {
        const cacheKey = this.getCacheKey(hand, dealerValue, availableActions);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return null;
    }

    /**
     * Sla resultaat op in cache
     */
    setCacheAdvice(hand, dealerValue, availableActions, advice) {
        // Limiteer cache size
        if (this.cache.size >= this.cacheMaxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        const cacheKey = this.getCacheKey(hand, dealerValue, availableActions);
        this.cache.set(cacheKey, advice);
    }

    /**
     * Hoofdfunctie om strategie advies te krijgen
     * @param {Object} hand - Speler hand info
     * @param {string} dealerCard - Dealer upcard
     * @param {Array} availableActions - Beschikbare acties ['hit', 'stand', 'double', 'split', 'surrender']
     * @returns {Object} - {action: string, explanation: string}
     */
    getAdvice(hand, dealerCard, availableActions) {
        const dealerValue = this.dealerValues[dealerCard];

        // Check cache eerst
        const cachedResult = this.getCachedAdvice(hand, dealerValue, availableActions);
        if (cachedResult) {
            return cachedResult;
        }

        let advice;

        // Check voor pair eerst (als er precies 2 kaarten zijn met dezelfde waarde)
        if (hand.isPair && availableActions.includes('split')) {
            const pairAdvice = this.getPairStrategy(hand.cards[0], dealerValue, availableActions);
            if (pairAdvice.action === 'SPLIT') {
                advice = pairAdvice;
                this.setCacheAdvice(hand, dealerValue, availableActions, advice);
                return advice;
            }
        }

        // Soft hand (aas telt als 11)
        if (hand.isSoft) {
            advice = this.getSoftStrategy(hand.total, dealerValue, availableActions);
        } else {
            // Hard hand
            advice = this.getHardStrategy(hand.total, dealerValue, availableActions);
        }

        // Cache het resultaat
        this.setCacheAdvice(hand, dealerValue, availableActions, advice);
        return advice;
    }

    /**
     * Strategy voor pairs (optimized with lookup tables)
     */
    getPairStrategy(cardValue, dealerValue, availableActions) {
        const card = this.dealerValues[cardValue] || parseInt(cardValue);

        // Use lookup tables voor snellere beslissingen
        // A,A en 8,8 - Altijd split
        if (this.alwaysSplitPairs.has(card)) {
            return {
                action: 'SPLIT',
                explanation: card === 11 ? 'Split aces altijd - geeft twee kansen op blackjack.' : 'Split 8s altijd - 16 is een slechte hand, twee 18s is beter.'
            };
        }

        // 10,10 en 5,5 - Nooit split
        if (this.neverSplitPairs.has(card)) {
            if (card === 10) {
                return {
                    action: 'STAND',
                    explanation: '20 is een te goede hand om te splitten.'
                };
            }
            // 5,5 behandel als hard 10
            return this.getHardStrategy(10, dealerValue, availableActions);
        }

        // 9,9
        if (card === 9) {
            if (dealerValue === 7 || dealerValue >= 10) {
                return {
                    action: 'STAND',
                    explanation: '18 is sterk genoeg tegen deze dealer kaart.'
                };
            }
            return {
                action: 'SPLIT',
                explanation: 'Split 9s tegen zwakkere dealer kaarten voor meer winst.'
            };
        }

        // 7,7
        if (card === 7) {
            if (dealerValue >= 2 && dealerValue <= 7) {
                return {
                    action: 'SPLIT',
                    explanation: 'Split 7s tegen zwakkere dealer kaarten.'
                };
            }
            return {
                action: 'HIT',
                explanation: '14 is te zwak - neem een kaart.'
            };
        }

        // 6,6
        if (card === 6) {
            if (dealerValue >= 2 && dealerValue <= 6) {
                return {
                    action: 'SPLIT',
                    explanation: 'Split 6s wanneer dealer zwak is (bust kans).'
                };
            }
            return {
                action: 'HIT',
                explanation: '12 is te zwak tegen sterke dealer kaart.'
            };
        }

        // 4,4
        if (card === 4) {
            if (dealerValue === 5 || dealerValue === 6) {
                return {
                    action: 'SPLIT',
                    explanation: 'Split 4s alleen tegen de zwakste dealer kaarten.'
                };
            }
            return {
                action: 'HIT',
                explanation: '8 is te laag - neem een kaart.'
            };
        }

        // 3,3
        if (card === 3) {
            if (dealerValue >= 2 && dealerValue <= 7) {
                return {
                    action: 'SPLIT',
                    explanation: 'Split 3s tegen zwakkere dealer kaarten.'
                };
            }
            return {
                action: 'HIT',
                explanation: '6 is te laag tegen sterke dealer kaart.'
            };
        }

        // 2,2
        if (card === 2) {
            if (dealerValue >= 2 && dealerValue <= 7) {
                return {
                    action: 'SPLIT',
                    explanation: 'Split 2s tegen zwakkere dealer kaarten.'
                };
            }
            return {
                action: 'HIT',
                explanation: '4 is te laag - neem kaarten tot 12+.'
            };
        }

        // Default (zou niet moeten gebeuren)
        return this.getHardStrategy(card * 2, dealerValue, availableActions);
    }

    /**
     * Strategy voor soft hands (aas telt als 11)
     */
    getSoftStrategy(total, dealerValue, availableActions) {
        const canDouble = availableActions.includes('double');

        // Soft 20 (A,9) - Altijd stand
        if (total === 20) {
            return {
                action: 'STAND',
                explanation: 'Soft 20 is bijna perfect - blijf staan.'
            };
        }

        // Soft 19 (A,8)
        if (total === 19) {
            // Double tegen 6 als het kan
            if (dealerValue === 6 && canDouble) {
                return {
                    action: 'DOUBLE',
                    explanation: 'Double soft 19 tegen 6 voor extra winst (dealer heeft hoge bust kans).'
                };
            }
            return {
                action: 'STAND',
                explanation: 'Soft 19 is sterk - blijf staan.'
            };
        }

        // Soft 18 (A,7)
        if (total === 18) {
            if (dealerValue >= 9) {
                return {
                    action: 'HIT',
                    explanation: 'Soft 18 is zwak tegen 9-A - probeer te verbeteren.'
                };
            }
            if ((dealerValue >= 3 && dealerValue <= 6) && canDouble) {
                return {
                    action: 'DOUBLE',
                    explanation: 'Double soft 18 tegen zwakke dealer voor meer winst.'
                };
            }
            return {
                action: 'STAND',
                explanation: 'Soft 18 is redelijk tegen deze kaart.'
            };
        }

        // Soft 17 (A,6)
        if (total === 17) {
            if ((dealerValue >= 3 && dealerValue <= 6) && canDouble) {
                return {
                    action: 'DOUBLE',
                    explanation: 'Double soft 17 tegen zwakke dealer - kan niet busten.'
                };
            }
            return {
                action: 'HIT',
                explanation: 'Soft 17 is zwak - neem een kaart (kan niet busten).'
            };
        }

        // Soft 15-16 (A,4-5)
        if (total === 15 || total === 16) {
            if ((dealerValue >= 4 && dealerValue <= 6) && canDouble) {
                return {
                    action: 'DOUBLE',
                    explanation: 'Double tegen dealer 4-6 voor optimale winst.'
                };
            }
            return {
                action: 'HIT',
                explanation: 'Hand is te zwak - neem kaarten (kan niet busten).'
            };
        }

        // Soft 13-14 (A,2-3)
        if (total === 13 || total === 14) {
            if ((dealerValue === 5 || dealerValue === 6) && canDouble) {
                return {
                    action: 'DOUBLE',
                    explanation: 'Double tegen de zwakste dealer kaarten.'
                };
            }
            return {
                action: 'HIT',
                explanation: 'Hand is zwak - blijf kaarten nemen.'
            };
        }

        // Soft 12 en lager (meerdere kaarten)
        return {
            action: 'HIT',
            explanation: 'Hand is te laag - blijf kaarten nemen.'
        };
    }

    /**
     * Strategy voor hard hands (geen aas of aas telt als 1)
     */
    getHardStrategy(total, dealerValue, availableActions) {
        const canDouble = availableActions.includes('double');
        const canSurrender = availableActions.includes('surrender');

        // 17+ - Altijd stand
        if (total >= 17) {
            return {
                action: 'STAND',
                explanation: `${total} is hoog genoeg - risico op busten is te groot.`
            };
        }

        // 16
        if (total === 16) {
            // Surrender tegen 9, 10, A als beschikbaar
            if ((dealerValue >= 9) && canSurrender) {
                return {
                    action: 'SURRENDER',
                    explanation: '16 tegen 9-A is zeer ongunstig - surrender minimaliseert verlies.'
                };
            }
            if (dealerValue >= 2 && dealerValue <= 6) {
                return {
                    action: 'STAND',
                    explanation: 'Dealer heeft hoge bust kans - blijf staan met 16.'
                };
            }
            return {
                action: 'HIT',
                explanation: '16 is zwak tegen sterke dealer - risico nemen.'
            };
        }

        // 15
        if (total === 15) {
            // Surrender tegen 10 als beschikbaar
            if (dealerValue === 10 && canSurrender) {
                return {
                    action: 'SURRENDER',
                    explanation: '15 tegen 10 is zeer ongunstig - surrender is beste optie.'
                };
            }
            if (dealerValue >= 2 && dealerValue <= 6) {
                return {
                    action: 'STAND',
                    explanation: 'Dealer kan gemakkelijk busten - blijf staan.'
                };
            }
            return {
                action: 'HIT',
                explanation: '15 is te zwak - neem het risico.'
            };
        }

        // 13-14
        if (total === 13 || total === 14) {
            if (dealerValue >= 2 && dealerValue <= 6) {
                return {
                    action: 'STAND',
                    explanation: 'Dealer heeft zwakke kaart - laat dealer busten.'
                };
            }
            return {
                action: 'HIT',
                explanation: `${total} is te laag tegen sterke dealer.`
            };
        }

        // 12
        if (total === 12) {
            if (dealerValue >= 4 && dealerValue <= 6) {
                return {
                    action: 'STAND',
                    explanation: 'Dealer heeft hoogste bust kans - blijf staan.'
                };
            }
            return {
                action: 'HIT',
                explanation: '12 is te laag - bust kans is acceptabel (alleen 10,J,Q,K).'
            };
        }

        // 11 - Altijd double als mogelijk
        if (total === 11) {
            if (canDouble) {
                return {
                    action: 'DOUBLE',
                    explanation: '11 is perfect voor doubling - grote kans op 21.'
                };
            }
            return {
                action: 'HIT',
                explanation: '11 kan niet busten - neem een kaart.'
            };
        }

        // 10
        if (total === 10) {
            if (dealerValue >= 2 && dealerValue <= 9 && canDouble) {
                return {
                    action: 'DOUBLE',
                    explanation: '10 is sterk voor doubling tegen deze dealer kaart.'
                };
            }
            return {
                action: 'HIT',
                explanation: '10 kan niet busten - neem een kaart.'
            };
        }

        // 9
        if (total === 9) {
            if (dealerValue >= 3 && dealerValue <= 6 && canDouble) {
                return {
                    action: 'DOUBLE',
                    explanation: 'Double 9 tegen zwakke dealer kaarten.'
                };
            }
            return {
                action: 'HIT',
                explanation: '9 is te laag - blijf kaarten nemen.'
            };
        }

        // 5-8 (of lager)
        return {
            action: 'HIT',
            explanation: 'Hand is te laag - kan niet busten, blijf kaarten nemen.'
        };
    }
}

// Export voor gebruik in andere bestanden
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlackjackStrategy;
}
