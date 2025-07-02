import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const Bar = () => {
  const [ordini, setOrdini] = useState([]);

  const fetchOrdiniBar = async () => {
    const { data, error } = await supabase
      .from("ordini")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error) {
      const conBibite = data.filter((ordine) =>
        ordine.prodotti.some((p) => p.tipo === "bevanda")
      );
      setOrdini(conBibite);
    }
  };

  useEffect(() => {
    fetchOrdiniBar();

    const ch = supabase
      .channel("bar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ordini" },
        fetchOrdiniBar
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  const setBibiteConsegnate = async (ordineId, valore) => {
    const ordine = ordini.find((o) => o.id === ordineId);
    if (!ordine) return;

    const prodotti = ordine.prodotti || [];
    const soloBevande = prodotti.every((p) => p.tipo === "bevanda");

    const updatePayload = {
      bibite_consegnate: valore,
    };

    if (valore && soloBevande) {
      updatePayload.stato = "bibite consegnate";
    }

    const { error } = await supabase
      .from("ordini")
      .update(updatePayload)
      .eq("id", ordineId);

    if (error) {
      toast.error("❌ Errore aggiornamento ordine");
    } else {
      fetchOrdiniBar();
    }
  };

  const nonConsegnati = ordini.filter((o) => !o.bibite_consegnate);
  const consegnati = ordini.filter((o) => o.bibite_consegnate);

  return (
    <div className="container">
      <h2 className="mb-4">Bar – Ordini con Bibite</h2>
      <div className="row">
        <div className="col-md-6 yellow">
          <h4 className="mb-2">🍺 Bibite da Fare</h4>
          {nonConsegnati.length === 0 && <p>✅ Nessuna bibita da preparare</p>}
          {nonConsegnati.map((o) => (
            <OrdineCard
              key={o.id}
              ordine={o}
              setBibiteConsegnate={() => setBibiteConsegnate(o.id, true)}
            />
          ))}
        </div>
        <div className="col-md-6">
          <h4 className="mb-2">✅ Bibite Consegnate</h4>
          {consegnati.length === 0 && (
            <p>🥤 Nessuna bibita ancora consegnata</p>
          )}
          {consegnati.map((o) => (
            <OrdineCard
              key={o.id}
              ordine={o}
              setBibiteConsegnate={() => setBibiteConsegnate(o.id, false)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const OrdineCard = ({ ordine, setBibiteConsegnate }) => {
  const [open, setOpen] = useState(false);
  const bevande = ordine.prodotti.filter((p) => p.tipo === "bevanda");

  return (
    <div className="card card-body mb-3">
      <div
        className="accordion-header"
        style={{ cursor: "pointer" }}
        onClick={() => setOpen(!open)}
      >
        <span id="ordine">#{ordine.numero_ordine || ordine.id}</span>
        <span>{ordine.bibite_consegnate ? "✅" : open ? "▼" : "➤"}</span>
      </div>

      {open && (
        <div className="mt-2">
          <ul className="list-unstyled ordine-cliente">
            {bevande.map((b, i) => (
              <li key={i}>{b.nome}</li>
            ))}
          </ul>
          <button
            className="btn-invio w-100 mt-2"
            onClick={setBibiteConsegnate}
          >
            {ordine.bibite_consegnate
              ? "↩️ Annulla consegna"
              : "✅ Bibite consegnate"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Bar;
