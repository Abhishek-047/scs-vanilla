/**
 * SCS Platform - Activity Heatmap
 * GitHub-style contribution grid
 */

(function() {
  'use strict';

  const hmGrid = document.getElementById('hm-grid');
  if (!hmGrid) return;

  // Seeded random number generator for consistent layout
  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Build the heatmap grid (52 weeks x 7 days = 364 cells)
  function buildHeatmap() {
    const weeks = 52;
    const days = 7;
    let cellIndex = 0;

    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day < days; day++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';

        // Use seeded random for consistent "activity" levels
        // Different seed for each cell
        const seed = (week * 7 + day) * 12345;
        const rand = seededRandom(seed);

        // Determine level (0-4) based on random value
        let level;
        if (rand < 0.4) level = 0;      // 40% - no activity
        else if (rand < 0.65) level = 1; // 25% - low
        else if (rand < 0.82) level = 2; // 17% - medium
        else if (rand < 0.93) level = 3; // 11% - high
        else level = 4;                   // 7% - very high (bright)

        cell.classList.add('hm-' + level);
        cell.setAttribute('title', `Week ${week + 1}, Day ${day + 1}: ${level * 3} contributions`);

        hmGrid.appendChild(cell);
        cellIndex++;
      }
    }
  }

  // Build the grid
  buildHeatmap();

  // Calculate and animate stats
  function animateHeatmapStats() {
    const cells = hmGrid.querySelectorAll('.heatmap-cell');
    let totalContributions = 0;
    let activeDays = 0;

    cells.forEach(cell => {
      for (let i = 0; i <= 4; i++) {
        if (cell.classList.contains('hm-' + i)) {
          totalContributions += i * 3;
          if (i > 0) activeDays++;
          break;
        }
      }
    });

    // Update stats in DOM
    const totalEl = document.querySelector('[data-heatmap-total]');
    const activeEl = document.querySelector('[data-heatmap-active]');
    const streakEl = document.querySelector('[data-heatmap-streak]');

    if (totalEl) {
      totalEl.textContent = totalContributions;
    }
    if (activeEl) {
      activeEl.textContent = activeDays;
    }
    if (streakEl) {
      // Calculate current streak (simplified)
      streakEl.textContent = Math.floor(activeDays / 7);
    }
  }

  // Run stats calculation after grid is built
  setTimeout(animateHeatmapStats, 100);

})();
