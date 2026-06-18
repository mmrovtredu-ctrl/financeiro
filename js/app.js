// ============================================================
// APP — login, interface, render e gráficos
// ============================================================
const fmt = (n) => "R$ " + (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => "R$ " + Math.round(n || 0).toLocaleString("pt-BR");
const sideLabel = { eduardo: "Eduardo", maite: "Maitê", negocio: "Negócio", proprio: "Próprio" };
let charts = {};
let busy = false;

function $(id) { return document.getElementById(id); }
function br(d) { const p = (d || "").split("-"); return p[2] + "/" + p[1]; }
function esc(s) { return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function tab(p) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.p === p));
  document.querySelectorAll(".panel").forEach((s) => s.classList.toggle("on", s.id === "p-" + p));
  if (p === "geral") drawCharts();
}

function totals() {
  let ent = 0, sai = 0, maite = 0; const cat = {}, src = {};
  Store.state.txs.forEach((t) => {
    if (t.type === "in") { ent += t.amount; src[t.category] = (src[t.category] || 0) + t.amount; }
    else { sai += t.amount; cat[t.category] = (cat[t.category] || 0) + t.amount; if (t.side === "maite") maite += t.amount; }
  });
  return { ent, sai, maite, cat, src };
}
function poupTotal() { return Store.state.savings.reduce((a, d) => a + d.amount, 0); }

function render() {
  const { ent, sai, maite, cat } = totals();
  const saldo = (Store.state.settings.saldo_inicial || 0) + ent - sai;
  $("kEnt").textContent = fmt0(ent);
  $("kSai").textContent = fmt0(sai);
  $("kSal").textContent = fmt(saldo);
  $("kMai").textContent = fmt0(maite);

  const topCat = Object.entries(cat).sort((a, b) => b[1] - a[1])[0];
  $("dBal").textContent = fmt(ent) + " / " + fmt(sai);
  $("dTop").textContent = topCat ? topCat[0] + " (" + fmt0(topCat[1]) + ")" : "—";
  $("dMaite").textContent = sai ? Math.round((maite / sai) * 100) + "%" : "0%";
  const pt = poupTotal();
  $("dPoup").innerHTML = pt > 0 ? '<span style="color:var(--green)">' + fmt(pt) + "</span>" : '<span style="color:var(--red)">R$ 0,00 — comece hoje</span>';
  $("diagAlertTxt").textContent = saldo < 50
    ? "O saldo está praticamente zerado: quase tudo que entra está saindo. O primeiro passo é criar uma folga, nem que seja pequena."
    : "Há uma folga no saldo. Considere mover parte para a poupança da Maitê antes que vire gasto.";

  const ft = $("flType").value, fs = $("flSide").value, fq = ($("flSearch").value || "").toLowerCase();
  const rows = Store.state.txs.slice().sort((a, b) => b.date.localeCompare(a.date))
    .filter((t) => (!ft || t.type === ft) && (!fs || t.side === fs) && (!fq || t.description.toLowerCase().includes(fq)));
  $("txBody").innerHTML = rows.map((t) => `
    <tr><td class="num">${br(t.date)}</td>
      <td>${esc(t.description)}<span class="catline">${esc(t.category)}</span></td>
      <td><span class="side ${t.side}">${sideLabel[t.side] || t.side}</span></td>
      <td class="amt ${t.type}">${t.type === "in" ? "+" : "−"} ${fmt(t.amount)}</td>
      <td><button class="del" onclick="delTx('${t.id}')" aria-label="Apagar">✕</button></td></tr>`).join("")
    || `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">Nenhum lançamento.</td></tr>`;

  $("miEnviado").textContent = fmt0(maite);
  $("miMedia").textContent = fmt0(maite / 2);
  const mrows = Store.state.txs.filter((t) => t.side === "maite").sort((a, b) => b.date.localeCompare(a.date));
  $("maiteBody").innerHTML = mrows.map((t) => `<tr><td class="num">${br(t.date)}</td><td>${esc(t.description)}</td><td class="amt out">${fmt(t.amount)}</td></tr>`).join("");

  const meta = Store.state.settings.meta || 1000;
  const pct = Math.min(100, Math.round((pt / meta) * 100));
  $("poupVal").textContent = fmt(pt);
  $("poupBar").style.width = pct + "%";
  $("poupPct").textContent = pct + "% da meta";
  $("poupMeta").textContent = "Meta: " + fmt(meta);
  $("depList").innerHTML = Store.state.savings.slice().reverse().map((d) =>
    `<div class="d"><span>${br(d.date)} · ${esc(d.description || "Depósito")}</span><b style="color:var(--green)">${fmt(d.amount)}</b></div>`).join("")
    || `<div style="color:var(--muted);font-size:14px;padding:8px 0">Ainda não há depósitos. Guarde o primeiro valor acima — todo começo conta.</div>`;

  if ($("p-geral").classList.contains("on")) drawCharts();
}

