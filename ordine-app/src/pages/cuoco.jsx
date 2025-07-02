import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const Cuoco = () => {
  const [ordini, setOrdini] = useState([]);

  const fetchOrdiniCuoco = async () => {
    const { data, error } = await supabase
      .from("ordini")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Errore nel recupero ordini:", error);
      return;
    }

    setOrdini(data);
  };

  useEffect(() => {
    fetchOrdiniCuoco();
  }, []);

  const raggruppaOrdine = (prodotti) => {
    if (typeof prodotti === "string") {
      try {
        prodotti = JSON.parse(prodotti);
        if (typeof prodotti[0] === "string") {
          prodotti = prodotti.map((p) => JSON.parse(p));
        }
      } catch (e) {
        console.error("❌ Prodotti non parseabili:", prodotti);
        return <p>⚠ Dati non validi</p>;
      }
    }

    if (!Array.isArray(prodotti)) return <p>⚠ Prodotti non validi</p>;

    const panini = prodotti.filter((p) => p.tipo === "panino");
    const patatine = prodotti.filter(
      (p) =>
        p.tipo === "snack" && p.nome.toLowerCase().includes("patatine fritte")
    );

    return (
      <ul className="list-unstyled mb-0">
        {panini.map((p, idx) => (
          <li key={`panino-${idx}`}>
            {p.nome}
            {p.aggiunte && p.aggiunte.length > 0 && (
              <>
                {" "}
                <span>+ {p.aggiunte.map((a) => a.nome).join(", ")}</span>{" "}
              </>
            )}
          </li>
        ))}
        {patatine.length > 0 && <li>x{patatine.length} Patatine Fritte</li>}
      </ul>
    );
  };

  const aggiornaStatoOrdine = async (id, nuovoStato) => {
    const { error } = await supabase
      .from("ordini")
      .update({ stato: nuovoStato })
      .eq("id", id);

    if (error) {
      console.error("Errore aggiornamento stato:", error);
    } else {
      fetchOrdiniCuoco();
    }
  };

  const eliminaOrdine = (id) => {
    toast(
      (t) => (
        <div className="toast-overlay">
          <div className={`toast ${t.visible ? "show" : ""}`}>
            <p>Sei sicuro di voler eliminare questo ordine?</p>
            <div className="d-flex justify-content-between mt-3 gap-2">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="button-canc btn-attivo"
              >
                <i className="fa-solid fa-xmark"></i> Annulla
              </button>
              <button
                className="btn-ok btn-attivo"
                onClick={async () => {
                  toast.dismiss(t.id);
                  const { error } = await supabase
                    .from("ordini")
                    .delete()
                    .eq("id", id);

                  if (error) {
                    console.error("Errore eliminazione ordine:", error);
                    // toast.error("❌ Errore durante l'eliminazione.");
                  } else {
                    // toast.success("✅ Ordine eliminato.");
                    fetchOrdiniCuoco();
                  }
                }}
              >
                <i className="fa-solid fa-check"></i> Elimina
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  const contieneCosePerCuoco = (prodotti) => {
    if (typeof prodotti === "string") {
      try {
        prodotti = JSON.parse(prodotti);
        if (typeof prodotti[0] === "string") {
          prodotti = prodotti.map((p) => JSON.parse(p));
        }
      } catch (e) {
        console.error("❌ Prodotti non parseabili:", prodotti);
        return false;
      }
    }

    if (!Array.isArray(prodotti)) return false;

    return prodotti.some(
      (p) =>
        p.tipo === "panino" ||
        (p.tipo === "snack" && p.nome.toLowerCase().includes("patatine fritte"))
    );
  };

  const inPreparazione = ordini.filter(
    (o) => o.stato === "in preparazione" && contieneCosePerCuoco(o.prodotti)
  );
  const carnePronta = ordini.filter(
    (o) => o.stato === "carne pronta" && contieneCosePerCuoco(o.prodotti)
  );

  return (
    <div className="container">
      <h2 className="mb-4">Ordini Cucina</h2>
      <div className="row">
        {/* Colonna sinistra */}
        <div className="col-md-6 yellow">
          <h4 className="mb-2">🔥 In preparazione</h4>
          {inPreparazione.map((ordine) => (
            <div key={ordine.id} className="card mb-3 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title">Ordine #<span id="ordine">{ordine.numero_ordine}</span></h5>
                </div>
                <div className="card-text">
                  {raggruppaOrdine(ordine.prodotti)}
                </div>

                <div>
                  <button
                    className="btn-indietro"
                    onClick={() => aggiornaStatoOrdine(ordine.id, "da pagare")}
                  >
                    Indietro
                  </button>
                  <button
                    className="btn-avanti"
                    onClick={() =>
                      aggiornaStatoOrdine(ordine.id, "carne pronta")
                    }
                  >
                    Segna come Cotto
                  </button>
                  <button
                    className="button-canc"
                    onClick={() => eliminaOrdine(ordine.id)}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Colonna destra */}
        <div className="col-md-6">
          <h4 className="mb-2">🍔 Assemblaggio</h4>
          {[...carnePronta].reverse().map((ordine) => (
            <div key={ordine.id} className="card mb-3 shadow-sm border-success">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title">Ordine #<span id="ordine">{ordine.numero_ordine}</span></h5>
                </div>
                <div className="card-text">
                  {raggruppaOrdine(ordine.prodotti)}
                </div>

                <div>
                  <button
                    className="btn-indietro"
                    onClick={() =>
                      aggiornaStatoOrdine(ordine.id, "in preparazione")
                    }
                  >
                    Indietro
                  </button>
                  <button
                    className="button-canc"
                    onClick={() => eliminaOrdine(ordine.id)}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cuoco;
