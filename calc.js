(function () {
  function fmt(n) {
    return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' сом';
  }
  function num(v) {
    var n = parseFloat(String(v).replace(',', '.'));
    return isFinite(n) && n > 0 ? n : 0;
  }

  var CATS = [
    { key: 'needs', name: 'Обязательные', cls: 'c-needs', hint: 'Жильё, продукты, транспорт, связь, кредиты' },
    { key: 'wants', name: 'Желания', cls: 'c-wants', hint: 'Кафе, развлечения, покупки для себя' },
    { key: 'save', name: 'Накопления', cls: 'c-save', hint: 'Финансовая подушка и цели' }
  ];

  /* ---------- Распределение дохода ---------- */
  var income = document.getElementById('income');
  var bar = document.getElementById('split-bar');
  var rowsBox = document.getElementById('split-rows');
  var ruleBtns = document.querySelectorAll('[data-rule]');
  var rule = [50, 30, 20];

  function renderSplit() {
    var inc = num(income.value);
    bar.innerHTML = '';
    rowsBox.innerHTML = '';
    CATS.forEach(function (c, i) {
      var part = inc * rule[i] / 100;
      var s = document.createElement('span');
      s.className = c.cls;
      s.style.width = rule[i] + '%';
      s.textContent = rule[i] + '%';
      bar.appendChild(s);

      var row = document.createElement('div');
      row.className = 'result-row';
      row.innerHTML =
        '<span class="what"><span class="dot ' + c.cls + '"></span>' + c.name + ' · ' + rule[i] + '%</span>' +
        '<span class="big-num">' + fmt(part) + '</span>' +
        '<span class="hint">' + c.hint + '</span>';
      rowsBox.appendChild(row);
    });
  }
  income.addEventListener('input', renderSplit);
  ruleBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      rule = b.getAttribute('data-rule').split(',').map(Number);
      ruleBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      renderSplit();
    });
  });
  renderSplit();

  /* ---------- Проверка расходов ---------- */
  var income2 = document.getElementById('income2');
  var tbody = document.getElementById('rows');
  var nextId = 1;
  var rows = [
    { name: 'Продукты', cat: 'needs', amount: 20000 },
    { name: 'Транспорт', cat: 'needs', amount: 5000 },
    { name: 'Связь и интернет', cat: 'needs', amount: 2000 },
    { name: 'Здоровье', cat: 'needs', amount: 10000 },
    { name: 'Обучение', cat: 'needs', amount: 10000 },
    { name: 'Кафе и развлечения', cat: 'wants', amount: 10000 },
    { name: 'Одежда', cat: 'wants', amount: 7500 },
    { name: 'Накопления', cat: 'save', amount: 10000 }
  ].map(function (r) { r.id = nextId++; return r; });

  function buildRow(r) {
    var tr = document.createElement('tr');
    var opts = CATS.map(function (c) {
      return '<option value="' + c.key + '"' + (c.key === r.cat ? ' selected' : '') + '>' + c.name + '</option>';
    }).join('');
    tr.innerHTML =
      '<td><input type="text" id="name-' + r.id + '" aria-label="Статья расходов"></td>' +
      '<td class="cat"><select id="cat-' + r.id + '" aria-label="Категория">' + opts + '</select></td>' +
      '<td class="amount"><input type="number" id="amt-' + r.id + '" min="0" step="100" inputmode="numeric" aria-label="Сумма, сом"></td>' +
      '<td class="del"><button type="button" class="icon-btn" aria-label="Удалить строку">×</button></td>';
    var nameIn = tr.querySelector('input[type="text"]');
    var catIn = tr.querySelector('select');
    var amtIn = tr.querySelector('input[type="number"]');
    nameIn.value = r.name;
    amtIn.value = r.amount || '';
    nameIn.addEventListener('input', function () { r.name = nameIn.value; });
    catIn.addEventListener('change', function () { r.cat = catIn.value; renderSummary(); });
    amtIn.addEventListener('input', function () { r.amount = num(amtIn.value); renderSummary(); });
    tr.querySelector('.icon-btn').addEventListener('click', function () {
      rows = rows.filter(function (x) { return x !== r; });
      tr.remove();
      renderSummary();
    });
    return tr;
  }

  function renderRows() {
    tbody.innerHTML = '';
    rows.forEach(function (r) { tbody.appendChild(buildRow(r)); });
  }

  var TARGET = { needs: 50, wants: 30, save: 20 };

  function renderSummary() {
    var inc = num(income2.value);
    var total = 0;
    var by = { needs: 0, wants: 0, save: 0 };
    rows.forEach(function (r) { total += r.amount; by[r.cat] += r.amount; });
    var rest = inc - total;

    document.getElementById('total').textContent = fmt(total);
    var restEl = document.getElementById('rest');
    restEl.textContent = (rest < 0 ? '−' : '') + fmt(Math.abs(rest));
    restEl.style.color = rest < 0 ? 'var(--warn)' : '';

    var status = document.getElementById('status');
    if (inc === 0) {
      status.innerHTML = '<span class="pill bad">Введите доход</span>';
    } else if (rest < 0) {
      status.innerHTML = '<span class="pill bad">Расходы больше дохода</span>';
    } else {
      status.innerHTML = '<span class="pill ok">Бюджет в плюсе</span>';
    }

    var box = document.getElementById('cat-lines');
    box.innerHTML = '';
    box.style.display = 'grid';
    box.style.gap = '14px';
    CATS.forEach(function (c) {
      var pct = inc > 0 ? by[c.key] / inc * 100 : 0;
      var target = TARGET[c.key];
      var verdict;
      if (c.key === 'save') {
        verdict = pct >= target ? '<span class="pill ok">в норме</span>' : '<span class="pill bad">меньше нормы</span>';
      } else {
        verdict = pct <= target ? '<span class="pill ok">в норме</span>' : '<span class="pill bad">больше нормы</span>';
      }
      var line = document.createElement('div');
      line.className = 'cat-line';
      line.innerHTML =
        '<div class="top"><span><span class="dot ' + c.cls + '"></span>' + c.name + ': ' +
        '<span class="num">' + fmt(by[c.key]) + ' · ' + pct.toFixed(0) + '%</span> (норма ' + target + '%)</span>' + verdict + '</div>' +
        '<div class="meter"><i class="' + c.cls + '" style="width:' + Math.min(pct, 100) + '%"></i><b style="left:' + target + '%"></b></div>';
      box.appendChild(line);
    });
  }

  document.getElementById('add-row').addEventListener('click', function () {
    var r = { id: nextId++, name: '', cat: 'needs', amount: 0 };
    rows.push(r);
    var tr = buildRow(r);
    tbody.appendChild(tr);
    tr.querySelector('input[type="text"]').focus();
    renderSummary();
  });
  income2.addEventListener('input', renderSummary);

  renderRows();
  renderSummary();
})();