function drawCharts() {
  const { cat, ent, sai, src } = totals();
  const palette = ["#7C3AED", "#DC2626", "#2563EB", "#B45309", "#047857", "#0891B2", "#DB2777", "#65A30D", "#9CA3AF", "#F59E0B", "#6366F1"];
  Object.values(charts).forEach((c) => c && c.destroy());
  Chart.defaults.font.family = "Inter, sans-serif"; Chart.defaults.font.size = 12; Chart.defaults.color = "#6B7280";
  const ce = Object.entries(cat).sort((a, b) => b[1] - a[1]);
  charts.cat = new Chart($("catChart"), { type: "doughnut", data: { labels: ce.map((e) => e[0]), datasets: [{ data: ce.map((e) => e[1]), backgroundColor: palette, borderWidth: 2, borderColor: "#fff" }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "58%", plugins: { legend: { position: "bottom", labels: { boxWidth: 11, boxHeight: 11, padding: 9, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => " " + c.label + ": " + fmt(c.parsed) } } } } });
  charts.io = new Chart($("ioChart"), { type: "bar", data: { labels: ["Entradas", "Saídas"], datasets: [{ data: [ent, sai], backgroundColor: ["#047857", "#DC2626"], borderRadius: 8, maxBarThickness: 70 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => " " + fmt(c.parsed.y) } } }, scales: { y: { ticks: { callback: (v) => "R$ " + v / 1000 + "k" }, grid: { color: "#EEF1F4" } }, x: { grid: { display: false } } } } });
  const se = Object.entries(src).sort((a, b) => b[1] - a[1]);
  charts.src = new Chart($("srcChart"), { type: "doughnut", data: { labels: se.map((e) => e[0]), datasets: [{ data: se.map((e) => e[1]), backgroundColor: palette, borderWidth: 2, borderColor: "#fff" }] }, options: { responsive: true, maintainAspectRatio: false, cutout: "58%", plugins: { legend: { position: "bottom", labels: { boxWidth: 11, boxHeight: 11, padding: 9, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => " " + c.label + ": " + fmt(c.parsed) } } } } });
}

// ---------- ações ----------
async function guard(fn) {
  if (busy) return; busy = true;
  try { await fn(); render(); } catch (e) { alert("Não foi possível salvar: " + (e.message || e)); console.error(e); }
  finally { busy = false; }
}
function addTx() {
  const date = $("fDate").value || new Date().toISOString().slice(0, 10);
  const type = $("fType").value, side = $("fSide").value;
  const description = $("fDesc").value.trim() || "(sem descrição)";
  const amount = parseFloat($("fAmount").value);
  if (!amount || amount <= 0) { alert("Informe um valor válido."); return; }
  const category = side === "maite" ? "Maitê" : side === "negocio" ? "Serviços" : (type === "in" ? "Próprio" : "Diversos");
  guard(async () => { await Store.addTx({ date, description, category, side, type, amount }); $("fDesc").value = ""; $("fAmount").value = ""; });
}
function delTx(id) { guard(() => Store.delTx(id)); }
function addDep() { const a = parseFloat($("depAmount").value); if (!a || a <= 0) { alert("Informe um valor para guardar."); return; } guard(async () => { await Store.addSaving({ date: new Date().toISOString().slice(0, 10), description: "Depósito", amount: a }); $("depAmount").value = ""; }); }
function setMeta() { const m = parseFloat($("metaAmount").value); if (!m || m <= 0) { alert("Informe uma meta válida."); return; } guard(async () => { await Store.setMeta(m); $("metaAmount").value = ""; }); }
function resetData() { if (confirm("Restaurar os dados originais do período? Isso apaga o que você adicionou.")) guard(() => Store.reset()); }
function exportData() { const blob = new Blob([JSON.stringify(Store.state, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "controle-financeiro.json"; a.click(); }

// ---------- LOGIN ----------
function showLogin(show) { $("loginScreen").style.display = show ? "flex" : "none"; $("appRoot").style.display = show ? "none" : "block"; }
function authMsg(t, ok) { const e = $("authMsg"); e.textContent = t; e.style.color = ok ? "var(--green)" : "var(--red)"; }

async function doLogin() {
  const email = $("authEmail").value.trim(), pass = $("authPass").value;
  if (!email || !pass) { authMsg("Preencha e-mail e senha."); return; }
  authMsg("Entrando…", true);
  try { await Store.signIn(email, pass); await afterLogin(); }
  catch (e) { authMsg(traduz(e.message)); }
}
async function doSignup() {
  const email = $("authEmail").value.trim(), pass = $("authPass").value;
  if (!email || pass.length < 6) { authMsg("Use um e-mail válido e senha de 6+ caracteres."); return; }
  authMsg("Criando conta…", true);
  try {
    await Store.signUp(email, pass);
    const u = await Store.getUser();
    if (u) { await afterLogin(); }
    else { authMsg("Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.", true); }
  } catch (e) { authMsg(traduz(e.message)); }
}
function traduz(m) {
  if (/invalid login/i.test(m)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(m)) return "Este e-mail já tem conta. Use Entrar.";
  if (/Email not confirmed/i.test(m)) return "Confirme seu e-mail pelo link enviado antes de entrar.";
  return m;
}
async function afterLogin() {
  showLogin(false);
  $("userEmail").textContent = Store.user ? Store.user.email : "";
  await Store.load();
  render();
}
async function doLogout() { await Store.signOut(); location.reload(); }

// ---------- init ----------
(async function () {
  $("fDate").value = new Date().toISOString().slice(0, 10);
  const badge = $("modeBadge");

  if (Store.mode === "local") {
    badge.textContent = "Modo local (neste aparelho)";
    $("logoutBtn").style.display = "none";
    showLogin(false);
    await Store.load();
    render();
    return;
  }

  // modo supabase: exige login
  badge.textContent = "Supabase conectado";
  badge.classList.add("ok");
  const user = await Store.getUser();
  if (user) { await afterLogin(); }
  else { showLogin(true); }
})();
