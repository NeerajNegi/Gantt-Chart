import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { ChartComponent } from './chart/chart.component';
import { ChartNewComponent } from './chart-new/chart-new.component';


@NgModule({
  declarations: [
    AppComponent,
    ChartComponent,
    ChartNewComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
