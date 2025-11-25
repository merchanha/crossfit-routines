import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly apiKey: string | null;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY') || null;

    if (!this.apiKey) {
      this.logger.warn(
        '⚠️  YouTube API key not configured. Video search will not work.',
      );
    } else {
      this.logger.log('✅ YouTube service initialized');
    }
  }

  /**
   * Searches for a relevant YouTube video based on workout keywords.
   * @param keywords Array of keywords to search for
   * @param maxResults Maximum number of results to return (default: 1)
   * @returns The URL of the most relevant video, or null if not found
   */
  async searchVideo(
    keywords: string[],
    maxResults: number = 1,
  ): Promise<string | null> {
    if (!this.apiKey) {
      this.logger.warn('YouTube API key not configured, skipping video search');
      return null;
    }

    try {
      // Build search query from keywords
      const query = keywords
        .filter((k) => k && k.trim().length > 0)
        .join(' ')
        .trim();

      if (!query) {
        this.logger.warn('No valid keywords provided for YouTube search');
        return null;
      }

      // Add fitness/workout context to improve relevance
      const searchQuery = `${query} crossfit workout exercise`;

      this.logger.debug(`Searching YouTube for: ${searchQuery}`);

      // Make API request to YouTube Data API v3
      const url = new URL(`${this.baseUrl}/search`);
      url.searchParams.append('part', 'snippet');
      url.searchParams.append('q', searchQuery);
      url.searchParams.append('type', 'video');
      url.searchParams.append('maxResults', maxResults.toString());
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('videoCategoryId', '17'); // Sports category
      url.searchParams.append('order', 'relevance');

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `YouTube API error: ${response.status} - ${errorText}`,
        );
        return null;
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        this.logger.warn(`No YouTube videos found for query: ${searchQuery}`);
        return null;
      }

      const videoId = data.items[0].id.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      this.logger.log(`✅ Found YouTube video: ${videoUrl}`);
      return videoUrl;
    } catch (error) {
      this.logger.error(`Failed to search YouTube: ${error.message}`, error);
      return null;
    }
  }

  /**
   * Searches for a video based on routine name and exercise keywords.
   * @param routineName Name of the routine
   * @param exerciseNames Array of exercise names
   * @returns The URL of the most relevant video
   */
  async searchVideoForRoutine(
    routineName: string,
    exerciseNames: string[] = [],
  ): Promise<string | null> {
    const keywords: string[] = [];

    // Add routine name as primary keyword
    if (routineName) {
      keywords.push(routineName);
    }

    // Add first 2-3 exercise names as additional keywords
    if (exerciseNames && exerciseNames.length > 0) {
      keywords.push(...exerciseNames.slice(0, 3));
    }

    return this.searchVideo(keywords);
  }
}
