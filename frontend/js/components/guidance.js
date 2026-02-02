function renderGuidance(portfolio) {
    const text = document.getElementById('guidance-text');
    if (!text) {
        return;
    }
    if (!portfolio) {
        text.textContent = 'Link your portfolio to receive AI guidance.';
        return;
    }

    const suggestions = [
        `Consider rebalancing if ${portfolio.top_holding || 'tech'} exceeds 35% of your portfolio.`,
        'Hold high-performing stocks through earnings reports.',
        'Add defensive assets to protect against volatility.',
        'Set stop-loss orders on positions with declining momentum.'
    ];
    text.textContent = suggestions[Math.floor(Math.random() * suggestions.length)];
}

function bindGuidanceEvents() {
    const refreshButton = document.getElementById('refresh-guidance');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => renderGuidance(window.currentPortfolio));
    }
}

window.guidance = {
    renderGuidance,
    bindGuidanceEvents
};
