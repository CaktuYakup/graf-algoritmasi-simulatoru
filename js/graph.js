const container = d3.select("#graph-container");
const svg = container.append("svg").attr("width", "100%").attr("height", "500").on("contextmenu", e => e.preventDefault());

// SVG Markers (Ok Uçları)
const defs = svg.append("defs");
const createMarker = (id, color) => {
    defs.append("marker")
        .attr("id", id).attr("viewBox", "0 -5 10 10").attr("refX", 26).attr("refY", 0)
        .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", color);
};
createMarker("arrow-default", "#6c757d");
createMarker("arrow-active", "#fd7e14");
createMarker("arrow-done", "#0dcaf0");
createMarker("arrow-mst", "#9c27b0");

const cizgiKatmani = svg.append("g").attr("id", "cizgiler");
const agirlikKatmani = svg.append("g").attr("id", "agirliklar");
const dugumKatmani  = svg.append("g").attr("id", "dugumler");

function renkleriSifirla() {
    dugumKatmani.selectAll("circle").attr("fill", "#0d6efd").attr("stroke", null);
    cizgiKatmani.selectAll("line")
        .attr("stroke", "#6c757d").attr("stroke-width", 3)
        .each(function() {
            if (d3.select(this).attr("isDirected") === "true")
                d3.select(this).attr("marker-end", "url(#arrow-default)");
            else
                d3.select(this).attr("marker-end", null);
        });
    dugumKatmani.selectAll(".mesafe-yazisi").text("");
}

function kenarBul(u, v) {
    return cizgiKatmani.selectAll("line").filter(function() {
        const k  = d3.select(this).attr("kaynak");
        const h  = d3.select(this).attr("hedef");
        const isD = d3.select(this).attr("isDirected") === "true";
        return (k === u && h === v) || (!isD && k === v && h === u);
    });
}

// --- DÜĞÜM OLUŞTURMA ---
function tuvaleDugumEkle(x, y, forceId = null) {
    if (!forceId) dugumSayaci++;
    const id = forceId || "dugum-" + dugumSayaci;

    const g = dugumKatmani.append("g")
        .attr("id", id).attr("data-x", x).attr("data-y", y)
        .attr("transform", `translate(${x},${y})`)
        .call(d3.drag().on("drag", function(event) {
            const d = d3.select(this);
            const nx = event.x, ny = event.y;
            d.attr("transform", `translate(${nx},${ny})`).attr("data-x", nx).attr("data-y", ny);
            cizgiKatmani.selectAll(`line[kaynak='${id}']`).attr("x1", nx).attr("y1", ny);
            cizgiKatmani.selectAll(`line[hedef='${id}']`).attr("x2", nx).attr("y2", ny);
            agirlikKatmani.selectAll(`text[kaynak='${id}'], text[hedef='${id}']`).each(function() {
                const k = d3.select(`#${d3.select(this).attr("kaynak")}`);
                const h = d3.select(`#${d3.select(this).attr("hedef")}`);
                d3.select(this)
                    .attr("x", (parseFloat(k.attr("data-x")) + parseFloat(h.attr("data-x"))) / 2)
                    .attr("y", (parseFloat(k.attr("data-y")) + parseFloat(h.attr("data-y"))) / 2 - 10);
            });
        }));

    g.append("circle").attr("r", 20).attr("fill", "#0d6efd");
    g.append("text").text(id.split("-")[1])
        .attr("text-anchor", "middle").attr("dy", ".35em")
        .attr("fill", "white").style("font-weight", "bold").style("pointer-events", "none");
    g.append("text").attr("class", "mesafe-yazisi")
        .attr("y", 35).attr("text-anchor", "middle")
        .style("font-size", "12px").style("font-weight", "bold");

    g.on("contextmenu", (e) => {
        e.preventDefault(); e.stopPropagation();
        g.remove();
        cizgiKatmani.selectAll(`line[kaynak='${id}'], line[hedef='${id}']`).remove();
        agirlikKatmani.selectAll(`text[kaynak='${id}'], text[hedef='${id}']`).remove();
    });

    g.on("click", function(e) {
        e.stopPropagation();
        if (!baslangicDugumu) {
            baslangicDugumu = d3.select(this);
            baslangicDugumu.select("circle").attr("stroke", "#ffc107").attr("stroke-width", 4);
        } else {
            const kId = baslangicDugumu.attr("id");
            const hId = d3.select(this).attr("id");
            if (kId !== hId) {
                const varMi = !cizgiKatmani.select(`line[kaynak='${kId}'][hedef='${hId}'], line[kaynak='${hId}'][hedef='${kId}']`).empty();
                if (!varMi) {
                    islemTipi   = "yeni";
                    bekleyenKenar = { kId, hId, bNode: baslangicDugumu, tNode: d3.select(this) };
                    document.getElementById("weight-modal-title").innerText = `D${kId.split('-')[1]} ➔ D${hId.split('-')[1]}`;
                    document.getElementById("edge-weight-input").value = "1";
                    document.getElementById("radio-bidirectional").checked = true;
                    weightModal.show();
                } else {
                    ozelUyariGoster("Uyarı", "Bu iki düğüm arasında bağlantı zaten mevcut.");
                }
            }
            baslangicDugumu.select("circle").attr("stroke", null);
            baslangicDugumu = null;
        }
    });
}

