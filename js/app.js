/**
 * Blackjack Strategy Advisor - Main Application Logic
 */

class BlackjackApp {
    constructor() {
        this.strategy = new BlackjackStrategy();
        this.selectedDealerCard = null;
        this.playerCards = [];
        this.inputMode = 'cards'; // 'cards' or 'total'

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSplitAvailability();
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
            alert('Maximaal 5 kaarten');
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
            alert('Selecteer eerst een dealer kaart');
            return;
        }

        let hand;

        // Get hand based on input mode
        if (this.inputMode === 'cards') {
            if (this.playerCards.length < 2) {
                alert('Selecteer minimaal 2 kaarten');
                return;
            }
            hand = this.calculateHand(this.playerCards);
        } else {
            // Total mode
            const total = parseInt(document.getElementById('handTotal').value);
            if (!total || total < 4 || total > 21) {
                alert('Voer een geldig totaal in (4-21)');
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

        // Show result
        this.showResult(advice, hand);
    }

    showResult(advice, hand = null) {
        const resultsSection = document.getElementById('resultsSection');
        const actionResult = document.getElementById('actionResult');
        const explanationText = document.getElementById('explanationText');
        const handSummary = document.getElementById('handSummary');

        // Show results section
        resultsSection.classList.remove('hidden');

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
