/**
 * SISTEMA DE SIMULACIÓN AERONÁUTICA: MÉTODOS NUMÉRICOS
 * Implementación de Euler, Heun (RK2), Runge-Kutta 4 (RK4) y Solución Analítica
 * Tema: Fondo Beige Clásico (#f8f8d9) y Guindo Elegante (#a20003)
 */

// Estado global de la simulación
const simState = {
  params: {
    m: 1000,       // kg
    T: 15000,      // N
    g: 9.81,       // m/s^2
    c: 100,        // kg/s
    tMax: 20,      // s
    h: 2.0,        // s
    v0: 0,         // m/s
    h0: 0          // m
  },
  methods: {
    euler: true,
    heun: true,
    rk4: true,
    exact: true
  },
  data: null,
  convergenceData: null,
  animation: {
    isRunning: false,
    currentTime: 0,
    speedFactor: 2.0,
    lastTimestamp: 0,
    particles: []
  }
};

// Instancias de Chart.js
let chartVelocity = null;
let chartAltitude = null;
let chartErrors = null;
let chartConvergence = null;

// ==========================================
// 1. MODELO MATEMÁTICO Y MÉTODOS NUMÉRICOS
// ==========================================

function dv_dt(v, params) {
  // dv/dt = (T - m*g - c*v) / m
  return (params.T - params.m * params.g - params.c * v) / params.m;
}

function dh_dt(v) {
  // dh/dt = v
  return v;
}

function getExactSolution(t, params) {
  const F_net0 = params.T - params.m * params.g;
  const v_terminal = F_net0 / params.c;
  const lambda = params.c / params.m;

  // v(t) = v_inf + (v0 - v_inf) * exp(-lambda * t)
  const v = v_terminal + (params.v0 - v_terminal) * Math.exp(-lambda * t);

  // h(t) = h0 + v_inf * t + ((v0 - v_inf) / lambda) * (1 - exp(-lambda * t))
  const h = params.h0 + v_terminal * t + ((params.v0 - v_terminal) / lambda) * (1.0 - Math.exp(-lambda * t));

  return { v, h };
}

function runSimulationEngine(params) {
  const { tMax, h, v0, h0 } = params;
  const numSteps = Math.round(tMax / h);

  const times = [];
  const exact = { v: [], h: [] };
  const euler = { v: [], h: [], errV: [], errH: [] };
  const heun  = { v: [], h: [], errV: [], errH: [] };
  const rk4   = { v: [], h: [], errV: [], errH: [] };

  // Inicialización
  let v_e = v0, h_e = h0;
  let v_h = v0, h_h = h0;
  let v_r = v0, h_r = h0;

  for (let i = 0; i <= numSteps; i++) {
    const t = i * h;
    times.push(t);

    // Solución analítica exacta
    const solExact = getExactSolution(t, params);
    exact.v.push(solExact.v);
    exact.h.push(solExact.h);

    // Registrar Euler
    euler.v.push(v_e);
    euler.h.push(h_e);
    euler.errV.push(Math.abs(v_e - solExact.v));
    euler.errH.push(Math.abs(h_e - solExact.h));

    // Registrar Heun
    heun.v.push(v_h);
    heun.h.push(h_h);
    heun.errV.push(Math.abs(v_h - solExact.v));
    heun.errH.push(Math.abs(h_h - solExact.h));

    // Registrar RK4
    rk4.v.push(v_r);
    rk4.h.push(h_r);
    rk4.errV.push(Math.abs(v_r - solExact.v));
    rk4.errH.push(Math.abs(h_r - solExact.h));

    if (i < numSteps) {
      // 1. Avance por Método de Euler
      const dv_e = dv_dt(v_e, params);
      const dh_e = dh_dt(v_e);
      v_e = v_e + h * dv_e;
      h_e = h_e + h * dh_e;

      // 2. Avance por Método de Heun (Predictor-Corrector)
      const k1_v = dv_dt(v_h, params);
      const k1_h = dh_dt(v_h);

      const v_pred = v_h + h * k1_v;
      const h_pred = h_h + h * k1_h;

      const k2_v = dv_dt(v_pred, params);
      const k2_h = dh_dt(v_pred);

      v_h = v_h + 0.5 * h * (k1_v + k2_v);
      h_h = h_h + 0.5 * h * (k1_h + k2_h);

      // 3. Avance por Runge-Kutta de 4.º Orden (RK4)
      const r_k1_v = dv_dt(v_r, params);
      const r_k1_h = dh_dt(v_r);

      const r_v2 = v_r + 0.5 * h * r_k1_v;
      const r_k2_v = dv_dt(r_v2, params);
      const r_k2_h = dh_dt(r_v2);

      const r_v3 = v_r + 0.5 * h * r_k2_v;
      const r_k3_v = dv_dt(r_v3, params);
      const r_k3_h = dh_dt(r_v3);

      const r_v4 = v_r + h * r_k3_v;
      const r_k4_v = dv_dt(r_v4, params);
      const r_k4_h = dh_dt(r_v4);

      v_r = v_r + (h / 6.0) * (r_k1_v + 2.0 * r_k2_v + 2.0 * r_k3_v + r_k4_v);
      h_r = h_r + (h / 6.0) * (r_k1_h + 2.0 * r_k2_h + 2.0 * r_k3_h + r_k4_h);
    }
  }

  return { times, exact, euler, heun, rk4 };
}

