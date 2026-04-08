async function runPrim(bId, nodes, graf) {
    const visited = new Set([bId]);
    d3.select(`#${bId} circle`).attr("fill", "#198754");
    d3.select(`#${bId} .mesafe-yazisi`).text("Başlangıç");
    let totalW = 0;
    logEkle("Prim Başladı", `Başlangıç: ${dAd(bId)}`);
    await bekle(800);

    let kopukMu = false; // YENİ: Grafın kopuk olup olmadığını takip et

    while (visited.size < nodes.length && !animasyonIptal) {
        let minE = null, minW = Infinity;
        
        // 1. En uygun kenarı bul
        visited.forEach(u => {
            graf[u].forEach(e => {
                if (!visited.has(e.to) && e.w < minW) { minW = e.w; minE = { u, v: e.to, w: e.w }; }
            });
        });

        // 2. Eğer gidilecek yol kalmadıysa ama hala gezilmeyen düğüm varsa graf kopuktur!
        if (!minE) { 
            logEkle("Kopuk Graf", "Bazı düğümlere ulaşılamıyor."); 
            kopukMu = true; // Graf kopuk işaretle
            break; // Döngüyü kır
        }

        // 3. Kenarı tarama animasyonu
        const line = kenarBul(minE.u, minE.v);
        d3.select(`#${minE.v} circle`).transition().attr("fill", "#ffc107");
        line.transition().attr("stroke", "#fd7e14").attr("stroke-width", 6);
        await bekle(800);

        // YENİ: Bekleme süresinde "Durdur"a basıldıysa, sızıntıyı engelle ve hemen çık
        if (animasyonIptal) break; 

        // 4. Kabul edilen kenarı boya
        line.transition().attr("stroke", "#9c27b0").attr("stroke-width", 8);
        d3.select(`#${minE.v} circle`).transition().attr("fill", "#198754");
        
        // YENİ: Negatif sayılarda "+-3" yazmasını engelle (sadece pozitifse + koy)
        const prefix = minE.w >= 0 ? "+" : ""; 
        d3.select(`#${minE.v} .mesafe-yazisi`).text(`${prefix}${minE.w}`);
        
        totalW += minE.w;
        visited.add(minE.v);
        logEkle(`MST: ${dAd(minE.v)} eklendi`, `Kenar: ${dAd(minE.u)}↔${dAd(minE.v)}, Maliyet: ${minE.w}`);
        await bekle(500);
    }

    // YENİ: Bitiş uyarıları artık gerçeği yansıtıyor
    if (!animasyonIptal) {
        if (kopukMu) {
            // Graf kopuksa zafer mesajı yerine uyarı ver
            ozelUyariGoster("⚠️ Kısmi MST (Kopuk Graf)", `Tüm düğümlere ulaşılamadı. Tam bir ağaç oluşturulamadı!<br><br>Ulaşılabilenlerin Maliyeti: <b class='fs-4 text-warning'>${totalW}</b>`, "warning");
        } else {
            // Sadece tüm düğümlere ulaşıldıysa başarılı say
            ozelUyariGoster("✅ Prim Tamamlandı", `Toplam MST Maliyeti: <b class='fs-4'>${totalW}</b>`, "success");
        }
    }
}