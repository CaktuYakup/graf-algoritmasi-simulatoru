async function runKruskal(nodes, edges) {
    const allE = [...edges].sort((a, b) => a.w - b.w);

    class UF {
        constructor(ns) { this.p = {}; ns.forEach(n => this.p[n] = n); }
        find(i) { return this.p[i] === i ? i : (this.p[i] = this.find(this.p[i])); }
        union(i, j) { const rI = this.find(i), rJ = this.find(j); if (rI !== rJ) { this.p[rI] = rJ; return true; } return false; }
    }
    
    const uf = new UF(nodes);
    let totalW = 0, added = 0;
    logEkle("Kruskal Başladı", `${allE.length} kenar küçükten büyüğe sıralandı.`);

    for (let e of allE) {
        if (animasyonIptal) break;
        
        logEkle(`Değerlendiriliyor: ${dAd(e.u)}-${dAd(e.v)}`, `Ağırlık: ${e.w}`);
        e.el.transition().attr("stroke", "#ffc107").attr("stroke-width", 6);
        
        await bekle(800);
        if (animasyonIptal) break; // YENİ: Sızıntıyı önle!

        if (uf.union(e.u, e.v)) {
            e.el.transition().attr("stroke", "#20c997").attr("stroke-width", 8);
            d3.select(`#${e.u} circle`).transition().attr("fill", "#198754");
            d3.select(`#${e.v} circle`).transition().attr("fill", "#198754");
            totalW += e.w; 
            added++;
            logEkle("✅ Kabul", `MST kenar sayısı: ${added}`);
            
            await bekle(500);
            if (animasyonIptal) break; // YENİ: Sızıntıyı önle!
            
        } else {
            e.el.transition().attr("stroke", "#dc3545").attr("stroke-width", 5);
            logEkle("❌ Reddedildi", `${dAd(e.u)} ve ${dAd(e.v)} zaten aynı kümede (döngü oluşurdu).`);
            
            await bekle(600);
            if (animasyonIptal) break; // YENİ: Sızıntıyı önle!
            e.el.transition().attr("stroke", "#6c757d").attr("stroke-width", 3);
        }
        
        if (added === nodes.length - 1) { 
            logEkle("Tamamlandı", "V-1 kenar eklendi."); 
            break; 
        }
    }

    // YENİ: Bitiş uyarıları artık gerçeği yansıtıyor
    if (!animasyonIptal) {
        if (added < nodes.length - 1) {
            // V-1 kenara ulaşılamadıysa graf kopuktur!
            ozelUyariGoster("⚠️ Kısmi MST (Kopuk Graf)", `Tüm düğümler birbirine bağlanamadı! Graf kopuk.<br><br>Ulaşılabilenlerin Maliyeti: <b class='fs-4 text-warning'>${totalW}</b>`, "warning");
        } else {
            // Başarılı durum
            ozelUyariGoster("✅ Kruskal Tamamlandı", `Toplam MST Maliyeti: <b class='fs-4'>${totalW}</b>`, "success");
        }
    }
}