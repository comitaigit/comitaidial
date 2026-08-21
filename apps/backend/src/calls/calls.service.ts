import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class CallsService {
  private readonly client: Twilio.Twilio;
  private readonly fromNumber: string;

  constructor(private readonly config: ConfigService) {
    this.client = Twilio(
      this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID'),
      this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
    );
    this.fromNumber = this.config.getOrThrow<string>('TWILIO_PHONE_NUMBER');
  }

  // Places a real outbound call that speaks a confirmation message —
  // exists to prove the Twilio credentials/caller ID work end to end
  // before any real dialer logic is built on top of them.
  async placeTestCall(to: string): Promise<{ sid: string }> {
    const call = await this.client.calls.create({
      to,
      from: this.fromNumber,
      twiml:
        '<Response><Say language="pt-BR">Teste de chamada do Comitai Dialer realizado com sucesso.</Say></Response>',
    });
    return { sid: call.sid };
  }
}
