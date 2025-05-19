import React, { useEffect, useState } from "react";
import paniniData from "../data/panini.json";
import bevandeData from "../data/bevande.json";
import snackData from "../data/snack.json";
import aggiunteData from "../data/aggiunte.json";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast"; // 🔥 aggiungi questa import

const Cassa = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login");
  };

  const [ordine, setOrdine] = useState({
    panini: [],
    snack: [],
    bevande: [],
  });

  const [tabAttiva, setTabAttiva] = useState("cibo");
  const [paninoInCorso, setPaninoInCorso] = useState(null);
  const [aggiunteSelezionate, setAggiunteSelezionate] = useState([]);
  const [mostraRiepilogo, setMostraRiepilogo] = useState(false);

  // 👇 INSERISCI QUI I DUE useEffect
  useEffect(() => {
    const ordineSalvato = localStorage.getItem("ordine");
    if (ordineSalvato) {
      setOrdine(JSON.parse(ordineSalvato));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ordine", JSON.stringify(ordine));
  }, [ordine]);

  const scrollBloccato = mostraRiepilogo || paninoInCorso;

  useEffect(() => {
    if (scrollBloccato) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [scrollBloccato]);

  useEffect(() => {
    const ordineInviato = JSON.parse(localStorage.getItem("ordine_inviato"));
    if (ordineInviato?.id) {
      navigate(`/success/${ordineInviato.id}`);
    }
  }, []);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 600px)");

    if (!isMobile.matches) {
      navigate("/login");
    }

    const handleResize = (e) => {
      if (!e.matches) {
        navigate("/login");
      }
    };

    isMobile.addEventListener("change", handleResize);

    return () => {
      isMobile.removeEventListener("change", handleResize);
    };
  }, [navigate]);

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

  // Scroll per chiudere la card

  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEndY(e.touches[0].clientY);
  };

  const handleTouchEnd = (onSwipeDown) => {
    if (touchStartY !== null && touchEndY !== null) {
      const deltaY = touchEndY - touchStartY;
      const swipeThreshold = 100;

      if (deltaY > swipeThreshold) {
        onSwipeDown(); // qui esegui l'azione custom
      }
    }

    setTouchStartY(null);
    setTouchEndY(null);
  };

  const cancellaOrdine = () => {
    setOrdine({ panini: [], bevande: [], snack: [] });
    localStorage.removeItem("ordine");
  };

  // 1. Raggruppa per tipo
  const aggiuntePerTipo = aggiunteData.reduce((acc, curr) => {
    if (!acc[curr.tipo]) acc[curr.tipo] = [];
    acc[curr.tipo].push(curr);
    return acc;
  }, {});

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

  const rimuoviUnaBevanda = (id) => {
    const indexToRemove = ordine.bevande.findIndex((item) => item.id === id);
    if (indexToRemove === -1) return;

    const nuoveBevande = [...ordine.bevande];
    nuoveBevande.splice(indexToRemove, 1);

    const nuovoOrdine = {
      ...ordine,
      bevande: nuoveBevande,
    };

    setOrdine(nuovoOrdine);
    localStorage.setItem("ordine", JSON.stringify(nuovoOrdine));
  };

  const rimuoviUnoSnack = (id) => {
    const indexToRemove = ordine.snack.findIndex((item) => item.id === id);
    if (indexToRemove === -1) return;

    const nuovoSnack = [...ordine.snack];
    nuovoSnack.splice(indexToRemove, 1);

    const nuovoOrdine = {
      ...ordine,
      snack: nuovoSnack,
    };

    setOrdine(nuovoOrdine);
    localStorage.setItem("ordine", JSON.stringify(nuovoOrdine));
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

  const inviaOrdine = async () => {
    console.log("➡ inviaOrdine chiamata");

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
          <div className={`toast-uno ${t.visible ? "show" : ""}`}>
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

                  const { data, error } = await supabase
                    .from("ordini")
                    .insert([
                      {
                        prodotti,
                        stato: "da pagare",
                        note: "",
                      },
                    ])
                    .select()
                    .single();

                  if (error) {
                    console.error("Errore invio:", error);
                    toast.error("❌ Errore durante l'invio dell'ordine.");
                  } else {
                    // ✅ Pulisci ordine e salva su localStorage
                    setOrdine({ panini: [], bevande: [], snack: [] });
                    localStorage.setItem(
                      "ordine_inviato",
                      JSON.stringify({
                        id: data.id,
                        created_at: data.created_at,
                      })
                    );
                    // 🚀 Reindirizza subito a success
                    navigate(`/success/${data.id}`);
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
        duration: 2000000,
      }
    );
  };

  const isBevandaSelezionata = (bevanda) =>
    ordine.bevande.some((b) => b.id === bevanda.id);

  return (
    <div>
      <div className="banner-ordina">
        <img src="public/images/frittedue.webp" alt="" loading="lazy"/>
      </div>
      <div>
        <button onClick={handleLoginClick} className="btn-login btn-attivo">
          <i className="fa-solid fa-user"></i>
        </button>
      </div>
      <div className="container">
        <h1 className="mb-2">Carbo Beach Cup Menù!</h1>
        <h2>Ordina qui sotto👇</h2>
        <div className="row">
          {/* COLONNA SINISTRA (Contenuto - Panini e Bevande) */}
          <div className="col-md-7">
            {/* <h2>Seleziona Categoria</h2> */}
            {/* Tabs */}
            <div className="tabs">
              <button
                className={`btn-tabs ${tabAttiva === "cibo" ? "active" : ""}`}
                onClick={() => setTabAttiva("cibo")}
              >
                Panini
              </button>
              <button
                className={`btn-tabs ${tabAttiva === "snack" ? "active" : ""}`}
                onClick={() => setTabAttiva("snack")}
              >
                Snack
              </button>
              <button
                className={`btn-tabs ${
                  tabAttiva === "bevande" ? "active" : ""
                }`}
                onClick={() => setTabAttiva("bevande")}
              >
                Bevande
              </button>
            </div>

            {tabAttiva === "cibo" && (
              <div className="row relativo">
                {/* Mappa dei panini */}
                {paniniData.map((p) => (
                  <div key={p.id} className="col-md-4">
                    <div>
                      <div
                        onClick={() => aggiungiPanino(p)}
                        className="w-100 card-prodotti"
                      >
                        <div className="row">
                          <div className="prodotto col-4">
                            <img src={p.img} alt={p.nome} loading="lazy"/>
                          </div>
                          <div className="prodotto-text col-6">
                            <h3>{p.nome}</h3>
                            <span>{p.descrizione}</span>
                          </div>
                          <div className="prodotto-price col-2">
                            <h4>{p.prezzo} €</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Card delle aggiunte in fondo alla pagina */}
                <AnimatePresence>
                  {paninoInCorso && (
                    <motion.div
                      key="aggiunte-panel"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() =>
                        handleTouchEnd(() => setPaninoInCorso(null))
                      }
                      className="card-aggiunte"
                    >
                      <button
                        className="indietro-x btn-attivo"
                        onClick={() => setPaninoInCorso(null)}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                      <img
                        src={paninoInCorso.img}
                        alt={paninoInCorso.nome}
                        className="aggiunte-img" loading="lazy"
                      />
                      <div className="aggiunte-body">
                        <h5 className="text-lg font-bold mb-3 text-center">
                          {paninoInCorso.nome}
                        </h5>
                        <h6>{paninoInCorso.prezzo}.00 €</h6>
                        <p>{paninoInCorso.descrizione}</p>

                        <div>
                          {Object.entries(
                            aggiunteData
                              .filter((a) =>
                                paninoInCorso.nome === "Carbo Beach Burger"
                                  ? a.tipo === "Salse"
                                  : true
                              )
                              .reduce((acc, curr) => {
                                if (!acc[curr.tipo]) acc[curr.tipo] = [];
                                acc[curr.tipo].push(curr);
                                return acc;
                              }, {})
                          ).map(([tipo, aggiunte]) => (
                            <div key={tipo} className="mb-3">
                              <h6>{tipo}</h6>
                              {aggiunte.map((a) => (
                                <div
                                  key={a.id}
                                  onClick={() => toggleAggiunta(a)}
                                  className={`btn-aggiunte w-100 mb-2 ${
                                    aggiunteSelezionate.some(
                                      (agg) => agg.id === a.id
                                    )
                                      ? "btn-success"
                                      : ""
                                  }`}
                                >
                                  <p className="aggiunta">{a.nome}</p>
                                  <button
                                    className={`add-btn btn-attivo ${
                                      aggiunteSelezionate.some(
                                        (agg) => agg.id === a.id
                                      )
                                        ? "btn-rosso"
                                        : ""
                                    }`}
                                  >
                                    <i
                                      className={`fa-solid ${
                                        aggiunteSelezionate.some(
                                          (agg) => agg.id === a.id
                                        )
                                          ? "fa-minus"
                                          : "fa-plus"
                                      }`}
                                    ></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={confermaPanino}
                          className="btn-invio w-100 mt-3"
                        >
                          ✅ Conferma Panino
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mostra Bevande solo se la tab "bevande" è attiva */}
            {tabAttiva === "bevande" && (
              <div className="row">
                {bevandeData.map((b) => {
                  const quantitàNelCarrello = ordine.bevande.filter(
                    (item) => item.id === b.id
                  ).length;

                  return (
                    <div key={b.id} className="col-md-4">
                      <div
                        onClick={() => aggiungiBevanda(b)}
                        className="w-100 card-prodotti position-relative"
                      >
                        {/* 🔵 Counter visibile solo se presente nel carrello */}
                        {quantitàNelCarrello > 0 && (
                          <>
                            <button className="counter-pill">
                              {quantitàNelCarrello}
                            </button>
                            <button
                              className="rimuovi-pill btn-attivo"
                              onClick={(e) => {
                                e.stopPropagation();
                                rimuoviUnaBevanda(b.id);
                              }}
                            >
                              <i className="fa-solid fa-minus"></i>
                            </button>
                          </>
                        )}

                        <div className="row">
                          <div className="prodotto col-4">
                            <img src={b.img} alt={b.nome} loading="lazy"/>
                          </div>
                          <div className="prodotto-text col-6">
                            <h3>{b.nome}</h3>
                            <span>{b.descrizione}</span>
                          </div>
                          <div className="prodotto-price col-2">
                            <h4>{b.prezzo} €</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mostra Snack solo se la tab "snack" è attiva */}
            {tabAttiva === "snack" && (
              <div className="row">
                {snackData.map((s) => {
                  const quantitàNelCarrello = ordine.snack.filter(
                    (item) => item.id === s.id
                  ).length;

                  return (
                    <div className="col-md-4" key={s.id}>
                      <div
                        onClick={() => aggiungiSnack(s)}
                        className="w-100 card-prodotti position-relative"
                      >
                        {/* 🔵 Counter visibile solo se presente nel carrello */}
                        {quantitàNelCarrello > 0 && (
                          <>
                            <button className="counter-pill">
                              {quantitàNelCarrello}
                            </button>
                            <button
                              className="rimuovi-pill btn-attivo"
                              onClick={(e) => {
                                e.stopPropagation();
                                rimuoviUnoSnack(s.id);
                              }}
                            >
                              <i className="fa-solid fa-minus"></i>
                            </button>
                          </>
                        )}

                        <div className="row">
                          <div className="prodotto col-4">
                            <img src={s.img} alt={s.nome} width={"100px"} loading="lazy"/>
                          </div>
                          <div className="prodotto-text col-6">
                            <h3>{s.nome}</h3>
                            <span>{s.descrizione}</span>
                          </div>
                          <div className="prodotto-price col-2">
                            <h4>{s.prezzo} €</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <AnimatePresence>
            {mostraRiepilogo && (
              <motion.div
                key="riepilogo-panel"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() =>
                  handleTouchEnd(() => setMostraRiepilogo(false))
                }
                className="card-aggiunte" // usa lo stesso stile visivo, poi adatti
              >
                <button
                  className="indietro-x btn-attivo"
                  onClick={() => setMostraRiepilogo(false)}
                >
                  <i className="fa-solid fa-xmark btn-attivo"></i>
                </button>

                <div className="aggiunte-body">
                  <h2>Il tuo ordine:</h2>

                  {ordine.panini.map((p, idx) => (
                    <div key={idx} className="mb-3 p-2 border rounded">
                      <h6 className="mt-2 tabella-ordini">
                        {p.nome} - {calcolaTotalePanino(p).toFixed(2)}€
                        <button
                          onClick={() => rimuoviPanino(idx)}
                          className="btn-rosso btn-attivo"
                        >
                          <i className="fa-solid fa-minus"></i>
                        </button>
                      </h6>
                      <p className="agg">
                        +{" "}
                        {p.aggiunte.map((a) => a.nome).join(", ") || "Nessuna"}
                      </p>
                    </div>
                  ))}

                  {ordine.snack.length > 0 && (
                    <ul className="list-unstyled">
                      {ordine.snack.map((s, i) => (
                        <li key={i} className="mb-2 mt-2 tabella-ordini">
                          {s.nome} - {s.prezzo}€{" "}
                          <button
                            onClick={() => rimuoviSnack(i)}
                            className="btn-attivo btn-rosso"
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {ordine.bevande.length > 0 && (
                    <ul className="list-unstyled">
                      {ordine.bevande.map((b, i) => (
                        <li key={i} className="mb-2 mt-2 tabella-ordini">
                          {b.nome} - {b.prezzo}€{" "}
                          <button
                            onClick={() => rimuoviBevanda(i)}
                            className="btn-attivo btn-rosso"
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={inviaOrdine}
                    className="btn-invio w-100 mt-4 btn-attivo"
                    disabled={
                      ordine.panini.length === 0 &&
                      ordine.bevande.length === 0 &&
                      ordine.snack.length === 0
                    }
                  >
                    ✅ Invia Ordine - Totale: {calcolaTotaleOrdine()} €
                  </button>
                  <button
                    onClick={cancellaOrdine}
                    className="btn-cancella w-100 btn-attivo mt-2"
                    disabled={
                      ordine.panini.length === 0 &&
                      ordine.bevande.length === 0 &&
                      ordine.snack.length === 0
                    }
                  >
                    ❌ Cancella Ordine
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="button-total">
            <div className="mobile-total">
              <button
                onClick={() => setMostraRiepilogo(true)}
                className="btn-invio mt-4 btn-attivo"
                disabled={
                  ordine.panini.length === 0 &&
                  ordine.bevande.length === 0 &&
                  ordine.snack.length === 0
                }
              >
                <h3>Totale: {calcolaTotaleOrdine()} €</h3>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cassa;
