import { BaseService } from '../../services/base.service';
import { Track } from '../../types/spotify/track';

export class TrackService extends BaseService {
  async getTrack(id: string, market?: string): Promise<Track> {
    return this.request<Track>('get', `/tracks/${id}`, {
      params: { market }
    });
  }
}