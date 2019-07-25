<template>
  <div class="wrapper">
    <div class="row">
      <div class="column-30">

        <label>
          <input id="checkbox" type="checkbox" v-model="useMockedApi">Use Mocked Api
        </label>

        <br>
        
        <div class="search-wrapper">
          <div>Starting Location</div>
          <label>
            <gmap-autocomplete
              :value="originDescription"
              @place_changed="setOrigin">
            </gmap-autocomplete>
            <button @click="emptyOrigin">X</button>
          </label>
        </div>

        <div class="search-wrapper">
          <div>Drop off point</div>
          <label>
            <gmap-autocomplete
              :value="destinationDescription"
              @place_changed="setDestination">
            </gmap-autocomplete>
            <button @click="emptyDestination">X</button>
          </label>
        </div>

        <div>
          <label v-show="totalDistance">total distance: {{ totalDistance }}</label>
        </div>
        <div>
          <label v-show="totalTime">total time: {{ totalTime }}</label>
        </div>
        <div class="error-wrapper">
          <span v-show="errorMessage">{{ errorMessage }}</span>
        </div>
        <div class="button wrapper" v-show="showButtons">
          <input type="button" value="Submit" v-show="showSubmitButton" @click="getDrivingRoute" :disabled="isLoading">
          <input type="button" value="Re-Submit" v-show="showResubmitButton" @click="getDrivingRoute" :disabled="isLoading">
          <input type="button" value="Reset" @click="reset" :disabled="isLoading">
        </div>
      </div>

      <div class="column-70">
        <gmap-map
          ref="tanoMap"
          :center="center"
          :zoom="12"
          style="width:100%;  height: 100%;" 
        >
        </gmap-map>
      </div>

    </div>
  </div>
</template>

