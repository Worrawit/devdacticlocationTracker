import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { Geolocation, PositionError, Geoposition } from '@ionic-native/geolocation';
import { Subscription } from 'rxjs/Subscription';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage';
 
declare var google;
 
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('map') mapElement: ElementRef;
  map: any;
  currentMapTrack = null;
 
  isTracking = false;
  trackedRoute = [];
  previousTracks = [];
  geoLoc : any;
  /*
  previousTracks = [{ lat: "13.7342864", lng:"100.3291369" },
                    { lat: "13.7342864", lng:"100.3291379" },
                    { lat: "13.7342864", lng:"100.3291389" },
                    { lat: "13.7342864", lng:"100.3291399" },
                    { lat: "13.7342864", lng:"100.3291409" },
                    { lat: "13.7342864", lng:"100.3291419" },
                    { lat: "13.7342864", lng:"100.3291429" },
                    { lat: "13.7342864", lng:"100.3291439" },
                    { lat: "13.7342864", lng:"100.3291449" },
                    { lat: "13.7342864", lng:"100.3291459" },
                    { lat: "13.7342864", lng:"100.3291469" }];
                    */
 
  positionSubscription: Subscription;
 
  constructor(public navCtrl: NavController, private plt: Platform, private geolocation: Geolocation, private storage: Storage) { }
 
  ionViewDidLoad() {
    this.plt.ready().then(() => {
      this.loadHistoricRoutes();
 
      let mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
 
      this.geolocation.getCurrentPosition().then(pos => {
        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        this.map.setZoom(16);
        console.log("lat : " + pos.coords.latitude);
        console.log("long : " + pos.coords.longitude);
        console.log("latLng : " + latLng);
      }).catch((error) => {
        console.log('Error getting location', error);
      });
    });
  }
 
  loadHistoricRoutes() {
    this.storage.get('routes').then(data => {
      if (data) {
        this.previousTracks = data;
      }
    });
  }

  startTracking() {
    this.isTracking = true;
    this.trackedRoute = [];
 
    this.positionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter((p) => p.coords !== undefined) //Filter Out Errors
      )
      .subscribe(data => {
        setTimeout(() => {
          console.log("data " + data);
          console.log("lat : " + data.coords.latitude);
          console.log("lat : " + data.coords.longitude);
          this.trackedRoute.push({ lat: data.coords.latitude, lng: data.coords.longitude });
          this.trackedRoute.push({ lat: data.coords.latitude + 0.0003, lng: data.coords.longitude + 0.0003});
          this.trackedRoute.push({ lat: data.coords.latitude - 0.0003, lng: data.coords.longitude});
          this.redrawPath(this.trackedRoute);
        }, 0);
      });
    
  }

  
 
  redrawPath(path) {
    //console.log("path "+ path[0].lat);
    if (this.currentMapTrack) {
      this.currentMapTrack.setMap(null);
      console.log("test null");
    }
 
    if (path.length > 1) {
      console.log("test path");
      this.currentMapTrack = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#ff0000',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
      this.currentMapTrack.setMap(this.map);
    }
  }

  stopTracking() {
    let newRoute = { finished: new Date().getTime(), path: this.trackedRoute };
    this.previousTracks.push(newRoute);
    this.storage.set('routes', this.previousTracks);
   
    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    this.currentMapTrack.setMap(null);
  }
   
  showHistoryRoute(route) {
    this.redrawPath(route);
  }
}