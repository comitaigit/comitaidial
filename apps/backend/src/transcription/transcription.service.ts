import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepgramClient } from '@deepgram/sdk';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

export type TranscriptUtterance = {
  speaker: number;
  text: string;
  start: number;
  end: number;
};

// AI Sales Coach feedback shape — see the schema comment on Call.aiFeedback.
export type AiFeedback = {
  context: string;
  positives: string[];
  improvements: string[];
};

// Calls under a minute never get a Sales Coach review — see the Dial spec
// and the schema comment on Call.aiFeedback. Same threshold name would
// collide with calls.service.ts's own MIN_CONVERSATION_SECONDS import if
// shared, so it's kept local and equal (30s "real conversation" is a
// separate, lower bar than the 60s "worth coaching" bar).
const MIN_FEEDBACK_SECONDS = 60;

function extractJson(text: string): Record<string, unknown> {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  try {
    const parsed: unknown = JSON.parse(candidate);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly deepgram: DeepgramClient;
  private readonly anthropic: Anthropic;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.deepgram = new DeepgramClient({
      apiKey: this.config.getOrThrow<string>('DEEPGRAM_API_KEY'),
    });
    this.anthropic = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  // Downloads the finished Twilio recording and sends it to Deepgram for
  // diarized transcription, then persists the result on the Call. Called
  // fire-and-forget from the recording-status webhook — a transcription
  // failure must never fail that webhook response.
  async transcribeCall(callId: string, recordingUrl: string): Promise<void> {
    try {
      const audio = await this.downloadRecording(recordingUrl);

      const response = await this.deepgram.listen.v1.media.transcribeFile(
        audio,
        {
          model: 'nova-3',
          // BCP-47 tag — Comitai Dialer's calls are in Brazilian Portuguese.
          // Verify actual recognition quality against a real call once this
          // ships; nova-3's pt-BR support hasn't been checked against Deepgram's
          // own docs (blocked from this sandbox), only against the SDK's types.
          language: 'pt-BR',
          punctuate: true,
          smart_format: true,
          diarize: true,
          paragraphs: true,
        },
      );

      const transcript = this.buildUtterances(response);

      await this.prisma.call.update({
        where: { id: callId },
        data: { transcript },
      });

      void this.maybeGenerateFeedback(callId);
    } catch (err) {
      this.logger.error(
        `Transcription failed for call ${callId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // AI Sales Coach feedback needs both the transcript (this method, or
  // async from Deepgram) and durationSeconds (BDR-recorded at outcome time)
  // — whichever lands second calls this, so it's safe (and expected) to call
  // it from both places. No-ops until both conditions hold, and never
  // regenerates once aiFeedback is set.
  async maybeGenerateFeedback(callId: string): Promise<void> {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call || call.aiFeedback !== null) return;
    if (
      call.durationSeconds === null ||
      call.durationSeconds < MIN_FEEDBACK_SECONDS
    )
      return;

    const transcript = call.transcript as unknown as Array<{
      speaker: number;
      text: string;
    }> | null;
    if (!transcript || transcript.length === 0) return;

    try {
      const transcriptText = transcript
        .map((u) => `Locutor ${u.speaker}: ${u.text}`)
        .join('\n');

      const prompt = `Você é um coach de vendas B2B. Abaixo está a transcrição
diarizada de uma ligação de prospecção outbound (Locutor 0 costuma ser o
vendedor, mas confirme pelo conteúdo). Analise a condução da ligação pelo
vendedor.

Transcrição:
${transcriptText}

Responda em JSON, em português, com este formato exato:
{
  "context": "resumo de 1-2 frases do que foi discutido e o resultado",
  "positives": ["ponto positivo 1", "ponto positivo 2"],
  "improvements": ["ponto de melhoria 1", "ponto de melhoria 2"]
}
"positives" e "improvements" devem ter 2-3 itens cada, focados em técnica de
vendas (descoberta de necessidade, tratamento de objeções, próximos passos).
Responda apenas com o JSON.`;

      const message = await this.anthropic.messages.create({
        model: 'claude-opus-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = message.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text',
      );
      const json = extractJson(textBlock?.text?.trim() ?? '{}');

      const feedback: AiFeedback = {
        context: typeof json.context === 'string' ? json.context : '',
        positives: Array.isArray(json.positives)
          ? json.positives.filter((v): v is string => typeof v === 'string')
          : [],
        improvements: Array.isArray(json.improvements)
          ? json.improvements.filter((v): v is string => typeof v === 'string')
          : [],
      };

      await this.prisma.call.update({
        where: { id: callId },
        data: { aiFeedback: feedback },
      });
    } catch (err) {
      this.logger.error(
        `AI feedback generation failed for call ${callId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // Twilio recording URLs require Twilio Basic Auth to download — fetch the
  // audio ourselves rather than handing Deepgram a URL it can't authenticate
  // against, and rather than sharing Twilio credentials with a third party.
  private async downloadRecording(recordingUrl: string): Promise<Buffer> {
    const accountSid = this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN');
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    // .mp3 gets a compressed download; the bare URL serves a much larger wav.
    const res = await fetch(`${recordingUrl}.mp3`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to download recording (${res.status}).`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  // Deepgram's batch response groups diarized speech into
  // results.channels[0].alternatives[0].paragraphs.paragraphs[], each
  // carrying its own speaker number — a cleaner source for utterances than
  // grouping word-by-word ourselves. Falls back to one unlabeled utterance
  // from the flat transcript if paragraphs weren't returned.
  private buildUtterances(response: unknown): TranscriptUtterance[] {
    const alternative = (
      response as {
        results?: {
          channels?: Array<{
            alternatives?: Array<{
              transcript?: string;
              paragraphs?: {
                paragraphs?: Array<{
                  speaker?: number;
                  start?: number;
                  end?: number;
                  sentences?: Array<{ text?: string }>;
                }>;
              };
            }>;
          }>;
        };
      }
    )?.results?.channels?.[0]?.alternatives?.[0];

    const paragraphs = alternative?.paragraphs?.paragraphs;
    if (paragraphs && paragraphs.length > 0) {
      return paragraphs.map((p) => ({
        speaker: p.speaker ?? 0,
        text: (p.sentences ?? [])
          .map((s) => s.text ?? '')
          .join(' ')
          .trim(),
        start: p.start ?? 0,
        end: p.end ?? 0,
      }));
    }

    if (alternative?.transcript) {
      return [{ speaker: 0, text: alternative.transcript, start: 0, end: 0 }];
    }

    return [];
  }
}
