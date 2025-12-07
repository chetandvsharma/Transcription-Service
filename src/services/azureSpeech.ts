export class AudioService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

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
        await this.delay(this.RETRY_DELAY * attempt);
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
    await this.delay(100);
    return "This is a transcribed text from the audio file. The content has been successfully processed.";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
