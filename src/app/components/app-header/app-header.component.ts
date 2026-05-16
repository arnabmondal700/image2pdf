import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: true
})
export class AppHeaderComponent {
  title = 'Image to PDF Converter';
  subtitle = 'Convert images to PDF with ease';
}
