import React, { useState, useEffect } from "react";
import paniniData from "../data/panini.json";
import bevandeData from "../data/bevande.json";
import snackData from "../data/snack.json";
import aggiunteData from "../data/aggiunte.json";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast"; // 🔥 aggiungi questa import

const Cassa = () => {
  const [ordine, setOrdine] = useState({
    panini: [],
    snack: [],
    bevande: [],
  });

  const [tabAttiva, setTabAttiva] = useState("cibo");
  const [paninoInCorso, setPaninoInCorso] = useState(null); // Aggiungi stato per il panino che si sta selezionando
  const [aggiunteSelezionate, setAggiunteSelezionate] = useState([]); // Aggiungi stato per le aggiunte
  const [ordiniDaPagare, setOrdiniDaPagare] = useState([]);

  useEffect(() => {
    const fetchOrdini = async () => {
      const { data, error } = await supabase
        .from("ordini")
        .select("*")
        .eq("stato", "da pagare")
        .order("created_at", { ascending: true }); // ✅ mostra i più vecchi prima

      if (!error) {
        setOrdiniDaPagare(data);
      }
    };

    fetchOrdini(); // iniziale

    const channel = supabase

      .channel("ordini_da_pagare")
      .on(
        "postgres_changes",
        {
          event: "*", // insert | update | delete
          schema: "public",
          table: "ordini",
        },
        (payload) => {
          // Quando cambia qualcosa, ricarica
          fetchOrdini();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const aggiungiPanino = (panino) => {
    setPaninoInCorso(panino); // Imposta il panino in corso
    setAggiunteSelezionate([]); // Resetta le aggiunte selezionate quando si seleziona un nuovo panino
  };

  const aggiungiBevanda = (bevanda) => {
    setOrdine((prev) => ({
      ...prev,
      bevande: [...(prev.bevande || []), bevanda],
    }));
  };

  const aggiungiSnack = (snack) => {
    setOrdine((prev) => ({
      ...prev,
      snack: [...(prev.snack || []), snack],
    }));
  };

  const toggleAggiunta = (aggiunta) => {
    setAggiunteSelezionate((prev) => {
      const esiste = prev.find((a) => a.id === aggiunta.id);
      if (esiste) {
        return prev.filter((a) => a.id !== aggiunta.id);
      } else {
        return [...prev, aggiunta];
      }
    });
  };

  const confermaPanino = () => {
    if (paninoInCorso) {
      setOrdine((prev) => ({
        ...prev,
        panini: [
          ...prev.panini,
          {
            ...paninoInCorso,
            aggiunte: aggiunteSelezionate,
          },
        ],
      }));
      setPaninoInCorso(null); // Resetta il panino in corso
      setAggiunteSelezionate([]); // Resetta le aggiunte
    }
  };

  const rimuoviPanino = (index) => {
    const nuovi = ordine.panini.filter((_, i) => i !== index);
    setOrdine((prev) => ({ ...prev, panini: nuovi }));
  };

  const rimuoviBevanda = (index) => {
    const nuove = ordine.bevande.filter((_, i) => i !== index);
    setOrdine((prev) => ({ ...prev, bevande: nuove }));
  };

  const rimuoviSnack = (index) => {
    const nuovi = ordine.snack.filter((_, i) => i !== index);
    setOrdine((prev) => ({ ...prev, snack: nuovi }));
  };

  const contaPerTipo = (aggiunte, tipo) =>
    aggiunte.filter((a) => a.tipo === tipo).length;

  const calcolaTotalePanino = (panino) => {
    const costoExtra = 0.5;

    if (panino.nome === "Carbo Beach Burger") {
      const numeroSalse = panino.aggiunte.filter(
        (a) => a.tipo === "Salse"
      ).length;
      return panino.prezzo + numeroSalse * costoExtra;
    }

    // Altri panini: limiti inclusi
    const limite = { Formaggio: 1, Verdure: 2, Salse: 2 };

    const tipiContati = { Formaggio: 0, Verdure: 0, Salse: 0 };

    let extra = 0;
    for (const agg of panino.aggiunte || []) {
      const tipo = agg.tipo;
      if (tipiContati[tipo] < limite[tipo]) {
        tipiContati[tipo]++;
      } else {
        extra += costoExtra;
      }
    }

    return panino.prezzo + extra;
  };

  const calcolaTotaleOrdine = () => {
    const totalePanini = (ordine.panini || []).reduce(
      (acc, p) => acc + calcolaTotalePanino(p),
      0
    );
    const totaleSnack = (ordine.snack || []).reduce(
      (acc, s) => acc + s.prezzo,
      0
    );
    const totaleBevande = (ordine.bevande || []).reduce(
      (acc, b) => acc + b.prezzo,
      0
    );
    return (totalePanini + totaleSnack + totaleBevande).toFixed(2);
  };

  const passaAInPreparazione = async (ordineId) => {
    const { error } = await supabase
      .from("ordini")
      .update({ stato: "in preparazione" })
      .eq("id", ordineId);

    if (error) {
      toast.error("❌ Errore nel cambiare stato dell'ordine.");
      console.error(error);
    } else {
      toast.success("Ordine in preparazione!");
      setOrdiniDaPagare((prev) =>
        prev.filter((ordine) => ordine.id !== ordineId)
      );
    }
  };

  const inviaOrdine = async () => {
    console.log("➡ inviaOrdine chiamata");

    // Verifica se l'ordine è vuoto
    const isVuoto =
      ordine.panini.length === 0 &&
      ordine.bevande.length === 0 &&
      ordine.snack.length === 0;

    if (isVuoto) {
      toast.error(
        "❌ Ordine vuoto. Aggiungi almeno un panino, una bevanda o uno snack."
      );
      return;
    }

    toast(
      (t) => (
        <div className="toast-overlay">
          <div className={`toast ${t.visible ? "show" : ""}`}>
            <p>Confermi l'invio dell'ordine?</p>
            <div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="button-canc btn-attivo"
              >
                <i className="fa-solid fa-xmark"></i> Annulla
              </button>
              <button
                onClick={async () => {
                  toast.dismiss(t.id);

                  const prodotti = [
                    ...ordine.panini.map((p) => ({
                      nome: p.nome,
                      aggiunte: p.aggiunte,
                      tipo: "panino",
                      prezzo: calcolaTotalePanino(p),
                    })),

                    ...ordine.bevande.map((b) => ({
                      nome: b.nome,
                      tipo: "bevanda",
                      prezzo: b.prezzo,
                    })),
                    ...ordine.snack.map((s) => ({
                      nome: s.nome,
                      tipo: "snack",
                      prezzo: s.prezzo,
                    })),
                  ];

                  const { error } = await supabase.from("ordini").insert([
                    {
                      prodotti: prodotti,
                      note: "",
                      stato: "in preparazione", // 👈 QUI
                    },
                  ]);

                  if (error) {
                    console.error("Errore invio:", error);
                    toast.error("❌ Errore durante l'invio dell'ordine.");
                  } else {
                    toast.success("Ordine inviato con successo!");
                    setOrdine({ panini: [], bevande: [], snack: [] });
                  }
                }}
                className="btn-ok btn-attivo"
              >
                <i className="fa-solid fa-check"></i> Conferma
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: 30000,
      }
    );
  };

  const isBevandaSelezionata = (bevanda) =>
    ordine.bevande.some((b) => b.id === bevanda.id);

  const calcolaTotaleOrdineGenerico = (prodotti) => {
    if (!Array.isArray(prodotti)) return 0;
    return prodotti
      .reduce((totale, p) => totale + (p.prezzo || 0), 0)
      .toFixed(2);
  };

  return (
    <div className="container">
      <div className="row">
        {/* COLONNA SINISTRA (Contenuto - Panini e Bevande) */}
        <div className="col-md-7">
          <h2>Seleziona Categoria</h2>
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`btn-tabs tab-button ${
                tabAttiva === "cibo" ? "active" : ""
              }`}
              onClick={() => setTabAttiva("cibo")}
            >
              🍔 Panini
            </button>
            <button
              className={`btn-tabs tab-button ${
                tabAttiva === "snack" ? "active" : ""
              }`}
              onClick={() => setTabAttiva("snack")}
            >
              🍟 Snack
            </button>
            <button
              className={`btn-tabs tab-button ${
                tabAttiva === "bevande" ? "active" : ""
              }`}
              onClick={() => setTabAttiva("bevande")}
            >
              🍺 Bevande
            </button>
          </div>

          {/* Mostra Panini solo se la tab "cibo" è attiva */}
          {tabAttiva === "cibo" && (
            <div className="row">
              {paniniData.map((p) => (
                <div key={p.id} className="col-md-4">
                  <div className="mb-3">
                    <button
                      onClick={() => aggiungiPanino(p)}
                      className="w-100 btn-prodotti"
                    >
                      {p.nome}
                    </button>

                    {/* Se c'è un panino in corso, mostra le aggiunte sotto */}
                    {paninoInCorso && paninoInCorso.id === p.id && (
                      <div className="aggiunte-container">
                        {aggiunteData
                          .filter((a) =>
                            paninoInCorso.nome === "Carbo Beach Burger"
                              ? a.tipo === "Salse"
                              : true
                          )
                          .map((a) => (
                            <button
                              key={a.id}
                              onClick={() => toggleAggiunta(a)}
                              className={`w-100 mb-2 btn-aggiunte ${
                                aggiunteSelezionate.some(
                                  (agg) => agg.id === a.id
                                )
                                  ? "btn-success"
                                  : ""
                              }`}
                            >
                              {a.nome}
                            </button>
                          ))}
                        <button
                          onClick={confermaPanino}
                          className="btn-invio w-100 mt-3"
                        >
                          ✅ Conferma Panino
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mostra Bevande solo se la tab "bevande" è attiva */}
          {tabAttiva === "bevande" && (
            <div className="bevande-container row">
              {bevandeData.map((b) => (
                <div key={b.id} className="col-md-4">
                  <button
                    onClick={() => aggiungiBevanda(b)}
                    className="button w-100 mb-2 btn-prodotti"
                  >
                    {b.nome}
                  </button>
                </div>
              ))}
            </div>
          )}
          {tabAttiva === "snack" && (
            <div className="snack-container row">
              {snackData.map((s) => (
                <div className="col-md-4" key={s.id}>
                  <button
                    onClick={() => aggiungiSnack(s)}
                    className="button w-100 mb-2 btn-prodotti"
                  >
                    {s.nome}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLONNA DESTRA (Recap Ordine) */}
        <div className="col-md-5 pe-0">
          <h2>Ordine Corrente</h2>
          {/* Recap Ordine */}
          {ordine.panini.map((p, idx) => (
            <div key={idx} className="mb-3 p-2 border rounded">
              <p className="mt-2 tabella-ordini">
                {p.nome} - {calcolaTotalePanino(p).toFixed(2)}€
                <button
                  onClick={() => rimuoviPanino(idx)}
                  className="btn-attivo button-canc"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </p>
              <p className="agg">
                + {p.aggiunte.map((a) => a.nome).join(", ") || "Nessuna"}
              </p>
            </div>
          ))}

          {ordine.snack.length > 0 && (
            <>
              <ul className="list-unstyled">
                {ordine.snack.map((s, i) => (
                  <li key={i} className="mb-2 mt-2 tabella-ordini">
                    {s.nome} - {s.prezzo}€{" "}
                    <button
                      onClick={() => rimuoviSnack(i)}
                      className="btn-attivo button-canc"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {ordine.bevande.length > 0 && (
            <>
              {/* <h4>Bevande:</h4> */}
              <ul className="list-unstyled">
                {ordine.bevande.map((b, i) => (
                  <li key={i} className="mb-2 mt-2 tabella-ordini">
                    {b.nome} - {b.prezzo}€{" "}
                    <button
                      onClick={() => rimuoviBevanda(i)}
                      className="btn-attivo button-canc"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-4 p-3 bg-light border rounded">
            <h3>💰 Totale: {calcolaTotaleOrdine()} €</h3>
            <button
              onClick={inviaOrdine}
              className="btn-invio mt-4"
              disabled={
                ordine.panini.length === 0 &&
                ordine.bevande.length === 0 &&
                ordine.snack.length === 0
              }
            >
              ✅ Invia Ordine
            </button>
          </div>
        </div>
      </div>
      <div className="da-pagare">
        <h2 className="mb-3">Ordini da pagare</h2>
        {ordiniDaPagare.length === 0 ? (
          <p>Nessun ordine da pagare al momento.</p>
        ) : (
          ordiniDaPagare.map((ordine, index) => (
            <div key={ordine.id || index} className="card card-body">
              <h5>
                Ordine #<span id="ordine">{ordine.numero_ordine}</span>
              </h5>
              <ul className="list-unstyled">
                {ordine.prodotti.map((p, i) => (
                  <li key={i}>
                    {p.nome}
                    {p.aggiunte && p.aggiunte.length > 0 && (
                      <span> + {p.aggiunte.map((a) => a.nome).join(", ")}</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="row">
                <div className="col-md-8">
                  <h5 className="fw-bold mt-2">
                    Totale: {calcolaTotaleOrdineGenerico(ordine.prodotti)} €
                  </h5>
                </div>
                <div className="col-md-4">
                  <button
                    onClick={() => passaAInPreparazione(ordine.id)}
                    className="btn-invio"
                  >
                    ✅ Pagato!
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Cassa;
