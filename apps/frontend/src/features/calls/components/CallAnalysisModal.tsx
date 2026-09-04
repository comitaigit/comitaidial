import { Tag } from "@/components/ui/Tag";
import type { Call } from "@/features/calls/data/calls-api";

const SPEAKER_LABEL: Record<number, string> = {
  0: "Vendedor",
  1: "Prospect",
};

function speakerLabel(speaker: number): string {
  return SPEAKER_LABEL[speaker] ?? `Locutor ${speaker}`;
}

export function CallAnalysisModal({ call }: { call: Call }) {
  const hasRecording = Boolean(call.recordingUrl);
  const hasTranscript = Boolean(call.transcript && call.transcript.length > 0);
  const belowFeedbackThreshold = (call.durationSeconds ?? 0) < 60;

  return (
    <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Transcrição</h3>
        {!hasRecording && (
          <p className="text-sm text-muted">Esta ligação não tem gravação associada.</p>
        )}
        {hasRecording && !hasTranscript && (
          <p className="text-sm text-muted">
            Gravação recebida — a transcrição ainda está sendo processada. Atualize a página em
            alguns instantes.
          </p>
        )}
        {hasTranscript && (
          <div className="flex flex-col gap-2">
            {call.transcript!.map((utterance, i) => (
              <p key={i} className="text-sm">
                <span className="font-semibold text-foreground">
                  {speakerLabel(utterance.speaker)}:
                </span>{" "}
                <span className="text-[#20242b]">{utterance.text}</span>
              </p>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">AI Sales Coach</h3>
        {belowFeedbackThreshold && (
          <p className="text-sm text-muted">
            Ligações com menos de 1 minuto conectado não recebem análise do AI Sales Coach.
          </p>
        )}
        {!belowFeedbackThreshold && !call.aiFeedback && (
          <p className="text-sm text-muted">
            {hasTranscript
              ? "Análise ainda sendo gerada — atualize a página em alguns instantes."
              : "A análise é gerada assim que a transcrição estiver pronta."}
          </p>
        )}
        {call.aiFeedback && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#20242b]">{call.aiFeedback.context}</p>
            <div>
              <Tag variant="ok">Pontos positivos</Tag>
              <ul className="mt-2 list-disc pl-5 text-sm text-[#20242b]">
                {call.aiFeedback.positives.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
            <div>
              <Tag variant="warn">Pontos de melhoria</Tag>
              <ul className="mt-2 list-disc pl-5 text-sm text-[#20242b]">
                {call.aiFeedback.improvements.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
