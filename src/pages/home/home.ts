import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { Coordinates, Geolocation } from '@ionic-native/geolocation';
import { AndroidPermissions } from '@ionic-native/android-permissions';
//import { Geofence } from '@ionic-native/geofence';
import { Subscription } from 'rxjs/Subscription';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage';
import { polylineConfig, distanceConfig } from "../../app/geofenceConfig"
 
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

  positionSubscription: Subscription;
  location: Coordinates;
 
  constructor(public navCtrl: NavController, private plt: Platform, private geolocation: Geolocation, 
              private storage: Storage, private androidPermissions:AndroidPermissions
              ) { 
               //this.storage.clear();
              }
 
  ionViewDidLoad() {
    //console.log(this.getDistanceFromLatLon(13.7344093,100.3283594,13.7544093,100.3283594));
    
    this.plt.ready().then(() => {
      //alert("plt load");
      // this.geofence.initialize().then(
      //   // resolved promise does not return a value
      //   () => console.log('Geofence Plugin Ready'),
      //   (err) => console.log("error " + err)
      // )

      // this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION).then(
      //   result => console.log('Has permission ACCESS_COARSE_LOCATION?',result.hasPermission),
      //   err => this.androidPermissions.requestPermission("error" + this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION)
      // );

      // this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION).then(
      //   result => console.log('Has permission ACCESS_FINE_LOCATION?',result.hasPermission),
      //   err => this.androidPermissions.requestPermission("error" + this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION)
      // );

      // this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_LOCATION_EXTRA_COMMANDS).then(
      //   result => console.log('Has permission ACCESS_LOCATION_EXTRA_COMMANDS?', result.hasPermission),
      //   err => this.androidPermissions.requestPermission("error" + this.androidPermissions.PERMISSION.ACCESS_LOCATION_EXTRA_COMMANDS)
      // );

      this.loadHistoricRoutes();
 
      this.get_current_position();
 
      
    });
  }

  // async getLocation() {
  //   await this.platform.ready();
  //   const { coords } = await this.geolocation.getCurrentPosition();
  //   this.location = coords;
  // }

  async get_current_position() {
    

    let mapOptions = {
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    };
    let option = {
      timeout:5000
    };

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    // this.map.setCenter({ lat: 13.7344093, lng: 100.3283594 });
    // this.map.setZoom(16);
    alert("OK1");

    this.geolocation.getCurrentPosition(option).then(pos => {
      let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      this.map.setCenter(latLng);
      this.map.setZoom(16);
      //this.addGeofence(pos);
      alert("OK2");
    }).catch((error) => {
      console.log('Error getting location', error);
      alert("ERROR : " +JSON.stringify(error));
      alert("ERROR : " +error);
    });
  }

  clearHistory() {
    this.storage.clear();
    this.previousTracks = [];
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

    //
    let previouslat = 0;
    let previouslong = 0;
    let previousDist= 0;
    let dist= 0;
    //let previousTime = 0;
    let currentTime = Date.now();
    //let clock;
    
   
    // let rlat;
    // let rlng;
 
    this.positionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter((p) => p.coords !== undefined) //Filter Out Errors
      )
      .subscribe(data => {
        setTimeout(() => {

          if(previouslat == 0){
            previouslat = data.coords.latitude;
          }
          if(previouslong == 0){
            previouslong = data.coords.longitude;
          }
          
          dist = this.getDistanceFromLatLon(previouslat, previouslong, data.coords.latitude, data.coords.longitude);

          currentTime = Date.now();

          console.log("currentTime " + currentTime);

          this.trackedRoute.push({  lat: data.coords.latitude, 
                                    lng: data.coords.longitude, 
                                    timestamp: currentTime, 
                                    distanceForPreviousToCurrent: dist, 
                                    //timeForPreviousToCurrent: clock,
                                    totalDistance: previousDist + dist});
          previouslat = data.coords.latitude;
          previouslong = data.coords.longitude;
          //previousTime = currentTime;
          previousDist = previousDist + dist;
          console.log("previousDist " + previousDist);

          console.log("new locaton");
          this.redrawPath(this.trackedRoute);
          //this.addGeofence(data);
        }, 0);
      });
    
  }

  getDistanceFromLatLon(lat1,lon1,lat2,lon2){

    let R; // Radius of the earth in km
    let dLat = this.deg2rad(lat2-lat1);  // deg2rad below
    let dLon = this.deg2rad(lon2-lon1); 
    let a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    if (distanceConfig.unit =="M") { R = 3958.75587; }
    if (distanceConfig.unit =="K") { R = 6371; }
    if (distanceConfig.unit =="N") { R = 3437.78359; }
    let d = R * c; // Distance in km
    return d;
   }


   deg2rad(deg) {
    return deg * (Math.PI/180)
   }
 
  redrawPath(path) {
    //console.log("path "+ path[0].lat);
    if (this.currentMapTrack) {
      this.currentMapTrack.setMap(null);
      //console.log("test null");
    }
 
    if (path.length > 1) {
      //console.log("test path");
      this.currentMapTrack = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: polylineConfig.strokeColor,
        strokeOpacity: polylineConfig.strokeOpacity,
        strokeWeight: polylineConfig.strokeWeight
      });
      this.currentMapTrack.setMap(this.map);
    }
  }

  stopTracking() {
    let totalDist = this.trackedRoute[this.trackedRoute.length-1].totalDistance;
    totalDist = totalDist.toFixed(3)
    let timer = Date.now() - this.trackedRoute[0].timestamp;
    
    if (distanceConfig.timeUnit =="H") { timer = timer / 3600000; }
    if (distanceConfig.timeUnit =="m") { timer = timer / 60000; }
    if (distanceConfig.timeUnit =="s") { timer = timer / 1000; }
    
    console.log("totalDist " + totalDist);
    console.log("timer " + timer);


    let newRoute = { finished: new Date().getTime(), path: this.trackedRoute, Distance: totalDist,  time: timer};
    this.previousTracks.push(newRoute);
    this.storage.set('routes', this.previousTracks);
   
    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    this.currentMapTrack.setMap(null);
    //this.currentMapTrack = null;
  }
   
  showHistoryRoute(route) {
    this.redrawPath(route);
  }

  // private addGeofence(data) {
  //   //options describing geofence
  //   console.log( "latitude: " + data.coords.latitude);
  //   console.log( "longitude: " + data.coords.longitude);

  //   let fence = {
  //     id: '69ca1b88-6fbe-4e80-a4d4-ff4d3748acdb', //any unique ID
  //     latitude:       data.coords.latitude, //center of geofence radius
  //     longitude:      data.coords.longitude, //center of geofence radius
  //     radius:         geofenceConfig.radius, //radius to edge of geofence in meters
  //     transitionType: geofenceConfig.transitionType, //Type of transition 1 - Enter, 2 - Exit, 3 - Both
  //     notification: { //notification settings
  //         id:             1, //any unique ID
  //         title:          'You crossed a fence', //notification title
  //         text:           'You just arrived to Gliwice city center.', //notification body
  //         openAppOnClick: true //open app when notification is tapped
  //     }
  //   }
  
  //   this.geofence.addOrUpdate(fence).then(() => 
  //       console.log('Geofence added'),
  //       (err) => console.log('Geofence failed to add : '+ err)
  //   );
    
  // }
}