function computeConvergenceStudy(params) {
  const steps = [2.0, 1.0, 0.5, 0.25, 0.1];
  const results = [];

  steps.forEach(stepH => {
    const p = { ...params, h: stepH };
    const sim = runSimulationEngine(p);
    const lastIdx = sim.times.length - 1;

    results.push({
      h: stepH,
      eulerErrV: sim.euler.errV[lastIdx],
      eulerErrH: sim.euler.errH[lastIdx],
      heunErrV: sim.heun.errV[lastIdx],
      heunErrH: sim.heun.errH[lastIdx],
      rk4ErrV: sim.rk4.errV[lastIdx],
      rk4ErrH: sim.rk4.errH[lastIdx],
      eulerFinalV: sim.euler.v[lastIdx],
      eulerFinalH: sim.euler.h[lastIdx],
      exactFinalV: sim.exact.v[lastIdx],
      exactFinalH: sim.exact.h[lastIdx]
    });
  });

  return results;
}

// ==========================================
// 2. ACTUALIZACIÓN DE INTERFAZ Y SCORECARDS
// ==========================================

function updateUI() {
  const p = simState.params;
  simState.data = runSimulationEngine(p);
  simState.convergenceData = computeConvergenceStudy(p);

  const lastIdx = simState.data.times.length - 1;
  const v_exact = simState.data.exact.v[lastIdx];
  const h_exact = simState.data.exact.h[lastIdx];
  const v_euler = simState.data.euler.v[lastIdx];
  const h_euler = simState.data.euler.h[lastIdx];
  const v_rk4   = simState.data.rk4.v[lastIdx];
  const h_rk4   = simState.data.rk4.h[lastIdx];

  const errV_euler = Math.abs(v_euler - v_exact);
  const errH_euler = Math.abs(h_euler - h_exact);
  const errH_rk4   = Math.abs(h_rk4 - h_exact);

  // KPIs
  document.getElementById('kpi-v-euler').textContent = `${v_euler.toFixed(4)} m/s`;
  const pctV = Math.abs(v_exact) > 1e-4 ? ((errV_euler / Math.abs(v_exact)) * 100).toFixed(2) : '0.00';
  document.getElementById('kpi-v-euler-err').textContent = `Error: ${errV_euler.toFixed(4)} m/s (${pctV}%)`;

  document.getElementById('kpi-h-euler').textContent = `${h_euler.toFixed(2)} m`;
  const pctH = Math.abs(h_exact) > 1e-4 ? ((errH_euler / Math.abs(h_exact)) * 100).toFixed(2) : '0.00';
  document.getElementById('kpi-h-euler-err').textContent = `Error: ${errH_euler.toFixed(2)} m (${pctH}%)`;

  document.getElementById('kpi-v-exact').textContent = `${v_exact.toFixed(4)} m/s`;
  document.getElementById('kpi-h-exact').textContent = `${h_exact.toFixed(2)} m`;

  document.getElementById('kpi-rk4-err').textContent = `${errH_rk4.toFixed(4)} m`;
  const precisionGain = errH_rk4 > 1e-7 ? Math.round(errH_euler / errH_rk4) : '> 100,000';
  document.getElementById('kpi-rk4-sub').textContent = `RK4 es ${precisionGain}x más preciso que Euler`;

  // Criterio de Control de Vuelo (Error V < 0.5 m/s, Error H < 5.0 m)
  const badgeCriteria = document.getElementById('mission-criteria-badge');
  const badgeText = document.getElementById('mission-criteria-desc');

  if (errV_euler < 0.5 && errH_euler < 5.0) {
    badgeCriteria.textContent = "MISIÓN NOMINAL: APROBADA";
    badgeCriteria.className = "criteria-badge badge-success";
    badgeText.innerHTML = `Paso h = ${p.h} s cumple las tolerancias requeridas de seguridad de vuelo (Error velocidad &lt; 0.5 m/s y Error altura &lt; 5 m).`;
  } else {
    badgeCriteria.textContent = "ALERTA: RIESGO CRÍTICO";
    badgeCriteria.className = "criteria-badge badge-danger";
    badgeText.innerHTML = `Con paso h = ${p.h} s el error en altura es de <strong>${errH_euler.toFixed(2)} m</strong> (excede el límite seguro de 5 m). En la misión de 1962 de la NASA, Katherine Johnson demostró que esta divergencia comprometía el corredor de reentrada de John Glenn.`;
  }

  updateCharts();
  renderTelemetryTable();
}

