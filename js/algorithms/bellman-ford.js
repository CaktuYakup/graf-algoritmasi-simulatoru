async function runBellmanFord(bId, nodes, edges) {
    const dist = {}, prev = {};
    nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; d3.select(`#${n} .mesafe-yazisi`).text("∞"); });
    dist[bId] = 0;
    d3.select(`#${bId} .mesafe-yazisi`).text("0");
    d3.select(`#${bId} circle`).transition().attr("fill", "#198754");

    logEkle("Bellman-Ford Başladı", `V=${nodes.length}, E=${edges.length}`);
    let hasCycle = false;

    for (let i = 1; i <= nodes.length && !animasyonIptal; i++) {
        let changed = false;
        logEkle(`İterasyon ${i}/${nodes.length}`, i < nodes.length ? "Relax taraması" : "Negatif döngü kontrolü");

        for (let e of edges) {
            if (animasyonIptal) break;
            e.el.transition().attr("stroke", "#fd7e14").attr("stroke-width", 6);
            await bekle(400);

            const relax = (u, v) => {
                if (dist[u] !== Infinity && dist[u] + e.w < dist[v]) {
                    if (i === nodes.length) { hasCycle = true; return; }
                    dist[v] = dist[u] + e.w; prev[v] = u;
                    d3.select(`#${v} .mesafe-yazisi`).text(dist[v]);
                    changed = true;
                    logEkle(`Relax: ${dAd(u)}➔${dAd(v)}`, `Yeni: ${dist[v]}`);
                }
            };
            relax(e.u, e.v);
            if (!e.isD) relax(e.v, e.u);

            e.el.transition().attr("stroke", "#6c757d").attr("stroke-width", 3);
        }
        if (!changed && i < nodes.length) {
            logEkle("Erken Bitiş", `${i}. iterasyonda değişim yok.`);
            break;
        }
    }

    if (hasCycle) {
        ozelUyariGoster("💥 KRİTİK HATA", "Negatif ağırlıklı döngü tespit edildi! Sonuçlar güvenilir değil.", "danger");
    } else if (!animasyonIptal) {
        bitirAlgoritma(dist, prev, bId, nodes, "Bellman-Ford");
    }
}