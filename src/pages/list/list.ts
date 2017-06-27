import {Component, ViewChild} from '@angular/core';
import {NavController, Content, NavParams, Platform, IonicPage} from 'ionic-angular';
import {ExplorerService} from "../../providers/explorer.service";
import {SearchService} from "../../providers/search.service";
import {DataService} from "../../providers/data.service";
import {SeedsService} from "../../providers/seeds.service";

@IonicPage({
  segment: 'liste'
})
@Component({
  templateUrl: 'list.html'
})
export class ListPage {
  @ViewChild(Content) content: Content;

  constructor(public navCtrl: NavController, private navParams: NavParams, public searchService: SearchService,
              public explorerService: ExplorerService, public dataService: SeedsService, private platform: Platform) {
  }

  ionViewDidEnter(): void {
    this.registerBack();
    let seedId = this.navParams.get('id');
    if(seedId) {
      this.explorerService.navigateTo(seedId, false);
    }
  }

  navigateTo(node, showGraph, reset): void {
    if(showGraph) {
      this.explorerService.navigateTo(node, reset, () => {
        this.navCtrl.parent.select(0);
      });
    } else {
      this.explorerService.navigateTo(node, reset, () => {this.content.resize();});
    }
  }

  displaySearch() {
    this.navCtrl.push('SearchPage');
  }

  registerBack() {
    this.platform.ready().then(() => {
      this.platform.registerBackButtonAction(() => {
        if (this.navCtrl.canGoBack()) {
          this.navCtrl.pop();
        } else {
          let prevNode = this.explorerService.previousNode();
          if(prevNode) {
            this.explorerService.navigateTo(prevNode, false, () => this.content.resize());
          }
        }
      }, 100);
    });
  }
}