// ==========================================
// 3. GRÁFICAS INTERACTIVAS (CHART.JS)
// ==========================================

function initCharts() {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no disponible.');
    return;
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: '#571317', font: { family: 'Inter', size: 11, weight: '600' } }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#a20003',
        bodyColor: '#2d0506',
        borderColor: '#a20003',
        borderWidth: 1.5,
        bodyFont: { family: 'JetBrains Mono', weight: '600' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(162, 0, 3, 0.08)' },
        ticks: { color: '#803035', font: { family: 'JetBrains Mono', weight: '600' } },
        title: { display: true, text: 'Tiempo (s)', color: '#a20003', font: { size: 11, weight: '700' } }
      },
      y: {
        grid: { color: 'rgba(162, 0, 3, 0.08)' },
        ticks: { color: '#803035', font: { family: 'JetBrains Mono', weight: '600' } }
      }
    }
  };

  // 1. Gráfica de Velocidad
  const ctxV = document.getElementById('chartVelocity').getContext('2d');
  chartVelocity = new Chart(ctxV, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { ...chartOptions.scales.y, title: { display: true, text: 'Velocidad (m/s)', color: '#a20003', font: { weight: '700' } } }
      }
    }
  });

  // 2. Gráfica de Altura
  const ctxH = document.getElementById('chartAltitude').getContext('2d');
  chartAltitude = new Chart(ctxH, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { ...chartOptions.scales.y, title: { display: true, text: 'Altura (m)', color: '#a20003', font: { weight: '700' } } }
      }
    }
  });

  // 3. Gráfica de Error Absoluto
  const ctxErr = document.getElementById('chartErrors').getContext('2d');
  chartErrors = new Chart(ctxErr, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { ...chartOptions.scales.y, title: { display: true, text: 'Error en Altura (m)', color: '#a20003', font: { weight: '700' } } }
      }
    }
  });

  // 4. Gráfica de Convergencia
  const ctxConv = document.getElementById('chartConvergence').getContext('2d');
  chartConvergence = new Chart(ctxConv, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        x: {
          ...chartOptions.scales.x,
          title: { display: true, text: 'Tamaño de Paso h (s)', color: '#a20003', font: { weight: '700' } }
        },
        y: {
          ...chartOptions.scales.y,
          type: 'logarithmic',
          title: { display: true, text: 'Error Altura (m, Escala Log)', color: '#a20003', font: { weight: '700' } }
        }
      }
    }
  });
}

