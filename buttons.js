function createButton(text, onClick, className = '') {
    const btn = document.createElement('div');
    btn.className = `mc-btn ${className}`.trim();
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
}

function createButtonRow(buttons) {
    const row = document.createElement('div');
    row.className = 'mc-btn-row';
    buttons.forEach(btn => row.appendChild(btn));
    return row;
}
