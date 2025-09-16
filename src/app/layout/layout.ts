import { Component } from '@angular/core';
import { Sidebar } from "../sidebar/sidebar";
import { AppRoutingModule } from "../app.routes";

@Component({
  selector: 'app-layout',
  imports: [Sidebar, AppRoutingModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class LayoutComponent {

}
