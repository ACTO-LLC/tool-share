import { Controller, Get, Route, Tags } from 'tsoa';

interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

@Route('health')
@Tags('Health')
export class HealthController extends Controller {
  @Get('/')
  public async getHealth(): Promise<HealthResponse> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
    };
  }
}
