import React, {Component} from 'react'
//import Script from 'react-load-script'
//import {load} from 'little-loader'
//import { withScriptjs, withGoogleMap, GoogleMap, Marker } from "react-google-maps"
import {GOOGLE_API_KEY, FS_CLIENT_ID, FS_CLIENT_SECRET} from '../constants.js'
import '../css/App.css'
import Map from './Map.js'


class App extends Component {
  constructor() {
    super()
    this.state = {
      coordinates: '40.7127753,-74.0059728',
      results: []
    }
    setTimeout(() => {
      console.log(this.state)
    }, 5000)
  }

  componentDidMount() {
    const wait = setInterval(() => {
      if (window.google) {
        clearInterval(wait)
        this.getData('new york city', '')
      }
    }, 100)
  }

  getData(location, query) {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json")
    const params = {key: GOOGLE_API_KEY, address: location}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    fetch(url).then(resp => resp.json())
    .catch(() => alert('Failed to retrieve location coordinates from Google Geocode'))
    .then(resp => {
      try {
        let lat = resp.results[0].geometry.location.lat
        let lng = resp.results[0].geometry.location.lng
        this.setState(
          {coordinates: lat.toString() + ',' + lng.toString()},
          () => this.getVenues(query)
        )
      } catch(e) {
        alert('That location could not be found. Please try modifying it.')
      }
    })
  }

  getVenues(query) {
    const url = new URL("https://api.foursquare.com/v2/venues/explore")
    const params = {
      client_id: FS_CLIENT_ID,
      client_secret: FS_CLIENT_SECRET,
      v: '20170801',
      ll: this.state.coordinates,
      query: query
    }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    fetch(url).then(resp => resp.json())
    .catch(() => alert('Failed to retrieve venue data from Foursquare'))
    .then(resp => {
      const numOfVenues = resp.response.groups[0].items.length
      const results = []

      if (numOfVenues === 0) {
        alert('No results found. Please try modifying your search.')
        return
      }

      for (let i = 0; i < numOfVenues; i++) {
        const info = {}
        const venue = resp.response.groups[0].items[i].venue
        info.index = i
        info.api_id = venue.id
        info.name = venue.name
        try {
          info.category = venue.categories[0].pluralName
        } catch(e) {
          info.category = 'Unknown'
        }
        try {
          info.phone = venue.contact.formattedPhone
        } catch(e) {}
        try {
          let address = venue.location.formattedAddress
          info.address = address.join('<br>')
        } catch(e) {}
        try {
          info.coordinates = {
            lat: venue.location.lat,
            lng: venue.location.lng
          }
        } catch(e) {}
        try {
          info.description = resp.response.groups[0].items[i].tips[0].text
        } catch(e) {}

        results.push(info)
        this.getImage(info.api_id, i)
      }

      this.setState({results: results})
      //this.addMarkers()
    })
  }

  getImage(venue_id, index) {
    const url = new URL("https://api.foursquare.com/v2/venues/" + venue_id + '/photos')
    const params = {
      client_id: FS_CLIENT_ID,
      client_secret: FS_CLIENT_SECRET,
      v: '20170801'
    }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    fetch(url).then(resp => resp.json())
    .catch(() => alert('Image request from Foursquare API failed'))
    .then(resp => {
      try {
        const prefix = resp.response.photos.items[0].prefix
        const suffix = resp.response.photos.items[0].suffix
        const resultsCopy = [...this.state.results]
        const venueCopy = {...resultsCopy[index]}
        venueCopy.image = prefix + '300x200' + suffix
        resultsCopy[index] = venueCopy
        this.setState({results: resultsCopy})
      } catch(e) {}
    })
  }

  render() {
    return (
      <div id="app-container">
        <header>
          <div id='nav-icon-wrapper'>
            <div className='nav-icon'></div>
            <div className='nav-icon'></div>
            <div className='nav-icon'></div>
          </div>
          <img id='logo' src='../img/logo.png' alt='' />
        </header>
        <Map />
      </div>
    )
  }
}


/*
class App extends Component {
  constructor() {
    super()
    this.state = {map: null}
  }

  componentDidMount() {
    const wait = setInterval(() => {
      if (window.google) {
        clearInterval(wait)
        this.createMap()
      }
    }, 100)
  }

  createMap() {
    const geocoder = new google.maps.Geocoder
    const map = new window.google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.7413549, lng: -73.9980244},
      zoom: 13,
      mapTypeControl: false
    })
    this.setState({map: map})
    this.getData('new york city', '')


    navigator.geolocation.getCurrentPosition(
      function success(pos) {
        const coordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }
        geocoder.geocode({location: coordinates}, function(results, status) {
          let address = '';
          if (status === 'OK' && results[0]) {
            address = results[0].formatted_address;
            data.location(address);
            getData(address, '');
          }
        })
        //map.setCenter(coordinates);
      },
      function error() {
        getData('new york city', '');
      }
    )

  }

  getData(location, query) {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/geocode/json"),
      params = {key: GOOGLE_API_KEY, address: location}
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key])
    )
    fetch(url).then(resp => {
      console.log(resp)
    })

      success: function(resp) {
        try {
          let lat = resp.results[0].geometry.location.lat;
          let lng = resp.results[0].geometry.location.lng;
          data.coordinates(lat.toString() + ',' + lng.toString());
        } catch(e) {}

        getVenues(query);
      },
      error: function() {

        navigator.geolocation.getCurrentPosition(
          function success(pos) {
            let coordinates = pos.coords.latitude.toString() + ',' +
                              pos.coords.longitude.toString();
            data.coordinates(coordinates);
            getVenues(query);
          },
          function error() {
            data.coordinates('40.7127753,-74.0059728');
            getVenues(query);
          }
        );

      }
    }).fail(function() {
      alert('Failed to retrieve location coordinates from Google Geocode');
    });

  }

  render() {
    return (
      <div className="header-map-wrapper">
        <header>
          <div id='nav-icon-wrapper'>
            <div className='nav-icon'></div>
            <div className='nav-icon'></div>
            <div className='nav-icon'></div>
          </div>
          <img id='logo' src='../img/logo.png' alt='' />
        </header>
        <div id="map"></div>
      </div>
    )
  }

}
*/


export default App