<script>
  import {axios} from './plugins/axios'
  import {get} from 'lodash'
  
  const DEFAULT_ERROR_MESSAGE = 'Something unexpected happened'
  const STATUS_SUCCESS = 'success'
  const STATUS_FAILURE = 'failure'
  const STATUS_IN_PROGRESS = 'in progress'

  export default {
    name: "App",
    data() {
      return {
        center: { lat: 45.508, lng: -73.587 },
        places: [],
        currentPlace: null,
        directionsService: null,
        directionsDisplay: null,
        origin: '',
        destination: '',
        waypoints: '',
        originDescription: '',
        destinationDescription: '',
        errorMessage: '',
        totalDistance: '',
        totalTime: '',
        useMockedApi: true,
        isSubmitted: false,
        isLoading: false,
      }
    },
    computed:{
      showSubmitButton() {
        return !this.isSubmitted
      },
      showResubmitButton() {
        return this.isSubmitted
      },
      showButtons() {
        return this.useMockedApi
      }
    },
    watch: {
      origin() {
        this.autoGetDrivingRoute()
      },
      destination() {
        this.autoGetDrivingRoute()
      },
      useMockedApi(val) {
        this.reset()
      }
    },
    mounted() {
      this.geolocate()
    },
    methods: {
      autoGetDrivingRoute(){
        if(this.useMockedApi){
          return
        }
        this.waypoints = ''
        this.getDrivingRoute()
      },
      toLatLng(latLng){
        return {
          lat: JSON.parse(get(latLng, '0', '')),
          lng: JSON.parse(get(latLng, '1', ''))
        }
      },
      reset(){
        this.isSubmitted = false
        this.emptyError()
        this.emptyOrigin()
        this.emptyDestination()
        this.emptyTotalDistance()
        this.emptyTotalTime()
        this.geolocate()
      },
      emptyRouteToken(){
        this.routeToken = ''
      },
      emptyError(){
        this.errorMessage = ''
      },
      emptyTotalDistance() {
        this.totalDistance = ''
      },
      emptyTotalTime(){
        this.totalTime = ''
      },
      emptyOrigin() {
        this.originDescription = ''
        this.origin = ''
      },
      emptyDestination() {
        this.destinationDescription = ''
        this.destination = ''
      },
      setOrigin(place) {
        this.originDescription = place.formatted_address
        this.origin = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }
      },
      setDestination(place) {
        this.destinationDescription = place.formatted_address
        this.destination = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }
      },
      setErrorMessage(error) {
        this.emptyTotalDistance()
        this.emptyTotalTime()
        this.errorMessage = error
      },
      clearErrorMessage(error) {
        this.setErrorMessage('')
      },
      setWayPoints(coordinates){
        if(!coordinates) {
          return
        }
        this.waypoints = coordinates.slice(1, coordinates.length-1).map((item) => {
          return { location: this.toLatLng(item) }
        })
      },
      setDrivingRouteCoordinates(coordinates) {
        this.setWayPoints(get(coordinates, 'path', []))
        this.origin = this.toLatLng(get(coordinates, 'path.0', ''))
        this.destination = this.toLatLng(get(coordinates, `path.${coordinates.path.length - 1}`, ''))
        this.totalDistance = get(coordinates, 'total_distance', '')
        this.totalTime = get(coordinates, 'total_time', '')
      },
      toggleIsSubmitted(){
        this.isSubmitted = !this.isSubmitted
      },
      isGetDirectionParamsComplete(){
        return this.origin && this.destination
      },
      getDirection() {
        if(!this.isGetDirectionParamsComplete()){
          return
        }
        
        let directionsServiceRouteParams = {
          origin: this.origin,
          destination: this.destination,
          travelMode: 'DRIVING',
        }

        if (this.waypoints) {
          directionsServiceRouteParams = Object.assign({}, directionsServiceRouteParams, {waypoints: this.waypoints})
        }

        this.directionsService = new google.maps.DirectionsService()
        this.directionsDisplay = new google.maps.DirectionsRenderer()
        this.directionsDisplay.setMap(this.$refs.tanoMap.$mapObject)
        this.directionsService.route(directionsServiceRouteParams, (response, status) => {
          if (status === 'OK') {
            this.directionsDisplay.setDirections(response)
            return
          } 
          console.log('Directions request failed due to ' + status)
        })
      },
      geolocate: function() {
        navigator.geolocation.getCurrentPosition(position => {
          this.center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        })
      },
      async postRoute() {
        let res
        try {
          this.clearErrorMessage()
          res = await axios.post('/route', {
            origin: this.origin,
            destination: this.destination
          })
          if (res.data.token) {
            this.routeToken = res.data.token
            return true
          }
        } catch (error) {
          this.setErrorMessage(get(error, 'response.data', DEFAULT_ERROR_MESSAGE))
        }
      },
      async getRoute() {
        let res
        try {
          this.clearErrorMessage()
          res = await axios.get(`/route/${this.routeToken}`)

          let status = get(res, 'data.status', 'failure')

          if(status === STATUS_SUCCESS){
            this.setDrivingRouteCoordinates(res.data)
            return true
          }

          if (status === STATUS_IN_PROGRESS) {
            return this.getRoute()
          }

          if (status === STATUS_FAILURE) {
            this.setErrorMessage(get(res, 'data.error', DEFAULT_ERROR_MESSAGE))
          }
        } catch (error) {
          this.setErrorMessage(get(error, 'response.data', DEFAULT_ERROR_MESSAGE))
        }
        return false
      },
      async getDrivingRoute() {
        if(!this.isGetDirectionParamsComplete()){
          if(this.useMockedApi){
            alert('Please select origin and drop off point.')
          }
          return
        }
        this.isLoading = true
        if(!this.useMockedApi) {
          this.getDirection()
          this.toggleIsSubmitted()
          this.isLoading = false
          return
        }

        let res = await this.postRoute()
        if(!res) {
          this.isLoading = false
          this.toggleIsSubmitted()
          return
        }

        let getRouteRes = await this.getRoute()
        this.isLoading = false
        if(!this.isSubmitted) {
          this.toggleIsSubmitted()
        }
        if(getRouteRes) {
          this.getDirection()
        }
      }
    }
  }
</script>

<style>
body {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.wrapper {
  margin: 5px;
  height: 90vh;
}

.row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  height: 95vh;
}

.column-70 {
  display: flex;
  flex-direction: column;
  flex-basis: 100%;
  flex: 2.5;
}

.column-30 {
  display: flex;
  flex-direction: column;
  flex-basis: 100%;
  flex: .5;
  margin-right: 3em;
}

.search-wrapper {
  margin-bottom: 3em;
}

.error-wrapper {
  margin-bottom: 1.5em;
}

.error-wrapper > span {
  color: indianred;
}
</style>
