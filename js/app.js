// --- ANA BAŞLATICI ---

cancelBtn.on("click", () => {
    animasyonIptal = true;
    logStatus.innerText = "Durduruldu";
    logStatus.className = "badge bg-danger";
    // Animasyon durdurulursa UI kilidini aç
    d3.select("#graph-container").classed("ui-locked", false); 
});

clearBtn.on("click", () => location.reload());

runBtn.on("click", async () => {
    animasyonIptal = false;
    adimSayaci     = 1;
    logTableBody.selectAll("*").remove();

    const alg  = algorithmSelect.property("value");
    const bNum = startNodeInput.property("value");
    const bId  = "dugum-" + bNum;

    // Giriş kontrolleri
    if (dugumKatmani.selectAll("g").empty()) {
        return ozelUyariGoster("Uyarı", "Lütfen önce tuvale düğüm ekleyin.");
    }
    if (alg !== "kruskal" && !bNum) {
        return ozelUyariGoster("Uyarı", "Başlangıç düğüm numarasını girin.");
    }
    if (alg !== "kruskal" && d3.select(`#${bId}`).empty()) {
        return ozelUyariGoster("Hata", `D${bNum} ekranda bulunamadı.`);
    }

    // MST Yönlü Graf Kontrolü
    if (alg === "prim" || alg === "kruskal") {
        let directedVar = false;
        cizgiKatmani.selectAll("line").each(function() {
            if (d3.select(this).attr("isDirected") === "true") directedVar = true;
        });
        if (directedVar) {
            return ozelUyariGoster(
                "⚠️ Uyumsuz Graf",
                `<b>${alg === "prim" ? "Prim" : "Kruskal"}</b> algoritması yalnızca <b>yönsüz (çift yönlü)</b> graflar üzerinde çalışır.<br><br>Lütfen tüm kenarları <b>Çift Yön ↔</b> olarak ayarlayın.`,
                "warning"
            );
        }
    }

    // Dijkstra Negatif Ağırlık Kontrolü
    if (alg === "dijkstra") {
        let negVar = false;
        cizgiKatmani.selectAll("line").each(function() {
            if (parseInt(d3.select(this).attr("maliyet")) < 0) negVar = true;
        });
        if (negVar) return ozelUyariGoster("Hata", "Dijkstra negatif ağırlıklarla çalışamaz! Bunun için <b>Bellman-Ford</b> kullanın.");
    }

    renkleriSifirla();
    d3.select("#log-container").style("display", "block");
    
    // İşlem başladığında çizim alanını kilitle
    d3.select("#graph-container").classed("ui-locked", true); 
    
    logStatus.innerText = "Çalışıyor...";
    logStatus.className = "badge bg-warning text-dark";
    runBtn.property("disabled", true).text("Hesaplanıyor...");
    cancelBtn.property("disabled", false);

    // Grafı Oku ve Veri Yapısına Çevir
    const nodes = [];
    dugumKatmani.selectAll("g").each(function() { nodes.push(d3.select(this).attr("id")); });
    
    const graf = {};
    nodes.forEach(n => graf[n] = []);
    
    const edges = [];

    cizgiKatmani.selectAll("line").each(function() {
        const k  = d3.select(this).attr("kaynak");
        const h  = d3.select(this).attr("hedef");
        const m  = parseInt(d3.select(this).attr("maliyet"));
        const isD = d3.select(this).attr("isDirected") === "true";
        
        graf[k].push({ to: h, w: m });
        if (!isD) graf[h].push({ to: k, w: m });

        edges.push({ u: k, v: h, w: m, isD: isD, el: d3.select(this) });
    });

    // Algoritmayı Çalıştır
    if (alg === "dijkstra") {
        await runDijkstra(bId, nodes, graf);
    } else if (alg === "bellman-ford") {
        await runBellmanFord(bId, nodes, edges);
    } else if (alg === "prim") {
        await runPrim(bId, nodes, graf);
    } else if (alg === "kruskal") {
        await runKruskal(nodes, edges);
    }

    // Bitiş İşlemleri
    if (!animasyonIptal) {
        logStatus.innerText = "Tamamlandı";
        logStatus.className = "badge bg-success";
        logEkle("Algoritma Sona Erdi", "İşlem başarılı.");
    }
    
    // İşlem bittiğinde kilidi kaldır
    d3.select("#graph-container").classed("ui-locked", false); 
    
    runBtn.property("disabled", false).text("ÇALIŞTIR");
    cancelBtn.property("disabled", true);
});

// ==========================================
// KULLANICI İLK GİRDİĞİNDE: EĞİTİM GRAFINI YÜKLE
// ==========================================
function egitimGrafiniYukle() {
    // 1. Düğümleri koordinatlarıyla ekle
    tuvaleDugumEkle(150, 250); // D1 (Başlangıç)
    tuvaleDugumEkle(350, 100); // D2 (Üst)
    tuvaleDugumEkle(450, 400); // D3 (Alt)
    tuvaleDugumEkle(550, 250); // D4 (Sağ)
    tuvaleDugumEkle(750, 250); // D5 (Uzak Hedef)

    // 2. Kenarları (Ağırlıklarıyla) ekle (KAYNAK, HEDEF, MALIYET, YONLU_MU)
    kenarCiz("dugum-1", "dugum-2", 4, false);
    kenarCiz("dugum-1", "dugum-3", 2, false);
    kenarCiz("dugum-2", "dugum-3", 1, false); // Köprü kenar
    kenarCiz("dugum-2", "dugum-4", 8, false);
    kenarCiz("dugum-3", "dugum-4", 5, false);
    kenarCiz("dugum-4", "dugum-5", 3, false);

    // Başlangıç düğümü inputunu otomatik D1 yap
    document.getElementById("start-node-input").value = 1;
    logEkle("Sistem Hazır", "Öğretici eğitim grafı yüklendi.");
}

// Sayfa yüklendiğinde grafiği çizmek için bekle (SVG'nin hazır olması için)
setTimeout(egitimGrafiniYukle, 100);