/**
 * Blackjack Strategy Advisor - Main Application Logic
 *
 * Optimized version with:
 * - Hand history tracking
 * - Quick scenario presets
 * - Keyboard shortcuts
 * - Better UX feedback (toast notifications)
 * - LocalStorage for persistent settings
 * - Statistics tracking
 */

class BlackjackApp {
    constructor() {
        this.strategy = new BlackjackStrategy();
        this.selectedDealerCard = null;
        this.playerCards = [];
        this.inputMode = 'cards'; // 'cards' or 'total'
        this.handHistory = [];
        this.stats = this.loadStats();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.updateSplitAvailability();
        this.loadSettings();
        this.createQuickScenarios();
    }

    /**
     * Load statistics from localStorage
     */
    loadStats() {
        const saved = localStorage.getItem('blackjack_stats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            totalQueries: 0,
            actionCounts: {
                HIT: 0,
                STAND: 0,
                DOUBLE: 0,
                SPLIT: 0,
                SURRENDER: 0
            }
        };
    }

    /**
     * Save statistics to localStorage
     */
    saveStats() {
        localStorage.setItem('blackjack_stats', JSON.stringify(this.stats));
    }

    /**
     * Load user settings from localStorage
     */
    loadSettings() {
        const settings = localStorage.getItem('blackjack_settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            if (parsed.inputMode) {
                this.switchInputMode(parsed.inputMode);
            }
        }
    }

    /**
     * Save user settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('blackjack_settings', JSON.stringify({
            inputMode: this.inputMode
        }));
    }

    /**
     * Create quick scenario buttons
     */
    createQuickScenarios() {
        const scenarios = [
            { name: 'Hard 16 vs 10', dealer: '10', cards: ['10', '6'] },
            { name: 'Soft 18 vs 9', dealer: '9', cards: ['A', '7'] },
            { name: 'Pair 8s vs A', dealer: 'A', cards: ['8', '8'] },
            { name: 'Hard 11 vs 6', dealer: '6', cards: ['5', '6'] }
        ];

        const container = document.getElementById('quickScenarios');
        if (container) {
            scenarios.forEach(scenario => {
                const btn = document.createElement('button');
                btn.className = 'quick-scenario-btn';
                btn.textContent = scenario.name;
                btn.addEventListener('click', () => this.loadScenario(scenario));
                container.appendChild(btn);
            });
        }
    }

    /**
     * Load a quick scenario
     */
    loadScenario(scenario) {
        // Switch to cards mode
        this.switchInputMode('cards');

        // Clear current cards
        this.clearPlayerCards();

        // Select dealer card
        const dealerBtn = document.querySelector(`#dealerCards .card-btn[data-value="${scenario.dealer}"]`);
        if (dealerBtn) {
            this.selectDealerCard(dealerBtn);
        }

        // Add player cards
        scenario.cards.forEach(card => {
            this.addPlayerCard(card);
        });

        // Show toast
        this.showToast(`Scenario geladen: ${scenario.name}`);
    }

    setupEventListeners() {
        // Dealer card selection
        const dealerCards = document.getElementById('dealerCards');
        dealerCards.addEventListener('click', (e) => {
            if (e.target.classList.contains('card-btn')) {
                this.selectDealerCard(e.target);
            }
        });

        // Player cards selection
        const playerCardsEl = document.getElementById('playerCards');
        playerCardsEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('card-btn')) {
                this.addPlayerCard(e.target.dataset.value);
            }
        });

        // Clear cards button
        document.getElementById('clearCards').addEventListener('click', () => {
            this.clearPlayerCards();
        });

        // Input mode switching
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchInputMode(e.target.dataset.mode);
            });
        });

        // Get advice button
        document.getElementById('getAdviceBtn').addEventListener('click', () => {
            this.getAdvice();
        });

        // Player cards change - update split availability
        document.addEventListener('cardsChanged', () => {
            this.updateSplitAvailability();
        });

        // Clear history button
        const clearHistoryBtn = document.getElementById('clearHistory');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearHistory();
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input field
            if (e.target.tagName === 'INPUT') return;

            switch(e.key) {
                case 'Enter':
                    // Get advice
                    this.getAdvice();
                    break;
                case 'Escape':
                    // Clear cards
                    this.clearPlayerCards();
                    break;
                case 'c':
                case 'C':
                    // Switch to cards mode
                    this.switchInputMode('cards');
                    break;
                case 't':
                case 'T':
                    // Switch to total mode
                    this.switchInputMode('total');
                    break;
                case '?':
                    // Show keyboard shortcuts
                    this.showKeyboardHelp();
                    break;
            }
        });
    }

    /**
     * Show keyboard shortcuts help
     */
    showKeyboardHelp() {
        const help = `
Toetsenbord shortcuts:
- Enter: Krijg advies
- Escape: Wis kaarten
- C: Kaarten modus
- T: Totaal modus
- ?: Deze help
        `.trim();
        this.showToast(help, 5000);
    }

    /**
     * Show toast notification
     */
    showToast(message, duration = 3000) {
        // Create toast if doesn't exist
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('show');

        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    selectDealerCard(cardBtn) {
        // Remove previous selection
        const allDealerCards = document.querySelectorAll('#dealerCards .card-btn');
        allDealerCards.forEach(btn => btn.classList.remove('active'));

        // Select new card
        cardBtn.classList.add('active');
        this.selectedDealerCard = cardBtn.dataset.value;
    }

    addPlayerCard(cardValue) {
        if (this.playerCards.length >= 5) {
            this.showToast('Maximaal 5 kaarten');
            return;
        }

        this.playerCards.push(cardValue);
        this.updatePlayerCardsDisplay();
        document.dispatchEvent(new Event('cardsChanged'));
    }

    clearPlayerCards() {
        this.playerCards = [];
        this.updatePlayerCardsDisplay();
        document.dispatchEvent(new Event('cardsChanged'));

        // Hide results
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.add('hidden');
        }
    }

    updatePlayerCardsDisplay() {
        const container = document.getElementById('selectedCards');

        if (this.playerCards.length === 0) {
            container.innerHTML = '<p class="helper-text">Klik op kaarten om je hand samen te stellen</p>';
        } else {
            container.innerHTML = this.playerCards
                .map(card => `<span class="selected-card">${card}</span>`)
                .join('');
        }
    }

    switchInputMode(mode) {
        this.inputMode = mode;

        // Update button states
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide input modes
        document.getElementById('cardsMode').classList.toggle('hidden', mode !== 'cards');
        document.getElementById('totalMode').classList.toggle('hidden', mode !== 'total');

        // Update split availability
        this.updateSplitAvailability();

        // Save setting
        this.saveSettings();
    }

    updateSplitAvailability() {
        const splitCheckbox = document.getElementById('splitAction');

        if (this.inputMode === 'total') {
            // Split not available in total mode
            splitCheckbox.checked = false;
            splitCheckbox.disabled = true;
        } else {
            // Check if player has exactly 2 cards of same value
            if (this.playerCards.length === 2) {
                const card1 = this.getCardValue(this.playerCards[0]);
                const card2 = this.getCardValue(this.playerCards[1]);
                splitCheckbox.disabled = !(card1 === card2);
            } else {
                splitCheckbox.checked = false;
                splitCheckbox.disabled = true;
            }
        }
    }

    getCardValue(card) {
        if (card === 'A') return 11;
        if (['J', 'Q', 'K'].includes(card)) return 10;
        return parseInt(card);
    }

    calculateHand(cards) {
        let total = 0;
        let aces = 0;

        // Count total and aces
        for (const card of cards) {
            const value = this.getCardValue(card);
            total += value;
            if (card === 'A') aces++;
        }

        // Adjust for aces (convert from 11 to 1 if needed)
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        const isSoft = aces > 0 && total <= 21;

        // Check for pair
        let isPair = false;
        if (cards.length === 2) {
            const card1Val = this.getCardValue(cards[0]);
            const card2Val = this.getCardValue(cards[1]);
            isPair = card1Val === card2Val;
        }

        return {
            total,
            isSoft,
            isPair,
            cards
        };
    }

    getAvailableActions() {
        const actions = ['hit', 'stand']; // Always available

        // Check checkboxes
        if (document.getElementById('doubleAction').checked) {
            actions.push('double');
        }
        if (document.getElementById('splitAction').checked && !document.getElementById('splitAction').disabled) {
            actions.push('split');
        }
        if (document.getElementById('surrenderAction').checked) {
            actions.push('surrender');
        }

        return actions;
    }

    getAdvice() {
        // Validate dealer card
        if (!this.selectedDealerCard) {
            this.showToast('⚠️ Selecteer eerst een dealer kaart');
            return;
        }

        let hand;

        // Get hand based on input mode
        if (this.inputMode === 'cards') {
            if (this.playerCards.length < 2) {
                this.showToast('⚠️ Selecteer minimaal 2 kaarten');
                return;
            }
            hand = this.calculateHand(this.playerCards);
        } else {
            // Total mode
            const total = parseInt(document.getElementById('handTotal').value);
            if (!total || total < 4 || total > 21) {
                this.showToast('⚠️ Voer een geldig totaal in (4-21)');
                return;
            }

            hand = {
                total: total,
                isSoft: document.getElementById('isSoftHand').checked,
                isPair: false,
                cards: []
            };
        }

        // Check for bust
        if (hand.total > 21) {
            this.showResult({
                action: 'BUST',
                explanation: 'Je hand is al gebusted (over 21). Er is geen actie meer mogelijk.'
            });
            return;
        }

        // Check for blackjack
        if (hand.total === 21 && this.playerCards.length === 2) {
            this.showResult({
                action: 'BLACKJACK',
                explanation: 'Blackjack! Je hebt de perfecte hand.'
            });
            return;
        }

        // Get available actions
        const availableActions = this.getAvailableActions();

        // Get strategy advice
        const advice = this.strategy.getAdvice(hand, this.selectedDealerCard, availableActions);

        // Update statistics
        this.updateStats(advice.action);

        // Add to history
        this.addToHistory(hand, this.selectedDealerCard, advice);

        // Show result
        this.showResult(advice, hand);
    }

    /**
     * Update statistics
     */
    updateStats(action) {
        this.stats.totalQueries++;
        if (this.stats.actionCounts[action] !== undefined) {
            this.stats.actionCounts[action]++;
        }
        this.saveStats();
        this.updateStatsDisplay();
    }

    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        const statsEl = document.getElementById('statsDisplay');
        if (!statsEl) return;

        const total = this.stats.totalQueries;
        const counts = this.stats.actionCounts;

        statsEl.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Totaal:</span>
                <span class="stat-value">${total}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Hit:</span>
                <span class="stat-value">${counts.HIT}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Stand:</span>
                <span class="stat-value">${counts.STAND}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Double:</span>
                <span class="stat-value">${counts.DOUBLE}</span>
            </div>
        `;
    }

    /**
     * Add to hand history
     */
    addToHistory(hand, dealerCard, advice) {
        const entry = {
            timestamp: new Date().toLocaleTimeString(),
            hand: hand.total,
            type: hand.isSoft ? 'Soft' : 'Hard',
            dealer: dealerCard,
            action: advice.action
        };

        this.handHistory.unshift(entry); // Add to beginning

        // Limit history to 10 entries
        if (this.handHistory.length > 10) {
            this.handHistory.pop();
        }

        this.updateHistoryDisplay();
    }

    /**
     * Update history display
     */
    updateHistoryDisplay() {
        const historyEl = document.getElementById('historyList');
        if (!historyEl) return;

        if (this.handHistory.length === 0) {
            historyEl.innerHTML = '<p class="helper-text">Nog geen geschiedenis</p>';
            return;
        }

        historyEl.innerHTML = this.handHistory.map(entry => `
            <div class="history-entry">
                <span class="history-time">${entry.timestamp}</span>
                <span class="history-hand">${entry.type} ${entry.hand} vs ${entry.dealer}</span>
                <span class="history-action action-${entry.action.toLowerCase()}">${entry.action}</span>
            </div>
        `).join('');
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.handHistory = [];
        this.updateHistoryDisplay();
        this.showToast('Geschiedenis gewist');
    }

    showResult(advice, hand = null) {
        const resultsSection = document.getElementById('resultsSection');
        const actionResult = document.getElementById('actionResult');
        const explanationText = document.getElementById('explanationText');
        const handSummary = document.getElementById('handSummary');

        // Show results section with animation
        resultsSection.classList.remove('hidden');
        resultsSection.classList.add('fade-in');

        // Update action with color coding
        actionResult.textContent = advice.action;
        actionResult.className = 'action-result ' + advice.action.toLowerCase();

        // Update explanation
        explanationText.textContent = advice.explanation;

        // Show hand summary if available
        if (hand && this.inputMode === 'cards') {
            const handType = hand.isSoft ? 'Soft' : 'Hard';
            const pairInfo = hand.isPair ? ' (Pair)' : '';
            handSummary.textContent = `Jouw hand: ${handType} ${hand.total}${pairInfo}`;
            handSummary.classList.remove('hidden');
        } else {
            handSummary.classList.add('hidden');
        }

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlackjackApp();
});
