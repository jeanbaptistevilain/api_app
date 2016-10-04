import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {ExplorerService} from "../../services/explorer.service";

@Component({
  templateUrl: 'build/pages/list/list.html'
})
export class ListPage {

  constructor(public navCtrl: NavController, public explorerService: ExplorerService) {
    console.log("explorer service : " + this.explorerService.networkContext.root);
    console.log("explorer service : " + this.explorerService.networkData);
  }

  rootNodeChange(event): void {
    this.explorerService.navigateTo(event.context.root);
  }

  homeNode(): void {
    this.explorerService.navigateTo('root');
  }

  ionViewDidLeave(): void {
    this.navCtrl.pop();
  }
}