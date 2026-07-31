(function () {
    'use strict';

    var currentDay = null;
    var cache = {};

    var landing = document.getElementById('landing');
    var dayView = document.getElementById('day-view');
    var dayContent = document.getElementById('day-content');
    var backBtn = document.getElementById('back-btn');
    var scrollTopBtn = document.getElementById('scroll-top');
    var dayCards = document.querySelectorAll('.day-card');
    var dayNavBtns = document.querySelectorAll('.day-nav-btn');

    function showLanding() {
        landing.classList.remove('hidden');
        dayView.classList.add('hidden');
        currentDay = null;
        window.scrollTo(0, 0);
        updateActiveNav();
    }

    function showDay(dayNum) {
        if (cache[dayNum]) {
            renderDay(dayNum, cache[dayNum]);
            return;
        }

        dayContent.innerHTML = '<div class="loading">Carregant</div>';
        landing.classList.add('hidden');
        dayView.classList.remove('hidden');
        window.scrollTo(0, 0);

        fetch('dia' + dayNum + '.md')
            .then(function (response) {
                if (!response.ok) throw new Error('Not found');
                return response.text();
            })
            .then(function (text) {
                cache[dayNum] = text;
                renderDay(dayNum, text);
            })
            .catch(function () {
                dayContent.innerHTML = '<div class="loading">Error carregant el dia</div>';
            });
    }

    function renderDay(dayNum, markdown) {
        currentDay = parseInt(dayNum, 10);
        dayContent.innerHTML = parseMarkdown(markdown);
        updateActiveNav();
        window.scrollTo(0, 0);
    }

    function updateActiveNav() {
        dayNavBtns.forEach(function (btn) {
            if (parseInt(btn.getAttribute('data-day'), 10) === currentDay) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function parseMarkdown(md) {
        var html = md;

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Headers
        html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');

        // Blockquotes
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

        // Tables
        html = html.replace(/^\|(.+)\|$/gm, function (match, content) {
            var cells = content.split('|').map(function (c) { return c.trim(); });
            return '<tr>' + cells.map(function (c) {
                if (/^[-:]+$/.test(c)) return '';
                return '<td>' + c + '</td>';
            }).join('') + '</tr>';
        });
        html = html.replace(/(<tr>.*<\/tr>\n?)+/g, function (match) {
            var rows = match.trim().split('\n');
            var headerRow = rows[0];
            var bodyRows = rows.slice(1).filter(function (row) {
                return row.indexOf('<td></td>') === -1;
            });
            if (headerRow) {
                var headerCells = headerRow.replace(/<\/?tr>/g, '').split('</td><td>');
                var header = '<thead><tr>' + headerCells.map(function (c) {
                    return '<th>' + c.replace(/<\/?td>/g, '') + '</th>';
                }).join('') + '</tr></thead>';
                return '<table>' + header + '<tbody>' + bodyRows.join('\n') + '</tbody></table>';
            }
            return '<table><tbody>' + bodyRows.join('\n') + '</tbody></table>';
        });

        // Unordered lists
        html = html.replace(/^[*•] (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, function (match) {
            return '<ul>' + match.trim() + '</ul>';
        });

        // Ordered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // Paragraphs
        html = html.replace(/\n\n/g, '\n');
        var lines = html.split('\n');
        var result = [];
        var inList = false;
        var inTable = false;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();

            if (trimmed.indexOf('<ul>') !== -1 || trimmed.indexOf('<li>') !== -1) inList = true;
            if (trimmed.indexOf('</ul>') !== -1) inList = false;
            if (trimmed.indexOf('<table>') !== -1) inTable = true;
            if (trimmed.indexOf('</table>') !== -1) inTable = false;

            if (trimmed === '') {
                result.push(line);
            } else if (trimmed.match(/^<(h[1-6]|hr|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|pre|img)/)) {
                result.push(line);
            } else if (inList || inTable) {
                result.push(line);
            } else {
                result.push('<p>' + trimmed + '</p>');
            }
        }

        return result.join('\n');
    }

    // Event listeners
    dayCards.forEach(function (card) {
        card.addEventListener('click', function (e) {
            e.preventDefault();
            var day = this.getAttribute('data-day');
            showDay(day);
        });
    });

    backBtn.addEventListener('click', function () {
        showLanding();
    });

    dayNavBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var day = this.getAttribute('data-day');
            showDay(day);
        });
    });

    // Scroll to top
    window.addEventListener('scroll', function () {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.remove('hidden');
        } else {
            scrollTopBtn.classList.add('hidden');
        }
    });

    scrollTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Handle URL hash
    var hash = window.location.hash;
    if (hash && hash.indexOf('#day') !== -1) {
        var dayNum = hash.replace('#day', '');
        if (dayNum >= 1 && dayNum <= 5) {
            showDay(dayNum);
        }
    }
})();
