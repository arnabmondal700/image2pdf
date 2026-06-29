import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config.server';
import { App } from './app/app';

export default function (req: Request, res: Response) {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}