import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpdateService } from '../../services/update.service';

@Component({
  selector: 'app-update-notification',
  templateUrl: './update-notification.component.html',
  styleUrls: ['./update-notification.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class UpdateNotificationComponent {
  private readonly updates = inject(UpdateService);

  readonly hasUpdate = this.updates.updateAvailable.asReadonly();

  refresh(): void {
    this.updates.activateUpdate();
  }
}