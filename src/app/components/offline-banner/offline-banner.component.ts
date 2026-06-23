import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineService } from '../../services/offline.service';

@Component({
  selector: 'app-offline-banner',
  templateUrl: './offline-banner.component.html',
  styleUrls: ['./offline-banner.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class OfflineBannerComponent {
  private readonly offline = inject(OfflineService);

  readonly isOnline = this.offline.isOnline.asReadonly();
}
