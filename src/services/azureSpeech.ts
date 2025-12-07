import * as speechSdk from "microsoft-cognitiveservices-speech-sdk";
import { backOff } from "exponential-backoff";
import { Buffer } from "node:buffer";
import { mockTranscriptions } from "../helpers/constant.js";
import { AzureTranscriptionResult } from "../types/azureTranscription.js";

export class AzureSpeechService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private key = process.env.AZURE_SPEECH_KEY || "";
  private region = process.env.AZURE_SPEECH_REGION || "eastus";

  // ********************************************************************* //
  // Mock download srvice with retry logic //
  // ********************************************************************* //

  async downloadAudio(url: string, attempt = 1): Promise<Buffer> {
    try {
      console.log(
        `Attempting to download audio from ${url} (attempt ${attempt})`
      );

      // Simulate download with random failure for demonstration
      const shouldFail = Math.random() < 0.3 && attempt < this.MAX_RETRIES;

      if (shouldFail) {
        throw new Error("Download failed");
      }

      // Mock successful download - return dummy buffer
      return Buffer.from("mock-audio-data");
    } catch (error) {
      if (attempt < this.MAX_RETRIES) {
        console.log(
          `Download failed, retrying... (${attempt}/${this.MAX_RETRIES})`
        );
        await this.fakeDelay(this.RETRY_DELAY * attempt);
        return this.downloadAudio(url, attempt + 1);
      }
      throw new Error(
        `Failed to download audio after ${this.MAX_RETRIES} attempts`
      );
    }
  }

  // ********************************************************************* //
  // Mock transcription service //
  // ********************************************************************* //

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    // Simulate processing time
    await this.fakeDelay(200);
    return "This is a transcribed text from the audio file. The content has been successfully processed.";
  }

  // ********************************************************************* //
  // Main Azure Speech-to-Text method //
  // ********************************************************************* //

  async transcribe(
    audioUrl: string,
    locale: string = "en-US"
  ): Promise<AzureTranscriptionResult> {
    // MOCK MODE: instantly return realistic mock
    if (
      !this.key ||
      this.key.length < 10 ||
      this.key.includes("")
    ) {
      console.log("Azure Speech: No valid key → using MOCK mode");

      const transcription = mockTranscriptions[locale] || mockTranscriptions["en-US"]

      await this.fakeDelay(1500);
      return {
        success: true,
        transcription: transcription
      };
    }

    // REAL AZURE MODE
    return await this.transcribeWithRealAzure(audioUrl, locale);
  }

private async transcribeWithRealAzure(audioUrl: string, locale: string): Promise<AzureTranscriptionResult> {
  return backOff(
    async () => {
      const speechConfig = speechSdk.SpeechConfig.fromSubscription(this.key, this.region);
      speechConfig.speechRecognitionLanguage = locale;

      const pushStream = speechSdk.AudioInputStream.createPushStream();
      const arrayBuffer = await this.downloadAudioBuffer(audioUrl);
      const audioBytes = new Uint8Array(arrayBuffer as ArrayBuffer);
      const audioArrayBuffer = audioBytes.buffer.slice(
        audioBytes.byteOffset,
        audioBytes.byteOffset + audioBytes.byteLength
      );

      pushStream.write(audioArrayBuffer);
      pushStream.close();

      // Azure SDK pattern: fromStreamInput + AudioConfig
      const audioConfig = speechSdk.AudioConfig.fromStreamInput(pushStream);
      const recognizer = new speechSdk.SpeechRecognizer(speechConfig, audioConfig);

      return new Promise<AzureTranscriptionResult>((resolve) => {
        let fullText = '';

        recognizer.recognized = (_s, e) => {
          if (e.result.reason === speechSdk.ResultReason.RecognizedSpeech) {
            fullText += e.result.text + ' ';
          }
        };

        recognizer.canceled = (_s, e) => {
          recognizer.stopContinuousRecognitionAsync();
          resolve({ success: false, error: e.errorDetails || 'Recognition canceled' });
        };

        recognizer.sessionStopped = () => {
          recognizer.stopContinuousRecognitionAsync();
          resolve({
            success: true,
            transcription: fullText.trim() || '(No speech detected)',
          });
        };

        recognizer.startContinuousRecognitionAsync();

        // 30-second safety timeout
        setTimeout(() => {
          recognizer.stopContinuousRecognitionAsync();
          if (!fullText) {
            resolve({ success: false, error: 'Azure transcription timeout (30s)' });
          }
        }, 30_000);
      });
    },
    {
      jitter: 'full',
      numOfAttempts: 4,
      startingDelay: 1000,
      timeMultiple: 2,
      retry: (e, attempt) => {
        console.log(`Azure retry ${attempt}/4:`, e.message);
        return true;
      },
    }
  ).catch((err: any) => ({
    success: false,
    error: err?.message || 'Unknown Azure error',
  }));
}

  // Fake delay to simulate network
  private fakeDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Actually downloads the file from the URL
  private async downloadAudioBuffer(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to download audio");
    return await response.arrayBuffer();
  }
}

export const azureSpeechService = new AzureSpeechService();