function updateCharts() {
  if (typeof Chart === 'undefined' || !chartVelocity || !simState.data) return;

  const labels = simState.data.times.map(t => `${t.toFixed(1)}s`);

  // Actualizar Velocidad
  chartVelocity.data.labels = labels;
  chartVelocity.data.datasets = [
    {
      label: 'Solución Exacta Analítica',
      data: simState.data.exact.v,
      borderColor: '#111111',
      borderWidth: 2.5,
      borderDash: [5, 4],
      pointRadius: 0,
      tension: 0.1
    },
    {
      label: 'Euler (h=' + simState.params.h + 's)',
      data: simState.data.euler.v,
      borderColor: '#a20003',
      backgroundColor: 'rgba(162, 0, 3, 0.1)',
      borderWidth: 2.2,
      pointRadius: 3,
      tension: 0
    },
    {
      label: 'Heun (RK2)',
      data: simState.data.heun.v,
      borderColor: '#b45309',
      borderWidth: 1.8,
      pointRadius: 2,
      tension: 0
    },
    {
      label: 'Runge-Kutta 4 (RK4)',
      data: simState.data.rk4.v,
      borderColor: '#6b21a8',
      borderWidth: 2,
      pointRadius: 2.5,
      tension: 0
    }
  ];
  chartVelocity.update();

  // Actualizar Altura
  chartAltitude.data.labels = labels;
  chartAltitude.data.datasets = [
    {
      label: 'Solución Exacta Analítica',
      data: simState.data.exact.h,
      borderColor: '#111111',
      borderWidth: 2.5,
      borderDash: [5, 4],
      pointRadius: 0,
      tension: 0.1
    },
    {
      label: 'Euler (h=' + simState.params.h + 's)',
      data: simState.data.euler.h,
      borderColor: '#a20003',
      borderWidth: 2.2,
      pointRadius: 3,
      tension: 0
    },
    {
      label: 'Heun (RK2)',
      data: simState.data.heun.h,
      borderColor: '#b45309',
      borderWidth: 1.8,
      pointRadius: 2,
      tension: 0
    },
    {
      label: 'Runge-Kutta 4 (RK4)',
      data: simState.data.rk4.h,
      borderColor: '#6b21a8',
      borderWidth: 2,
      pointRadius: 2.5,
      tension: 0
    }
  ];
  chartAltitude.update();

  // Actualizar Errores
  chartErrors.data.labels = labels;
  chartErrors.data.datasets = [
    {
      label: 'Error Euler: |h_E - h_exact|',
      data: simState.data.euler.errH,
      borderColor: '#a20003',
      backgroundColor: 'rgba(162, 0, 3, 0.12)',
      fill: true,
      borderWidth: 2.2,
      pointRadius: 2
    },
    {
      label: 'Error Heun: |h_H - h_exact|',
      data: simState.data.heun.errH,
      borderColor: '#b45309',
      borderWidth: 1.8,
      pointRadius: 2
    },
    {
      label: 'Error RK4: |h_RK4 - h_exact|',
      data: simState.data.rk4.errH,
      borderColor: '#6b21a8',
      borderWidth: 2,
      pointRadius: 2.5
    }
  ];
  chartErrors.update();

  // Actualizar Convergencia
  const convLabels = simState.convergenceData.map(c => `h = ${c.h}s`);
  chartConvergence.data.labels = convLabels;
  chartConvergence.data.datasets = [
    {
      label: 'Error Euler (O(h))',
      data: simState.convergenceData.map(c => c.eulerErrH),
      backgroundColor: 'rgba(162, 0, 3, 0.85)'
    },
    {
      label: 'Error Heun (O(h²))',
      data: simState.convergenceData.map(c => c.heunErrH),
      backgroundColor: 'rgba(180, 83, 9, 0.85)'
    },
    {
      label: 'Error RK4 (O(h⁴))',
      data: simState.convergenceData.map(c => Math.max(c.rk4ErrH, 1e-6)),
      backgroundColor: 'rgba(107, 33, 168, 0.85)'
    }
  ];
  chartConvergence.update();
}

