import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepgramClient } from '@deepgram/sdk';
import { PrismaService } from '../prisma/prisma.service';

export type TranscriptUtterance = {
  speaker: number;
  text: string;
  start: number;
  end: number;
};

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly deepgram: DeepgramClient;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.deepgram = new DeepgramClient({
      apiKey: this.config.getOrThrow<string>('DEEPGRAM_API_KEY'),
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
    } catch (err) {
      this.logger.error(
        `Transcription failed for call ${callId}: ${err instanceof Error ? err.message : err}`,
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
