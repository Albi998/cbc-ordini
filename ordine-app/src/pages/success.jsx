import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Success = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ordine, setOrdine] = useState(null);
  const [statoOrdine, setStatoOrdine] = useState(null);
  const [tempoRimanente, setTempoRimanente] = useState(0);

  const calcolaTotale = () => {
    return ordine.prodotti
      .reduce((acc, p) => acc + (p.prezzo || 0), 0)
      .toFixed(2);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    let channel = null;

    const fetchOrdine = async () => {
      const { data, error } = await supabase
        .from("ordini")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setOrdine(data);
        setStatoOrdine(data.stato);

        // Calcolo timer
        let creazione = new Date(data.created_at);
        const cached = JSON.parse(localStorage.getItem("ordine_inviato"));
        if (
          cached?.id === data.id &&
          cached.created_at &&
          !isNaN(new Date(cached.created_at).getTime())
        ) {
          creazione = new Date(cached.created_at);
        }

        const scadenza = new Date(creazione.getTime() + 15 * 60 * 1000);

        const aggiornaTempo = () => {
          const oraAttuale = new Date();
          const diff = scadenza - oraAttuale;
          if (diff <= 0) {
            setTimeout(() => eliminaOrdine(), 200);
            return;
          }
          setTempoRimanente(Math.floor(diff / 1000));
        };

        aggiornaTempo();
        const timer = setInterval(aggiornaTempo, 1000);

        // 👇 Realtime listener per cambio stato
        channel = supabase
          .channel("success_" + id)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "ordini",
              filter: `id=eq.${id}`,
            },
            (payload) => {
              const nuovoStato = payload.new.stato;
              setStatoOrdine(nuovoStato);
            }
          )
          .subscribe();

        return () => {
          clearInterval(timer);
          if (channel) supabase.removeChannel(channel);
        };
      }
    };

    fetchOrdine();
  }, [id]);

  const eliminaOrdine = async () => {
    await supabase.from("ordini").delete().eq("id", id);
    localStorage.removeItem("ordine_inviato");
    navigate("/");
  };

  const formatTempo = (secondi) => {
    const m = String(Math.floor(secondi / 60)).padStart(2, "0");
    const s = String(secondi % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!ordine) {
    return <p className="text-center mt-5">Caricamento ordine...</p>;
  }
  if (statoOrdine === "in preparazione" || statoOrdine === "carne pronta") {
    return (
      <div className="container success waiting">
        <h1>Ordine #{ordine.numero_ordine || ordine.id}</h1>
        <p className="lead">Il tuo ordine è in preparazione. ⏳</p>
        <p>Non chiudere questa schermata, ti avvisiamo appena è pronto!</p>
      </div>
    );
  }

  if (statoOrdine === "completo") {
    return (
      <div className="container success pronto">
        <h1>Ordine #{ordine.numero_ordine || ordine.id} pronto! 🎉 </h1>
        <p className="lead">Ritira al chiosco e buon appetito!</p>

        <button
          className="cancella-success"
          onClick={() => {
            localStorage.removeItem("ordine");
            localStorage.removeItem("ordine_inviato");
            navigate("/");
          }}
        >
          Torna al Menù
        </button>
      </div>
    );
  }

  return (
    <div className="container success">
      <div className="tick">✅</div>
      <h1>Ordine #{ordine.numero_ordine || ordine.id}</h1>
      <p className="lead mt-3">
        Per convalidare l'ordine recati alla cassa per pagare entro:
      </p>

      <h2
        className={`countdown ${
          tempoRimanente <= 300 ? "text-danger fw-bold" : ""
        }`}
      >
        {formatTempo(tempoRimanente)}
      </h2>

      <div className="recap">
        <h4>Il tuo ordine:</h4>
        <ul className="list-group">
          {ordine.prodotti.map((p, i) => (
            <li key={i} className="list-group-item">
              {p.nome} - {p.prezzo}€{" "}
              {p.aggiunte?.length > 0 && (
                <span className="d-block small text-muted">
                  + {p.aggiunte.map((a) => a.nome).join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <h3 className="mt-4">💰 Totale: {calcolaTotale()} €</h3>

      <button onClick={eliminaOrdine} className="cancella-success">
        Cancella Ordine
      </button>
    </div>
  );
};

export default Success;
