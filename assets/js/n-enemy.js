let enemyCount = 0;

document.getElementById('add-enemy-btn').addEventListener('click', addEnemy);

function addEnemy() {
  const container = document.getElementById('enemies-container');
  const div = document.createElement('div');
  div.className = 'pokemon-form';
  div.dataset.index = enemyCount;
  div.innerHTML = getEnemyForm(enemyCount);
  container.appendChild(div);
  enemyCount++;
}

function getEnemyForm(index) {
  return `
    <h3>Enemy ${index + 1}</h3>
    <label>Choose Enemy</label>
    <input list="enemy-data-list" class="enemy" onblur="showStats(event)">
    <br>
    <label>Level</label>
    <input type="number" class="level-inp" value="1" onchange="showStats(event)">
    <br>
    <label>Retreat</label>
    <input type="number" class="retreat-inp" value="2">
    <br>
    <label>Nature</label>
    <input list="natures-data-list" value="calm" type="text" onblur="showStats(event)" class="nature-inp">
    <br>
    <label>Mega Suffix</label>
    <select class="mega-suffix-select">
      <option value="mega">Mega</option>
      <option value="megax">X</option>
      <option value="megay">Y</option>
      <option value="megaz">Z</option>
    </select>
    <br>
    <label>Token Used</label>
    <textarea class="token-inp" onblur="showStats(event)"></textarea>
    <br>
    <pre class="enemy-stats">Stats will show here...</pre>

    <div class="move-section">
      <h4>Moves</h4>
      <div class="moves-list"></div>
      <button type="button" onclick="addMove(event)">Add Move</button>
    </div>

    <div class="move-section">
      <h4>Mega Moves</h4>
      <div class="mega-moves-list"></div>
      <button type="button" onclick="addMove(event, true)">Add Mega Move</button>
    </div>
  `;
}

function showStats(event) {
  const form = event.target.closest('.pokemon-form');
  const stats = form.querySelector('.enemy-stats');
  stats.textContent = `Enemy: ${form.querySelector('.enemy').value}\nLevel: ${form.querySelector('.level-inp').value}`;
}

function addMove(event, isMega = false) {
  const form = event.target.closest('.pokemon-form');
  const list = isMega ? form.querySelector('.mega-moves-list') : form.querySelector('.moves-list');

  const div = document.createElement('div');
  div.className = 'move-item';
  div.innerHTML = `
    <input type="text" list="moves-data-list" onblur="showMoveDetails(event)" class="${isMega ? 'mega-move-input' : 'move-input'}">
    <button type="button" onclick="removeMove(event)">X</button>
  `;
  list.appendChild(div);
}

function removeMove(event) {
  const moveItem = event.target.closest('.move-item');
  moveItem.remove();
}

function showMoveDetails(event) {
  const input = event.target;
  console.log(`Move details for: ${input.value}`);
}


document.getElementById('start-battle-btn').addEventListener('click', startBattleBtnHandler);

function startBattleBtnHandler() {
  const enemiesMeta = [];

  document.querySelectorAll('.pokemon-form').forEach(form => {
    const enemyId = form.querySelector('.enemy')?.value || '';
    const xp = parseInt(form.querySelector('.level-inp')?.value || '1', 10) * 100; // Example XP logic
    const retreat = parseFloat(form.querySelector('.retreat-inp')?.value || '2');
    const nature = form.querySelector('.nature-inp')?.value || '';
    const megaSuffix = form.querySelector('.mega-suffix-select')?.value || '';
    const tokenUsed = form.querySelector('.token-inp')?.value || '';

    const moves = [];
    form.querySelectorAll('.moves-list .move-input').forEach(input => {
      const id = input.value.trim();
      if (id) moves.push({ id, isSelected: true });
    });

    const megaMoves = [];
    form.querySelectorAll('.mega-moves-list .mega-move-input').forEach(input => {
      const id = input.value.trim();
      if (id) megaMoves.push({ id, isSelected: true });
    });

    const enemyMeta = {
      id: enemyId,
      xp: xp,
      nature: nature,
      retreat: retreat,
      moves: moves,
      mega: {
        moves: megaMoves,
        suffix: megaSuffix
      },
      stats: {},
      token_used: tokenUsed ? { id: tokenUsed } : {}
    };

    enemiesMeta.push(enemyMeta);
  });

  console.log('Generated Enemies Meta:', enemiesMeta);
}


globalThis.showStats = showStats
globalThis.addMove = addMove
globalThis.removeMove = removeMove
globalThis.showMoveDetails = showMoveDetails