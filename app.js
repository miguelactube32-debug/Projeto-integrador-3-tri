(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const fmt = (value, digits = 2) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(value);
  const constants = { h: 6.62607015e-34, c: 299792458, k: 1.380649e-23, sigma: 5.670374419e-8, wien: 2.897771955e-3 };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Header, mobile navigation, active section and subtle parallax.
  const menuToggle = $('.menu-toggle');
  const mobileMenu = $('#menu-mobile');
  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mobileMenu.hidden = !open;
  });
  $$('#menu-mobile a').forEach(link => link.addEventListener('click', () => {
    mobileMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
  }));

  const navTargets = $$('.main-nav [data-nav]');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) navTargets.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    }), { rootMargin: '-25% 0px -65% 0px' });
    ['ciencia', 'espectro', 'solar', 'piscina', 'aprender'].forEach(id => { const el = document.getElementById(id); if (el) navObserver.observe(el); });
  }
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: .1 });
    $$('.reveal').forEach(el => revealObserver.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('visible'));

  const heroVisual = $('.hero-visual');
  if (heroVisual && !reducedMotion.matches && matchMedia('(hover:hover)').matches) {
    heroVisual.addEventListener('pointermove', event => {
      const bounds = heroVisual.getBoundingClientRect();
      const dx = (event.clientX - bounds.left) / bounds.width - .5;
      const dy = (event.clientY - bounds.top) / bounds.height - .5;
      heroVisual.style.setProperty('--px', `${dx * 12}px`);
      heroVisual.style.setProperty('--py', `${dy * 9}px`);
    });
    heroVisual.addEventListener('pointerleave', () => { heroVisual.style.setProperty('--px', '0px'); heroVisual.style.setProperty('--py', '0px'); });
  }
  if (heroVisual && !reducedMotion.matches) {
    const updateScrollParallax = () => {
      const offset = Math.min(34, Math.max(0, window.scrollY * .035));
      heroVisual.style.setProperty('--scroll-sun', `${offset}px`);
      heroVisual.style.setProperty('--scroll-orbit', `${offset * .55}px`);
    };
    window.addEventListener('scroll', updateScrollParallax, { passive: true });
    updateScrollParallax();
  }
  if (!reducedMotion.matches && matchMedia('(hover:hover)').matches) {
    $$('.sensor-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const rx = ((event.clientY - rect.top) / rect.height - .5) * -3.5;
        const ry = ((event.clientX - rect.left) / rect.width - .5) * 4;
        card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Persistent accessibility preferences.
  const accessDialog = $('#painel-acessibilidade');
  const preferenceDefaults = { contrast: false, font: false, spacing: false, reading: false, motion: reducedMotion.matches, fontScale: 1 };
  let preferences = { ...preferenceDefaults };
  try { preferences = { ...preferences, ...JSON.parse(localStorage.getItem('radiacao-accessibility') || '{}') }; } catch { /* Ignore invalid saved preferences. */ }
  const applyPreferences = () => {
    document.body.classList.toggle('high-contrast', Boolean(preferences.contrast));
    document.body.classList.toggle('font-friendly', Boolean(preferences.font));
    document.body.classList.toggle('wide-spacing', Boolean(preferences.spacing));
    document.body.classList.toggle('reading-mode', Boolean(preferences.reading));
    document.body.classList.toggle('reduce-motion', Boolean(preferences.motion));
    document.documentElement.style.setProperty('--font-scale', String(Math.max(.85, Math.min(1.3, Number(preferences.fontScale) || 1))));
    $$('[data-pref]').forEach(toggle => toggle.setAttribute('aria-checked', String(Boolean(preferences[toggle.dataset.pref]))));
  };
  const savePreferences = () => { applyPreferences(); try { localStorage.setItem('radiacao-accessibility', JSON.stringify(preferences)); } catch { /* Preferences remain usable for this visit. */ } };
  applyPreferences();
  $('.access-trigger')?.addEventListener('click', () => accessDialog.showModal());
  $('.close-dialog')?.addEventListener('click', () => accessDialog.close());
  accessDialog?.addEventListener('click', event => { if (event.target === accessDialog) accessDialog.close(); });
  $$('[data-pref]').forEach(toggle => toggle.addEventListener('click', () => { const key = toggle.dataset.pref; preferences[key] = !preferences[key]; savePreferences(); }));
  $('#font-larger')?.addEventListener('click', () => { preferences.fontScale = Math.min(1.3, (Number(preferences.fontScale) || 1) + .05); savePreferences(); });
  $('#font-smaller')?.addEventListener('click', () => { preferences.fontScale = Math.max(.85, (Number(preferences.fontScale) || 1) - .05); savePreferences(); });
  $('#reset-access')?.addEventListener('click', () => { preferences = { ...preferenceDefaults }; savePreferences(); });

  // Planck spectrum, Wien peak and Stefan–Boltzmann power.
  const tempSlider = $('#temp-slider');
  const chart = $('#spectrum-chart');
  const ctx = chart?.getContext('2d');
  const wavelengthRange = { min: .2, max: 30 };
  const presetLabels = [
    { max: 350, title: 'Ambiente • emissão principalmente infravermelha', color: 'sem brilho visível' },
    { max: 750, title: 'Corpo aquecido • emissão no infravermelho próximo', color: 'infravermelho, quase sem brilho' },
    { max: 2000, title: 'Incandescente • luz vermelha e infravermelha', color: 'vermelho-alaranjado' },
    { max: 4000, title: 'Muito quente • emissão visível intensa', color: 'amarelo a branco' },
    { max: Infinity, title: 'Superfície estelar • pico na faixa visível', color: 'branco azulado' }
  ];
  const getPresetLabel = t => presetLabels.find(item => t < item.max)?.title || presetLabels.at(-1).title;
  const spectralExitance = (lambdaM, temperature) => {
    const x = constants.h * constants.c / (lambdaM * constants.k * temperature);
    if (x > 700) return 0;
    const denominator = Math.expm1(x);
    if (!Number.isFinite(denominator) || denominator <= 0) return 0;
    return (2 * Math.PI * constants.h * constants.c ** 2) / (lambdaM ** 5 * denominator);
  };
  const blackbodyColor = temperature => {
    // Smooth approximation of the visible blackbody color; below incandescence
    // the body is shown as dark because most emission is outside human vision.
    const t = Math.max(1000, Math.min(12000, temperature)) / 100;
    let r, g, b;
    if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.044792731; }
    else { r = 329.698727446 * (t - 60) ** -.1332047592; g = 288.1221695283 * (t - 60) ** -.0755148492; b = 255; }
    const channels = [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))));
    return `rgb(${channels.join(',')})`;
  };
  const chartPoint = (lambdaMicron, temperature, peak) => {
    const value = spectralExitance(lambdaMicron * 1e-6, temperature);
    return Math.min(1, peak ? value / peak : 0);
  };
  const drawSpectrum = temperature => {
    if (!ctx || !chart) return;
    const rect = chart.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(280, rect.width);
    const height = Math.max(160, rect.height);
    chart.width = Math.round(width * dpr); chart.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = { l: 37, r: 11, t: 12, b: 22 };
    const plotW = width - pad.l - pad.r, plotH = height - pad.t - pad.b;
    const xMin = Math.log(wavelengthRange.min), xMax = Math.log(wavelengthRange.max);
    const xAt = lambda => pad.l + (Math.log(lambda) - xMin) / (xMax - xMin) * plotW;
    const yAt = value => pad.t + (1 - value) * plotH;
    const peakLambda = constants.wien / temperature;
    const peak = spectralExitance(peakLambda, temperature);
    ctx.clearRect(0, 0, width, height);
    ctx.font = '9px "DM Mono", monospace';
    [0, .25, .5, .75, 1].forEach(tick => {
      const y = yAt(tick);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(width - pad.r, y);
      ctx.strokeStyle = tick === 0 ? 'rgba(145,177,195,.25)' : 'rgba(145,177,195,.1)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#6e899c'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(tick.toFixed(2).replace('.', ','), pad.l - 6, y);
    });
    const ticks = [.2, .5, 1, 3, 10, 30];
    ticks.forEach(tick => {
      const x = xAt(tick);
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, height - pad.b);
      ctx.strokeStyle = 'rgba(145,177,195,.08)'; ctx.stroke();
      ctx.fillStyle = '#6e899c'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(String(tick).replace('.', ','), x, height - pad.b + 5);
    });
    const color = temperature < 750 ? '#35d5f2' : blackbodyColor(temperature);
    const gradient = ctx.createLinearGradient(0, pad.t, 0, height - pad.b);
    gradient.addColorStop(0, `${color.replace('rgb(', 'rgba(').replace(')', ',.28)')}`);
    gradient.addColorStop(1, 'rgba(53,213,242,0)');
    ctx.beginPath();
    const samples = 360;
    for (let i = 0; i <= samples; i++) {
      const lambda = Math.exp(xMin + (xMax - xMin) * i / samples);
      const x = xAt(lambda), y = yAt(chartPoint(lambda, temperature, peak));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(xAt(wavelengthRange.max), height - pad.b); ctx.lineTo(xAt(wavelengthRange.min), height - pad.b); ctx.closePath();
    ctx.fillStyle = gradient; ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const lambda = Math.exp(xMin + (xMax - xMin) * i / samples);
      const x = xAt(lambda), y = yAt(chartPoint(lambda, temperature, peak));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.shadowColor = color; ctx.shadowBlur = 9; ctx.stroke(); ctx.shadowBlur = 0;
    if (peakLambda >= wavelengthRange.min && peakLambda <= wavelengthRange.max) {
      const x = xAt(peakLambda), y = yAt(1);
      ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, height - pad.b); ctx.strokeStyle = 'rgba(255,200,87,.7)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x, y + 2, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#ffc857'; ctx.fill();
    }
  };
  const updateSpectrum = () => {
    const temperature = Number(tempSlider.value);
    const lambdaPeak = constants.wien / temperature;
    const power = constants.sigma * temperature ** 4;
    const ratio = (temperature / 293) ** 4;
    const color = temperature < 750 ? null : blackbodyColor(temperature);
    $('#temp-output').value = fmt(temperature, 0); $('#temp-output').textContent = fmt(temperature, 0);
    $('#preset-caption').textContent = getPresetLabel(temperature);
    $('#lambda-output').innerHTML = `${fmt(lambdaPeak * 1e6, 2)} <small>µm</small>`;
    $('#power-output').innerHTML = `${fmt(power, power < 1000 ? 0 : 0)} <small>W/m²</small>`;
    $('#ratio-output').innerHTML = `${ratio >= 1000 ? ratio.toExponential(2).replace('.', ',').replace('e+', '×10^') : fmt(ratio, 2)} <small>×</small>`;
    const glow = $('#body-glow');
    glow.style.background = color || '#152638';
    glow.style.boxShadow = color ? `0 0 21px ${color}, inset -6px -6px 12px rgba(0,0,0,.4)` : 'inset -6px -6px 12px rgba(0,0,0,.5), 0 0 0 1px rgba(176,211,224,.18)';
    $('#body-color-label').textContent = color ? temperature < 1800 ? 'vermelho-alaranjado' : temperature < 4000 ? 'amarelo a branco' : 'branco azulado' : 'sem brilho visível';
    $$('.preset-chip').forEach(button => button.classList.toggle('active', Number(button.dataset.temp) === temperature));
    const description = temperature < 380 ? 'À temperatura ambiente, a emissão de um corpo negro tem seu pico no infravermelho. A energia está presente, embora nossos olhos não a percebam.' : temperature < 1000 ? 'Ao aquecer o corpo, aumenta a energia emitida e o pico se aproxima do infravermelho próximo. Ainda é difícil enxergar brilho visível.' : temperature < 3000 ? 'O corpo começa a brilhar em tons avermelhados. O pico segue no infravermelho, mas a cauda do espectro já alcança a luz visível.' : temperature < 5000 ? 'A emissão visível ganha força e a cor aparente passa de amarela a branca. A potência por área cresce rapidamente com T⁴.' : 'A curva se desloca para o visível e a emissão total é muito intensa. A superfície solar tem pico próximo de 0,5 µm.';
    $('#spectrum-explanation').textContent = description;
    $('#chart-summary').textContent = `Gráfico da lei de Planck para ${fmt(temperature, 0)} kelvin. O pico ocorre em ${fmt(lambdaPeak * 1e6, 2)} micrômetros. A curva é relativa ao seu próprio pico e cobre de 0,2 a 30 micrômetros.`;
    const peak = spectralExitance(lambdaPeak, temperature);
    [['04', .4], ['05', .5], ['1', 1], ['3', 3], ['10', 10], ['20', 20]].forEach(([id, lambda]) => { $(`#data-${id}`).textContent = fmt(chartPoint(lambda, temperature, peak), 3); });
    drawSpectrum(temperature);
  };
  tempSlider?.addEventListener('input', updateSpectrum);
  $$('.preset-chip').forEach(button => button.addEventListener('click', () => { tempSlider.value = button.dataset.temp; updateSpectrum(); }));
  $('#reset-spectrum')?.addEventListener('click', () => { tempSlider.value = 293; updateSpectrum(); });
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => drawSpectrum(Number(tempSlider.value)), 100); });
  updateSpectrum();

  // Pool heating model: 40 m³ water, fixed 8 m² collector, 10 simulated minutes per real second.
  const poolDefaults = { pool: 24, collector: 42, sun: 75, target: 30, flow: true };
  let poolState = { ...poolDefaults, current: poolDefaults.pool, running: false, paused: false, elapsed: 0, timer: null };
  const rangeInputs = { pool: $('#pool-temp'), collector: $('#collector-temp'), sun: $('#sun-intensity'), target: $('#target-temp') };
  const setRangeLabels = () => {
    poolState.pool = Number(rangeInputs.pool.value);
    poolState.collector = Number(rangeInputs.collector.value);
    poolState.sun = Number(rangeInputs.sun.value);
    poolState.target = Number(rangeInputs.target.value);
    poolState.flow = $('#flow-enabled').checked;
    if (!poolState.running) poolState.current = poolState.pool;
    $('#pool-temp-val').textContent = `${poolState.pool} °C`;
    $('#collector-temp-val').textContent = `${poolState.collector} °C`;
    $('#sun-intensity-val').textContent = `${poolState.sun}%`;
    $('#target-temp-val').textContent = `${poolState.target} °C`;
    updatePoolDisplay();
  };
  const pumpDecision = () => {
    if (!poolState.flow) return { on: false, message: 'Fluxo interrompido. A proteção mantém a bomba desligada.' };
    if (poolState.sun < 10) return { on: false, message: 'Radiação insuficiente. A bomba aguarda mais energia solar.' };
    if (poolState.collector < poolState.current + 3) return { on: false, message: 'O coletor não está pelo menos 3 °C mais quente que a piscina.' };
    if (poolState.current >= poolState.target - .01) return { on: false, message: 'Meta atingida. A bomba foi desligada para evitar aquecimento desnecessário.' };
    return { on: true, message: 'Condições atendidas. A bomba circula água pelo coletor aquecido.' };
  };
  const updatePoolDisplay = () => {
    const decision = pumpDecision();
    const active = poolState.running && !poolState.paused && decision.on;
    $('#monitor-pool-temp').innerHTML = `${fmt(poolState.current, 1)} <small>°C</small>`;
    $('#monitor-collector-temp').innerHTML = `${fmt(poolState.collector, 0)} <small>°C</small>`;
    $('#monitor-light').innerHTML = `${fmt(poolState.sun, 0)} <small>%</small>`;
    $('#monitor-pump').textContent = active ? 'LIGADA' : 'DESLIGADA';
    $('#sensor-pool-reading').textContent = `${fmt(poolState.current, 1)} °C`;
    $('#sensor-collector-reading').textContent = `${fmt(poolState.collector, 0)} °C`;
    $('#sensor-flow-reading').textContent = poolState.flow ? 'OK' : 'SEM FLUXO';
    $('#pool-water-label').textContent = `${fmt(poolState.current, 1)}°`;
    $('#sim-clock').textContent = `${String(Math.floor(poolState.elapsed / 60)).padStart(2, '0')}:${String(poolState.elapsed % 60).padStart(2, '0')}`;
    const progress = Math.max(0, Math.min(1, (poolState.current - poolState.pool) / Math.max(1, poolState.target - poolState.pool)));
    $('#progress-fill').style.width = `${progress * 100}%`; $('#progress-label').textContent = `${fmt(progress * 100, 0)}%`;
    const visual = $('#pool-visual'); visual.classList.toggle('running', active);
    const state = $('#system-state');
    state.classList.toggle('running', active); state.classList.toggle('paused', poolState.paused);
    state.querySelector('span').textContent = poolState.paused ? 'SIMULAÇÃO PAUSADA' : poolState.running ? active ? 'CIRCULAÇÃO ATIVA' : 'AGUARDANDO CONDIÇÕES' : 'SISTEMA EM ESPERA';
    $('#pool-sim-message').textContent = poolState.paused ? 'Simulação pausada. Ajuste os controles ou retome quando quiser.' : poolState.running ? decision.message : 'Pronto para iniciar. A bomba aguarda as condições definidas pela lógica.';
    $('#start-pool-sim').disabled = poolState.running && !poolState.paused;
    $('#pause-pool-sim').disabled = !poolState.running;
    $('#pause-pool-sim').innerHTML = poolState.paused ? '<span aria-hidden="true">▶</span> Retomar' : '<span aria-hidden="true">Ⅱ</span> Pausar';
    $('.sunbeam').style.opacity = String(.15 + poolState.sun / 110);
  };
  const poolTick = () => {
    if (!poolState.running || poolState.paused) return;
    poolState.elapsed += 10;
    const decision = pumpDecision();
    if (decision.on) {
      const gradientFactor = Math.max(0, Math.min(1, (poolState.collector - poolState.current - 3) / 25));
      const absorbedPower = 4300 * (poolState.sun / 100) * gradientFactor;
      const heatLoss = Math.max(0, (poolState.current - 20) * 150);
      const waterHeatCapacity = 40000 * 4186;
      const delta = Math.max(0, (absorbedPower - heatLoss) * 600 / waterHeatCapacity);
      poolState.current = Math.min(poolState.target, poolState.collector - 3, poolState.current + delta);
    }
    updatePoolDisplay();
  };
  Object.values(rangeInputs).forEach(input => input.addEventListener('input', setRangeLabels));
  $('#flow-enabled').addEventListener('change', setRangeLabels);
  $('#start-pool-sim').addEventListener('click', () => {
    if (poolState.paused) poolState.paused = false;
    else if (!poolState.running) { poolState.running = true; poolState.current = Number(rangeInputs.pool.value); poolState.elapsed = 0; }
    if (!poolState.timer) poolState.timer = window.setInterval(poolTick, 1000);
    updatePoolDisplay();
  });
  $('#pause-pool-sim').addEventListener('click', () => { poolState.paused = !poolState.paused; updatePoolDisplay(); });
  $('#reset-pool-sim').addEventListener('click', () => {
    if (poolState.timer) window.clearInterval(poolState.timer);
    poolState = { ...poolDefaults, current: poolDefaults.pool, running: false, paused: false, elapsed: 0, timer: null };
    rangeInputs.pool.value = poolDefaults.pool; rangeInputs.collector.value = poolDefaults.collector; rangeInputs.sun.value = poolDefaults.sun; rangeInputs.target.value = poolDefaults.target; $('#flow-enabled').checked = true;
    setRangeLabels();
  });
  setRangeLabels();

  // Short formative quiz with explanatory feedback.
  const questions = [
    { q: 'O que define um corpo negro ideal?', options: ['Um objeto que só emite luz visível.', 'Um modelo que absorve toda a radiação incidente e emite conforme sua temperatura.', 'Um material que nunca aquece.', 'Uma superfície que reflete toda a radiação.'], answer: 1, why: 'O corpo negro ideal absorve toda a radiação que recebe (ε = 1). Em equilíbrio térmico, sua emissão depende apenas da temperatura.' },
    { q: 'Quando a temperatura de um corpo negro aumenta, o que acontece com o pico de emissão?', options: ['Desloca-se para comprimentos de onda menores.', 'Desloca-se sempre para o infravermelho distante.', 'Permanece fixo.', 'Desaparece.'], answer: 0, why: 'A lei de Wien diz λmáx = b/T. Como λmáx é inversamente proporcional a T, o pico se desloca para comprimentos de onda menores.' },
    { q: 'Se a temperatura absoluta dobrar, como muda a potência emitida por área por um corpo negro?', options: ['Dobra.', 'Fica quatro vezes maior.', 'Fica oito vezes maior.', 'Fica dezesseis vezes maior.'], answer: 3, why: 'Pela lei de Stefan–Boltzmann, M = σT⁴. Dobrar T multiplica M por 2⁴ = 16.' },
    { q: 'Por que o pico do espectro da superfície solar está perto da luz visível?', options: ['Porque o Sol só emite luz visível.', 'Porque sua temperatura de cerca de 5.778 K coloca o pico próximo de 500 nm.', 'Porque a atmosfera cria toda a luz solar.', 'Porque o infravermelho não transporta energia.'], answer: 1, why: 'Com T ≈ 5.778 K, a lei de Wien estima λmáx ≈ 0,50 µm, na região visível. O espectro solar também contém infravermelho e ultravioleta.' },
    { q: 'Qual é a conversão característica de um coletor solar térmico?', options: ['Calor em luz.', 'Radiação absorvida em energia térmica transferida ao fluido.', 'Luz diretamente em dados digitais.', 'Eletricidade em massa.'], answer: 1, why: 'A superfície absorvedora transforma parte da energia radiante em energia interna. Depois, a energia é transferida ao fluido por contato e circulação.' },
    { q: 'O que mede diretamente um sensor BH1750?', options: ['Irradiância em W/m².', 'Temperatura em °C.', 'Iluminância em lux.', 'Vazão em litros por minuto.'], answer: 2, why: 'O BH1750 mede iluminância fotométrica em lux. Essa leitura pode indicar luz ambiente, mas não substitui uma medição radiométrica de irradiância em W/m².' },
    { q: 'Qual deve ser a resposta segura se o sensor não detectar fluxo de água?', options: ['Ligar a bomba com potência máxima.', 'Manter o sistema como está.', 'Desligar a circulação comandada e sinalizar a condição.', 'Ignorar o sensor.'], answer: 2, why: 'A lógica deve interromper a operação quando não há fluxo, para evitar funcionamento fora das condições de projeto e possível sobreaquecimento.' },
    { q: 'Quando a lógica didática liga a bomba para captar calor?', options: ['Sempre que a piscina estiver abaixo da meta, mesmo sem fluxo.', 'Quando há fluxo, luz suficiente, coletor mais quente que a água e a piscina ainda está abaixo da meta.', 'Quando o coletor está mais frio que a piscina.', 'Apenas à noite.'], answer: 1, why: 'A bomba só circula se as condições de segurança e ganho térmico estiverem presentes: fluxo confirmado, energia solar disponível, diferença térmica e margem até a meta.' }
  ];
  let quizIndex = 0, quizScore = 0, answered = false;
  const renderQuestion = () => {
    const question = questions[quizIndex]; answered = false;
    $('#quiz-count').textContent = `QUESTÃO ${String(quizIndex + 1).padStart(2, '0')} / ${String(questions.length).padStart(2, '0')}`;
    $('#quiz-question').textContent = question.q;
    $('#quiz-score').textContent = String(quizScore);
    $('#quiz-progress-fill').style.width = `${((quizIndex + 1) / questions.length) * 100}%`;
    $('#quiz-feedback').hidden = true; $('#quiz-feedback').textContent = ''; $('#quiz-next').hidden = true;
    $('#quiz-options').innerHTML = '';
    question.options.forEach((option, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'quiz-option';
      const letter = document.createElement('span'); letter.className = 'option-letter'; letter.textContent = String.fromCharCode(65 + index);
      const text = document.createElement('span'); text.textContent = option;
      button.append(letter, text); button.addEventListener('click', () => answerQuestion(index)); $('#quiz-options').append(button);
    });
  };
  const answerQuestion = selected => {
    if (answered) return;
    answered = true; const question = questions[quizIndex]; const correct = selected === question.answer;
    if (correct) quizScore += 1;
    $$('.quiz-option').forEach((button, index) => { button.disabled = true; if (index === question.answer) button.classList.add('correct'); else if (index === selected) button.classList.add('incorrect'); });
    $('#quiz-score').textContent = String(quizScore);
    const feedback = $('#quiz-feedback'); feedback.innerHTML = `<strong>${correct ? 'Correto — boa leitura.' : 'Vamos revisar a ideia.'}</strong>${question.why}`; feedback.hidden = false;
    $('#quiz-next').hidden = false; $('#quiz-next').innerHTML = quizIndex === questions.length - 1 ? 'Ver resultado <span aria-hidden="true">→</span>' : 'Próxima questão <span aria-hidden="true">→</span>';
  };
  $('#quiz-next').addEventListener('click', () => {
    if (quizIndex < questions.length - 1) { quizIndex += 1; renderQuestion(); $('#quiz-question').focus?.(); }
    else {
      $('#quiz-content').hidden = true; $('#quiz-finished').hidden = false;
      $('#quiz-result-title').textContent = quizScore === questions.length ? 'Domínio completo!' : quizScore >= 6 ? 'Ótimo trabalho!' : quizScore >= 4 ? 'Boa exploração!' : 'Continue investigando!';
      $('#quiz-result-text').textContent = `Você acertou ${quizScore} de ${questions.length}. ${quizScore < questions.length ? 'Revise os conceitos e tente novamente para consolidar sua compreensão.' : 'Você conectou o fenômeno físico à automação com precisão.'}`;
    }
  });
  $('#quiz-restart').addEventListener('click', () => { quizIndex = 0; quizScore = 0; $('#quiz-content').hidden = false; $('#quiz-finished').hidden = true; renderQuestion(); });
  renderQuestion();

  // Searchable glossary. Each entry keeps its full explanation available to assistive technology.
  const glossary = [
    ['Corpo negro', 'Modelo ideal que absorve toda a radiação incidente e, em equilíbrio térmico, emite um espectro determinado pela temperatura.'],
    ['Emissividade', 'Razão entre a emissão de uma superfície real e a de um corpo negro à mesma temperatura. Seu valor ideal é 1.'],
    ['Espectro eletromagnético', 'Conjunto de radiações organizado por frequência ou comprimento de onda, do rádio aos raios gama.'],
    ['Frequência', 'Número de oscilações de uma onda por segundo, medida em hertz (Hz). No vácuo, frequência e comprimento de onda se relacionam por c = λf.'],
    ['Irradiância', 'Potência radiante que incide sobre uma área, medida em watts por metro quadrado (W/m²).'],
    ['Lei de Planck', 'Expressão que descreve como a energia de um corpo negro se distribui entre comprimentos de onda para uma temperatura.'],
    ['Lei de Stefan–Boltzmann', 'Para um corpo negro, a potência emitida por área é M = σT⁴.'],
    ['Lei de Wien', 'Relaciona o comprimento de onda de pico e a temperatura absoluta por λmáx T = b.'],
    ['Microcontrolador', 'Pequeno computador programável que lê sinais de sensores e controla saídas, como um relé ou uma bomba.'],
    ['Comprimento de onda', 'Distância entre pontos equivalentes de uma onda, representada por λ e medida em metros ou submúltiplos.'],
    ['Radiação térmica', 'Energia eletromagnética emitida pela matéria devido à sua temperatura. Não precisa de um meio material para se propagar.'],
    ['Temperatura absoluta', 'Temperatura medida a partir do zero absoluto, em kelvin (K). As leis de Wien e Stefan–Boltzmann usam essa escala.'],
    ['Transferência de calor', 'Passagem de energia térmica entre sistemas por condução, convecção ou radiação.'],
    ['Iluminância', 'Fluxo luminoso percebido por área, medido em lux (lx). Não é a mesma grandeza radiométrica que irradiância.'],
    ['Sensor', 'Componente que detecta uma grandeza física e fornece um sinal que pode ser lido por um circuito.']
  ].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  const glossaryList = $('#glossary-list');
  const renderGlossary = (query = '') => {
    const norm = query.trim().toLocaleLowerCase('pt-BR');
    const matches = glossary.filter(([term, definition]) => `${term} ${definition}`.toLocaleLowerCase('pt-BR').includes(norm));
    glossaryList.innerHTML = '';
    matches.forEach(([term, definition]) => {
      const item = document.createElement('details'); item.className = 'glossary-item';
      const summary = document.createElement('summary'); summary.textContent = term;
      const paragraph = document.createElement('p'); paragraph.textContent = definition;
      item.append(summary, paragraph); glossaryList.append(item);
    });
    $('#glossary-count').textContent = `${matches.length} ${matches.length === 1 ? 'termo' : 'termos'}`;
    $('#glossary-empty').hidden = matches.length > 0;
  };
  const glossarySearch = $('#glossary-search');
  glossarySearch.addEventListener('input', () => renderGlossary(glossarySearch.value));
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !accessDialog.open) { event.preventDefault(); glossarySearch.focus(); }
  });
  renderGlossary();

  $('#year').textContent = new Date().getFullYear();
})();
