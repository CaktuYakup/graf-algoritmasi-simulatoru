// --- SİSTEM DEĞİŞKENLERİ ---
let dugumSayaci = 0;
let adimSayaci = 1;
let baslangicDugumu = null;
let animasyonIptal = false;

// --- DOM REFERANSLARI ---
const algorithmSelect = d3.select("#algorithm-select");
const startNodeInput  = d3.select("#start-node-input");
const speedSlider     = document.getElementById("speed-slider");
const runBtn          = d3.select("#run-btn");
const cancelBtn       = d3.select("#cancel-btn");
const clearBtn        = d3.select("#clear-btn");
const logTableBody    = d3.select("#log-table tbody");
const logScrollArea   = document.getElementById("log-scroll-area");
const logStatus       = document.getElementById("log-status");

const weightModal = new bootstrap.Modal(document.getElementById('weightModal'));
const alertModal  = new bootstrap.Modal(document.getElementById('alertModal'));

// --- YARDIMCI FONKSİYONLAR ---
const bekle  = (ms) => new Promise(res => setTimeout(res, ms * ((210 - parseInt(speedSlider.value)) / 100)));
const dAd    = (id) => "D" + id.split("-")[1];
const dDict  = (dict) => "{" + Object.entries(dict).map(([k,v]) => `${dAd(k)}:${v === Infinity ? '∞' : v}`).join(", ") + "}";

function ozelUyariGoster(baslik, mesaj, tip = "danger") {
    document.getElementById("alert-modal-title").innerText = baslik;
    document.getElementById("alert-modal-header").className = `modal-header bg-${tip} py-2`;
    document.getElementById("alert-message-text").innerHTML = mesaj;
    alertModal.show();
}

function logEkle(islem, veri) {
    logTableBody.append("tr").html(
        `<td class="px-3 fw-bold">${adimSayaci++}</td>
         <td class="small fw-bold">${islem}</td>
         <td class="font-monospace small text-muted">${veri}</td>`
    );
    logScrollArea.scrollTop = logScrollArea.scrollHeight;
}

// Algoritmalar bittiğinde sonuçları gösteren ve rotayı çizen yardımcı fonksiyon
function bitirAlgoritma(dist, prev, bId, nodes, name) {
    nodes.forEach(n => {
        const pr = prev[n];
        if (pr) {
            kenarBul(pr, n)
                .transition().duration(1000)
                .attr("stroke", "#0dcaf0").attr("stroke-width", 8)
                .each(function() {
                    if (d3.select(this).attr("isDirected") === "true")
                        d3.select(this).attr("marker-end", "url(#arrow-done)");
                });
        }
    });

    let res = "<ul class='list-group small'>";
    nodes.forEach(n => {
        const nNum = n.split('-')[1];
        if (n === bId) {
            res += `<li class='list-group-item list-group-item-info'>D${nNum} <span class='badge bg-primary ms-1'>Başlangıç</span> — Mesafe: <b>0</b></li>`;
        } else if (dist[n] === Infinity) {
            res += `<li class='list-group-item list-group-item-danger'>D${nNum} — <b>Ulaşılamaz (∞)</b></li>`;
            logEkle(`SONUÇ: ${dAd(n)}`, "Yol yok, mesafe ∞.");
        } else {
            let path = [], curr = n;
            while (curr) { path.push(dAd(curr)); curr = prev[curr]; }
            res += `<li class='list-group-item'><b>${path.reverse().join(" ➔ ")}</b> — Toplam: <b>${dist[n]}</b></li>`;
        }
    });
    res += "</ul>";
    ozelUyariGoster(`${name} Sonuçları`, res, "success");
}