svg.on("click", (e) => {
    if (e.defaultPrevented) return;
    tuvaleDugumEkle(d3.pointer(e)[0], d3.pointer(e)[1]);
});

// --- KENAR ÇİZİM VE DÜZENLEME ---
let islemTipi = "yeni", bekleyenKenar = null, duzenlenecekTxt = null;

document.getElementById("save-weight-btn").onclick = () => {
    const m   = parseInt(document.getElementById("edge-weight-input").value);
    const isD = document.querySelector('input[name="direction-radio"]:checked').value === "directed";
    if (isNaN(m)) { ozelUyariGoster("Hata", "Lütfen geçerli bir sayı girin."); return; }

    if (islemTipi === "yeni") {
        kenarCiz(bekleyenKenar.kId, bekleyenKenar.hId, m, isD);
        bekleyenKenar = null;
    } else {
        duzenlenecekTxt.text(m);
        const l = cizgiKatmani.select(`line[kaynak='${duzenlenecekTxt.attr("kaynak")}'][hedef='${duzenlenecekTxt.attr("hedef")}']`);
        l.attr("maliyet", m).attr("isDirected", isD);
        if (isD) l.attr("marker-end", "url(#arrow-default)");
        else     l.attr("marker-end", null);
        duzenlenecekTxt = null;
    }
    weightModal.hide();
};

document.getElementById("weightModal").addEventListener("hidden.bs.modal", () => {
    if (baslangicDugumu) { baslangicDugumu.select("circle").attr("stroke", null); baslangicDugumu = null; }
    bekleyenKenar    = null;
    duzenlenecekTxt  = null;
    islemTipi        = "yeni";
});

function kenarCiz(kId, hId, m, isD) {
    const kNode = d3.select(`#${kId}`), hNode = d3.select(`#${hId}`);
    const x1 = kNode.attr("data-x"), y1 = kNode.attr("data-y");
    const x2 = hNode.attr("data-x"), y2 = hNode.attr("data-y");

    const line = cizgiKatmani.append("line")
        .attr("kaynak", kId).attr("hedef", hId).attr("maliyet", m).attr("isDirected", isD)
        .attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
        .attr("stroke", "#6c757d").attr("stroke-width", 3);
    if (isD) line.attr("marker-end", "url(#arrow-default)");

    const txt = agirlikKatmani.append("text")
        .attr("kaynak", kId).attr("hedef", hId)
        .attr("x", (parseFloat(x1) + parseFloat(x2)) / 2)
        .attr("y", (parseFloat(y1) + parseFloat(y2)) / 2 - 10)
        .attr("text-anchor", "middle").attr("fill", "#dc3545")
        .style("font-weight", "bold").style("cursor", "pointer").text(m);

    txt.on("click", (e) => {
        e.stopPropagation();
        islemTipi       = "edit";
        duzenlenecekTxt = d3.select(e.target);
        const kNum = kId.split('-')[1], hNum = hId.split('-')[1];
        document.getElementById("weight-modal-title").innerText = `D${kNum} ↔ D${hNum} (Düzenle)`;
        document.getElementById("edge-weight-input").value = txt.text();
        document.getElementById(line.attr("isDirected") === "true" ? "radio-directed" : "radio-bidirectional").checked = true;
        weightModal.show();
    });

    line.on("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); line.remove(); txt.remove(); });
    txt.on("contextmenu",  (e) => { e.preventDefault(); e.stopPropagation(); line.remove(); txt.remove(); });
}