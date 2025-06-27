import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const Assemblaggio = () => {
  const [ordini, setOrdini] = useState([]);

  const fetchOrdini = async () => {
    const { data, error } = await supabase
      .from("ordini")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Errore nel recupero ordini:", error);
      toast.error("Errore nel recupero ordini.");
      return;
    }

    setOrdini(data);
  };

  useEffect(() => {
    fetchOrdini();
  }, []);

  const aggiornaStatoOrdine = async (id, nuovoStato) => {
    const { error } = await supabase
      .from("ordini")
      .update({ stato: nuovoStato })
      .eq("id", id);

    if (error) {
      console.error("Errore aggiornamento stato:", error);
      toast.error("Errore aggiornamento stato.");
    } else {
      fetchOrdini();
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
                    toast.error("❌ Errore durante l'eliminazione.");
                  } else {
                    toast.success("✅ Ordine eliminato.");
                    fetchOrdini();
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
        {panini.map((p, idx) => {
          const ingredienti = [
            ...(p.ingredienti || []),
            ...(p.aggiunte || []),
          ].map((i) => i.nome);

          return (
            <li key={`panino-${idx}`}>
              {p.nome}
              {p.aggiunte && p.aggiunte.length > 0 && (
                <>
                  {" "}
                  <span>+ {p.aggiunte.map((a) => a.nome).join(", ")}</span>{" "}
                </>
              )}
            </li>
          );
        })}
        {patatine.length > 0 && <li>x{patatine.length} Patatine Fritte</li>}
      </ul>
    );
  };

  const carnePronta = ordini.filter((o) => o.stato === "carne pronta");
  const completi = ordini.filter((o) => o.stato === "completo");

  return (
    <div className="container">
      <h2 className="mb-4">Ordini Assemblaggio</h2>
      <div className="row">
        {/* Colonna sinistra */}
        <div className="col-md-6 yellow">
          <h4 className="mb-2">🍔 Da assemblare</h4>
          {carnePronta.map((ordine) => (
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
                    onClick={() =>
                      aggiornaStatoOrdine(ordine.id, "in preparazione")
                    }
                    className="btn-indietro"
                  >
                    Indietro
                  </button>
                  <button
                    onClick={() => aggiornaStatoOrdine(ordine.id, "completo")}
                    className="btn-avanti"
                  >
                    Segna come Completo
                  </button>
                  <button
                    onClick={() => eliminaOrdine(ordine.id)}
                    className="button-canc"
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
          <h4 className="mb-2">✅ Completati</h4>
          {[...completi].reverse().map((ordine) => (
            <div key={ordine.id} className="card mb-3 shadow-sm border-success">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title">Ordine #<span id="ordine">{ordine.numero_ordine}</span></h5>
                </div>
                <div className="card-text">
                  {raggruppaOrdine(ordine.prodotti)}
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button
                    onClick={() =>
                      aggiornaStatoOrdine(ordine.id, "carne pronta")
                    }
                    className="btn-indietro"
                  >
                    Indietro
                  </button>
                  <button
                    onClick={() => eliminaOrdine(ordine.id)}
                    className="button-canc"
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

export default Assemblaggio;
