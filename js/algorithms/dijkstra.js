async function runDijkstra(bId, nodes, graf) {
    const dist = {}, prev = {}, visit = new Set();
    nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; d3.select(`#${n} .mesafe-yazisi`).text("∞"); });
    dist[bId] = 0;
    d3.select(`#${bId} .mesafe-yazisi`).text("0");
    let pq = [{ id: bId, d: 0 }];
    logEkle("Dijkstra Başladı", `Başlangıç: ${dAd(bId)}`);

    while (pq.length > 0 && !animasyonIptal) {
        pq.sort((a, b) => a.d - b.d);
        const curr = pq.shift().id;
        if (visit.has(curr)) continue;
        visit.add(curr);
        logEkle(`DEQUEUE: ${dAd(curr)}`, dDict(dist));
        d3.select(`#${curr} circle`).transition().attr("fill", "#ffc107");
        await bekle(1000);

        for (let edge of graf[curr]) {
            if (animasyonIptal) break;
            const line = kenarBul(curr, edge.to);
            line.transition().attr("stroke", "#fd7e14").attr("stroke-width", 6);
            if (line.attr("isDirected") === "true") line.attr("marker-end", "url(#arrow-active)");
            await bekle(700);

            if (visit.has(edge.to)) {
                logEkle(`PAS: ${dAd(edge.to)}`, "Zaten işlendi.");
            } else {
                const alt = dist[curr] + edge.w;
                if (alt < dist[edge.to]) {
                    dist[edge.to] = alt; prev[edge.to] = curr;
                    d3.select(`#${edge.to} .mesafe-yazisi`).text(alt);
                    pq.push({ id: edge.to, d: alt });
                    logEkle(`GÜNCELLEME: ${dAd(edge.to)}`, `Yeni mesafe: ${alt}`);
                } else {
                    logEkle(`REDDEDİLDİ: ${dAd(edge.to)}`, `${alt} >= ${dist[edge.to]}`);
                }
            }
            line.transition().attr("stroke", "#6c757d").attr("stroke-width", 3);
            if (line.attr("isDirected") === "true") line.attr("marker-end", "url(#arrow-default)");
        }
        d3.select(`#${curr} circle`).transition().attr("fill", "#198754");
    }
    if (!animasyonIptal) bitirAlgoritma(dist, prev, bId, nodes, "Dijkstra");
}