import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const stati = ["da pagare", "in preparazione", "carne pronta", "completo"];

const TuttiOrdini = () => {
  const [ordini, setOrdini] = useState([]);

  const fetchOrdini = async () => {
    const { data, error } = await supabase
      .from("ordini")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setOrdini(data);
  };

  useEffect(() => {
    fetchOrdini();
  }, []);

  const cambiaStatoOrdine = async (ordine, direzione = "avanti") => {
    const statoAttuale = ordine.stato;
    const indexAttuale = stati.indexOf(statoAttuale);

    let nuovoIndex =
      direzione === "avanti"
        ? Math.min(indexAttuale + 1, stati.length - 1)
        : Math.max(indexAttuale - 1, 0);

    const nuovoStato = stati[nuovoIndex];

    if (nuovoStato === statoAttuale) return;

    const { error } = await supabase
      .from("ordini")
      .update({ stato: nuovoStato })
      .eq("id", ordine.id);

    if (error) {
      toast.error("❌ Errore nel cambiare stato.");
      console.error(error);
    } else {
      toast.success(`✅ Stato aggiornato a "${nuovoStato}"`);
      fetchOrdini();
    }
  };

  const eliminaOrdine = async (id) => {
    const { error } = await supabase.from("ordini").delete().eq("id", id);
    if (error) {
      toast.error("❌ Errore durante l'eliminazione.");
    } else {
      toast.success("🗑️ Ordine eliminato");
      fetchOrdini();
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4">Tutti gli Ordini</h2>
      <div className="row">
        {stati.map((stato) => (
          <div key={stato} className="col-md-3">
            <h4 className="mb-2">{stato}</h4>
            <div>
              {ordini
                .filter((o) => o.stato === stato)
                .map((ordine) => (
                  <AccordionOrdine
                    key={ordine.id}
                    ordine={ordine}
                    cambiaStatoOrdine={cambiaStatoOrdine}
                    eliminaOrdine={eliminaOrdine}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AccordionOrdine = ({ ordine, cambiaStatoOrdine, eliminaOrdine }) => {
  const [aperto, setAperto] = useState(false);

  return (
    <div className="card card-body">
      <div onClick={() => setAperto(!aperto)} className="accordion-header">
        <span id="ordine">#{ordine.numero_ordine || ordine.id}</span>
        <span>{aperto ? "▼" : "➤"}</span>
      </div>

      {aperto && (
        <div className="accordion-body">
          <ul className="mb-0 ps-3">
            {ordine.prodotti.map((p, i) => (
              <li key={i}>
                {p.nome}
                {p.aggiunte?.length > 0 && (
                  <small className="d-block text-muted">
                    + {p.aggiunte.map((a) => a.nome).join(", ")}
                  </small>
                )}
              </li>
            ))}
          </ul>
          <hr className="mb-2" />
          <div className="fw-bold mb-2">
            Totale:{" "}
            {ordine.prodotti
              .reduce((tot, p) => tot + (p.prezzo || 0), 0)
              .toFixed(2)}{" "}
            €
          </div>
          <div className="d-flex justify-content-between gap-2">
            <button
              className="btn-indietro"
              disabled={ordine.stato === "da pagare"}
              onClick={() => cambiaStatoOrdine(ordine, "indietro")}
            >
              Indietro
            </button>
            {ordine.stato === "completo" ? (
              <button
                className="button-canc"
                onClick={() => eliminaOrdine(ordine.id)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            ) : (
              <button
                className="btn-avanti"
                onClick={() => cambiaStatoOrdine(ordine, "avanti")}
              >
                Avanti
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TuttiOrdini;