// ==========================================
// 4. TABLA DE ITERACIONES Y EXPORTACIÓN CSV
// ==========================================

function renderTelemetryTable() {
  const tbody = document.getElementById('telemetryTableBody');
  if (!tbody || !simState.data) return;

  tbody.innerHTML = '';
  const d = simState.data;

  for (let i = 0; i < d.times.length; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i}</td>
      <td><strong>${d.times[i].toFixed(1)}</strong></td>
      <td class="highlight-euler">${d.euler.v[i].toFixed(4)}</td>
      <td class="highlight-heun">${d.heun.v[i].toFixed(4)}</td>
      <td class="highlight-rk4">${d.rk4.v[i].toFixed(4)}</td>
      <td class="highlight-exact">${d.exact.v[i].toFixed(4)}</td>
      <td>${d.euler.errV[i].toFixed(4)}</td>
      <td class="highlight-euler">${d.euler.h[i].toFixed(2)}</td>
      <td class="highlight-heun">${d.heun.h[i].toFixed(2)}</td>
      <td class="highlight-rk4">${d.rk4.h[i].toFixed(2)}</td>
      <td class="highlight-exact">${d.exact.h[i].toFixed(2)}</td>
      <td>${d.euler.errH[i].toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function exportTableToCSV() {
  if (!simState.data) return;
  const d = simState.data;

  let csv = 'Iteracion,Tiempo_s,v_Euler_ms,v_Heun_ms,v_RK4_ms,v_Exacta_ms,Error_v_Euler_ms,h_Euler_m,h_Heun_m,h_RK4_m,h_Exacta_m,Error_h_Euler_m\n';

  for (let i = 0; i < d.times.length; i++) {
    csv += [
      i,
      d.times[i].toFixed(2),
      d.euler.v[i].toFixed(6),
      d.heun.v[i].toFixed(6),
      d.rk4.v[i].toFixed(6),
      d.exact.v[i].toFixed(6),
      d.euler.errV[i].toFixed(6),
      d.euler.h[i].toFixed(6),
      d.heun.h[i].toFixed(6),
      d.rk4.h[i].toFixed(6),
      d.exact.h[i].toFixed(6),
      d.euler.errH[i].toFixed(6)
    ].join(',') + '\n';
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `telemetria_despegue_h_${simState.params.h}s.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// 5. ANIMACIÓN DEL COHETE EN CANVAS HTML5
// ==========================================

const canvas = document.getElementById('rocketCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// Partículas de escape
class ExhaustParticle {
  constructor(x, y, vx, vy, size, color, maxLife) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.maxLife = maxLife;
    this.life = maxLife;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.size *= 0.96;
    this.life--;
  }

  draw(context) {
    const alpha = Math.max(0, this.life / this.maxLife);
    context.fillStyle = this.color.replace('ALPHA', alpha.toFixed(2));
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
  }
}

// Generar estrellas fijas
const stars = [];
for (let i = 0; i < 75; i++) {
  stars.push({
    x: Math.random(),
    y: Math.random(),
    radius: Math.random() * 1.5 + 0.4,
    alpha: Math.random() * 0.7 + 0.3
  });
}

function drawRocketScene(interpolatedData) {
  if (!ctx || !canvas) return;

  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  // Fondo espacial
  const maxH = 650;
  const progress = Math.min(1.0, Math.abs(interpolatedData.h) / maxH);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a0204');
  grad.addColorStop(0.55 - 0.25 * progress, '#2b070f');
  grad.addColorStop(1, '#480f1b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Estrellas
  stars.forEach(st => {
    ctx.fillStyle = `rgba(248, 248, 217, ${st.alpha * (0.35 + 0.65 * progress)})`;
    ctx.beginPath();
    ctx.arc(st.x * w, st.y * (h * 0.78), st.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Base de despegue
  const groundY = h - 35;
  const launchPadOffset = Math.max(0, interpolatedData.h) * 0.75;
  const effectiveGroundY = groundY + launchPadOffset;

  if (effectiveGroundY < h + 100) {
    ctx.fillStyle = '#2b070f';
    ctx.fillRect(0, effectiveGroundY, w, 40);

    // Torre de servicio
    ctx.strokeStyle = '#a20003';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(w * 0.35 - 28, effectiveGroundY - 85, 18, 85);
    ctx.beginPath();
    ctx.moveTo(w * 0.35 - 28, effectiveGroundY - 55);
    ctx.lineTo(w * 0.35 - 10, effectiveGroundY - 35);
    ctx.moveTo(w * 0.35 - 28, effectiveGroundY - 35);
    ctx.lineTo(w * 0.35 - 10, effectiveGroundY - 55);
    ctx.stroke();
  }

  // Posición del cohete
  const clampedH = Math.max(0, interpolatedData.h);
  const rocketScreenY = Math.max(70, groundY - (clampedH * (h - 120) / maxH));
  const rocketX = w * 0.5;

  // Emisión de partículas
  if (simState.animation.isRunning && interpolatedData.t > 0 && interpolatedData.t < simState.params.tMax) {
    for (let k = 0; k < 4; k++) {
      const vx = (Math.random() - 0.5) * 1.6;
      const vy = Math.random() * 4 + 4;
      const size = Math.random() * 6 + 4;
      const isFire = Math.random() > 0.35;
      const color = isFire
        ? `rgba(245, 158, 11, ALPHA)`
        : `rgba(248, 248, 217, ALPHA)`;
      simState.animation.particles.push(
        new ExhaustParticle(rocketX, rocketScreenY + 38, vx, vy, size, color, 25)
      );
    }
  }

  // Partículas activas
  for (let i = simState.animation.particles.length - 1; i >= 0; i--) {
    const p = simState.animation.particles[i];
    p.update();
    p.draw(ctx);
    if (p.life <= 0) {
      simState.animation.particles.splice(i, 1);
    }
  }

  // Cohete estilizado
  ctx.save();
  ctx.translate(rocketX, rocketScreenY);

  // Fuselaje blanco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-10, -25, 20, 55);

  // Franjas guindo (#a20003)
  ctx.fillStyle = '#a20003';
  ctx.fillRect(-10, -6, 20, 8);
  ctx.fillRect(-10, 15, 20, 5);

  // Cono de la ojiva
  ctx.fillStyle = '#f8f8d9';
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(10, -25);
  ctx.lineTo(-10, -25);
  ctx.closePath();
  ctx.fill();

  // Torre de escape superior
  ctx.strokeStyle = '#a20003';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(0, -56);
  ctx.moveTo(-3, -56);
  ctx.lineTo(3, -56);
  ctx.stroke();

  // Aletas laterales
  ctx.fillStyle = '#6e0002';
  ctx.beginPath();
  ctx.moveTo(-10, 15);
  ctx.lineTo(-18, 30);
  ctx.lineTo(-10, 30);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(10, 15);
  ctx.lineTo(18, 30);
  ctx.lineTo(10, 30);
  ctx.closePath();
  ctx.fill();

  // Tobera del motor
  ctx.fillStyle = '#1a0508';
  ctx.beginPath();
  ctx.moveTo(-7, 30);
  ctx.lineTo(7, 30);
  ctx.lineTo(9, 36);
  ctx.lineTo(-9, 36);
  ctx.closePath();
  ctx.fill();

  // Llama propulsora
  if (simState.animation.isRunning && interpolatedData.t < simState.params.tMax) {
    const flameLen = 18 + Math.random() * 14;
    const flameGrad = ctx.createLinearGradient(0, 36, 0, 36 + flameLen);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.25, '#fbbf24');
    flameGrad.addColorStop(0.65, '#a20003');
    flameGrad.addColorStop(1, 'rgba(162, 0, 3, 0)');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-6, 36);
    ctx.lineTo(6, 36);
    ctx.lineTo(0, 36 + flameLen);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Actualizar HUD
  document.getElementById('hud-time').textContent = `${interpolatedData.t.toFixed(1)} s`;
  document.getElementById('hud-v-euler').textContent = `${interpolatedData.v_euler.toFixed(2)} m/s`;
  document.getElementById('hud-v-exact').textContent = `${interpolatedData.v_exact.toFixed(2)} m/s`;
  document.getElementById('hud-h-euler').textContent = `${interpolatedData.h_euler.toFixed(1)} m`;
  document.getElementById('hud-h-exact').textContent = `${interpolatedData.h_exact.toFixed(1)} m`;
}

function getInterpolatedDataAt(time) {
  const d = simState.data;
  if (!d) return { t: 0, v_euler: 0, h_euler: 0, v_exact: 0, h_exact: 0, h: 0 };

  const exact = getExactSolution(time, simState.params);

  const hStep = simState.params.h;
  const idx = Math.min(Math.floor(time / hStep), d.times.length - 2);
  const nextIdx = Math.min(idx + 1, d.times.length - 1);

  const t0 = d.times[idx];
  const t1 = d.times[nextIdx];
  const ratio = t1 > t0 ? (time - t0) / (t1 - t0) : 0;

  const v_euler = d.euler.v[idx] + ratio * (d.euler.v[nextIdx] - d.euler.v[idx]);
  const h_euler = d.euler.h[idx] + ratio * (d.euler.h[nextIdx] - d.euler.h[idx]);

  return {
    t: time,
    v_euler,
    h_euler,
    v_exact: exact.v,
    h_exact: exact.h,
    h: exact.h
  };
}

function animationLoop(timestamp) {
  if (!simState.animation.isRunning) return;

  if (!simState.animation.lastTimestamp) {
    simState.animation.lastTimestamp = timestamp;
  }

  const dtReal = (timestamp - simState.animation.lastTimestamp) / 1000.0;
  simState.animation.lastTimestamp = timestamp;

  simState.animation.currentTime += dtReal * simState.animation.speedFactor;

  if (simState.animation.currentTime >= simState.params.tMax) {
    simState.animation.currentTime = simState.params.tMax;
    simState.animation.isRunning = false;
    document.getElementById('btn-play-sim').innerHTML = '<span class="icon">▶</span> Repetir';
  }

  const currentData = getInterpolatedDataAt(simState.animation.currentTime);
  drawRocketScene(currentData);

  if (simState.animation.isRunning) {
    requestAnimationFrame(animationLoop);
  }
}

function startAnimation() {
  if (simState.animation.currentTime >= simState.params.tMax) {
    simState.animation.currentTime = 0;
  }
  simState.animation.isRunning = true;
  simState.animation.lastTimestamp = 0;
  document.getElementById('btn-play-sim').innerHTML = '<span class="icon">⏸</span> Pausar';
  requestAnimationFrame(animationLoop);
}

function pauseAnimation() {
  simState.animation.isRunning = false;
  document.getElementById('btn-play-sim').innerHTML = '<span class="icon">▶</span> Continuar';
}

function resetAnimation() {
  simState.animation.isRunning = false;
  simState.animation.currentTime = 0;
  simState.animation.particles = [];
  document.getElementById('btn-play-sim').innerHTML = '<span class="icon">▶</span> Lanzar Cohete';
  drawRocketScene(getInterpolatedDataAt(0));
}

// ==========================================
// 6. EVENTOS DE CONTROLES Y PESTAÑAS
// ==========================================

function setupEventListeners() {
  // Inputs numéricos
  const inputs = ['input-m', 'input-T', 'input-g', 'input-c', 'input-tMax', 'input-h'];

  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      simState.params.m = parseFloat(document.getElementById('input-m').value) || 1000;
      simState.params.T = parseFloat(document.getElementById('input-T').value) || 15000;
      simState.params.g = parseFloat(document.getElementById('input-g').value) || 9.81;
      simState.params.c = parseFloat(document.getElementById('input-c').value) || 100;
      simState.params.tMax = parseFloat(document.getElementById('input-tMax').value) || 20;
      simState.params.h = parseFloat(document.getElementById('input-h').value) || 2.0;

      updatePresetButtonsHighlight(simState.params.h);
      updateUI();
      resetAnimation();
    });
  });

  // Botones de presets de paso h
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hVal = parseFloat(btn.getAttribute('data-h'));
      document.getElementById('input-h').value = hVal;
      simState.params.h = hVal;
      updatePresetButtonsHighlight(hVal);
      updateUI();
      resetAnimation();
    });
  });

  // Botón Lanzar / Pausar
  document.getElementById('btn-play-sim').addEventListener('click', () => {
    if (simState.animation.isRunning) {
      pauseAnimation();
    } else {
      startAnimation();
    }
  });

  // Botón Reiniciar
  document.getElementById('btn-reset-sim').addEventListener('click', resetAnimation);

  // Multiplicador de velocidad de animación
  document.getElementById('speed-select').addEventListener('change', (e) => {
    simState.animation.speedFactor = parseFloat(e.target.value);
  });

  // Botón exportar CSV
  document.getElementById('btn-export-csv').addEventListener('click', exportTableToCSV);

  // Gestión de Pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      // Si MathJax está cargado, forzar renderizado en el nuevo panel visible
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([targetPanel]).catch(err => console.log(err));
      }

      // Redibujar canvas si regresamos al dashboard
      if (targetId === 'tab-dashboard') {
        setTimeout(() => {
          resizeCanvas();
          drawRocketScene(getInterpolatedDataAt(simState.animation.currentTime));
        }, 50);
      }
    });
  });

  // Presets temáticos
  document.getElementById('preset-nasa-1962').addEventListener('click', () => {
    applyPreset(1000, 15000, 9.81, 100, 20, 2.0);
  });

  document.getElementById('preset-high-precision').addEventListener('click', () => {
    applyPreset(1000, 15000, 9.81, 100, 20, 0.25);
  });

  document.getElementById('preset-asteroid').addEventListener('click', () => {
    applyPreset(5, 0, 9.81, 0.05, 15, 1.0);
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    drawRocketScene(getInterpolatedDataAt(simState.animation.currentTime));
  });
}

function updatePresetButtonsHighlight(hVal) {
  document.querySelectorAll('.preset-btn').forEach(b => {
    if (Math.abs(parseFloat(b.getAttribute('data-h')) - hVal) < 1e-4) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
}

function applyPreset(m, T, g, c, tMax, h) {
  document.getElementById('input-m').value = m;
  document.getElementById('input-T').value = T;
  document.getElementById('input-g').value = g;
  document.getElementById('input-c').value = c;
  document.getElementById('input-tMax').value = tMax;
  document.getElementById('input-h').value = h;

  simState.params = { m, T, g, c, tMax, h, v0: 0, h0: 0 };
  updatePresetButtonsHighlight(h);
  updateUI();
  resetAnimation();
}

// ==========================================
// 7. INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  initCharts();
  setupEventListeners();
  updateUI();
  resetAnimation();
});
