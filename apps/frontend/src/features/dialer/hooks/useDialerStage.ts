"use client";

import { useRef, useState } from "react";
import type { DialerBlockData } from "@/features/dialer/data/dialer";

type LineState = "Aguardando" | "Chamando" | "Caixa postal" | "Sem resposta" | "ATENDEU";

const IDLE_LINES: LineState[] = ["Aguardando", "Aguardando", "Aguardando"];
const CALLING_LINES: LineState[] = ["Chamando", "Chamando", "Chamando"];

export function useDialerStage(block: DialerBlockData) {
  const [dialing, setDialing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lines, setLines] = useState<LineState[]>(IDLE_LINES);
  const [title, setTitle] = useState("Pronto para iniciar");
  const [subtitle, setSubtitle] = useState(
    "O sistema irá abrir até 3 linhas e conectar você ao primeiro atendimento humano."
  );
  const [pulse, setPulse] = useState("☎");
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }

  function startDial() {
    if (dialing) return;
    clearTimers();
    setDialing(true);
    setConnected(false);
    setLines(CALLING_LINES);
    setTitle("Discando 3 contatos em paralelo…");
    setSubtitle("Aguardando atendimento humano.");
    setPulse("···");

    timeouts.current.push(
      setTimeout(() => {
        setLines((prev) => ["Chamando", "Caixa postal", prev[2]]);
      }, 700)
    );
    timeouts.current.push(
      setTimeout(() => {
        setLines((prev) => [prev[0], prev[1], "Sem resposta"]);
      }, 1200)
    );
    timeouts.current.push(
      setTimeout(() => {
        setConnected(true);
        setLines((prev) => ["ATENDEU", prev[1], prev[2]]);
        setTitle(`Conectado com ${block.currentContact.name}`);
        setSubtitle(`${block.currentContact.account} · ${block.currentContact.role}`);
        setPulse(block.currentContact.initials);
      }, 1900)
    );
  }

  function stopDial() {
    clearTimers();
    setDialing(false);
    setConnected(false);
    setTitle("Bloco encerrado");
    setSubtitle("Você pode reiniciar quando quiser.");
    setPulse("☎");
    setLines(IDLE_LINES);
  }

  function handleOutcomeSaved() {
    setTitle("Preparando próxima tentativa…");
    setSubtitle("Interaction salva no histórico da Person.");
    timeouts.current.push(
      setTimeout(() => {
        setTitle("Discando 3 contatos em paralelo…");
        setSubtitle("Aguardando atendimento humano.");
        setLines(CALLING_LINES);
        setPulse("···");
      }, 900)
    );
  }

  return {
    dialing,
    connected,
    lines,
    title,
    subtitle,
    pulse,
    startDial,
    stopDial,
    handleOutcomeSaved,
  };
}
