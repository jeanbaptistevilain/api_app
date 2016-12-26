import {Component} from '@angular/core';
import {NavParams, NavController, ModalController, ToastController} from 'ionic-angular';
import {Seed} from "../../components/seed.model";
import {SeedType} from "./seed-type";
import {DataService} from "../../providers/data.service";
import {ExplorerService} from "../../providers/explorer.service";
import {SearchSeeds} from "./search-seeds";

@Component({
  templateUrl: 'form.html'
})
export class FormPage {

  public node: Seed;

  constructor(private navCtrl: NavController, private params: NavParams, public modalCtrl: ModalController,
              public dataService: DataService, private explorerService: ExplorerService,
              private toastCtrl: ToastController) {
    this.node = params.get('node') || new Seed({}, false, false);
  }

  dismissForm(): void {
    this.refreshContext(() => {
      this.navCtrl.pop();
    });
  }

  submitForm(): void {
    this.dataService.saveNode(this.node).subscribe(data => {
      this.presentToast("La graine a été enregistrée.", () => {this.dismissForm();});
    }, error => {
      this.presentToast("Une erreur est survenue pendant l'enregistrement de la graine.", () => {});
      console.log("submit error : " + JSON.stringify(error))
    });
  }

  seedTypes(): void {
    let typesModal = this.modalCtrl.create(SeedType, {type: this.node.category});
    typesModal.onDidDismiss(data => {
      this.node.category = data.type;
    });
    typesModal.present();
  }

  addSeed(): void {
    let seedsModal = this.modalCtrl.create(SearchSeeds, {type: this.node.category});
    seedsModal.onDidDismiss(data => {
      this.node.seeds.push(data.seed);
    });
    seedsModal.present();
  }

  addUrl(): void {
    this.node.urls.push({value: 'http://'});
  }

  presentToast(msg, onDismiss) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 4000,
      position: "middle",
      showCloseButton: true,
      closeButtonText: "Fermer"
    });
    toast.onDidDismiss(onDismiss);
    toast.present();
  }

  refreshContext(onComplete): void {
    this.explorerService.exploreGraph(false, onComplete);
  }
}