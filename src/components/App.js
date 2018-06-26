import React, {Component} from 'react'
//import Script from 'react-load-script'
//import {load} from 'little-loader'
//import { withScriptjs, withGoogleMap, GoogleMap, Marker } from "react-google-maps"
//import sortBy from 'sort-by'
import {GOOGLE_API_KEY, FS_CLIENT_ID, FS_CLIENT_SECRET} from '../constants.js'
import '../css/App.css'
//import Map from './Map.js'
import Navigation from './Navigation.js'


class App extends Component {
  constructor() {
    super()
    this.state = {
      coordinates: '40.7127753,-74.0059728',
      navClassName: 'sidebar',
      map: null,
      infoWindow: null,
      activeVenue: null,
      results: [],
      markers: []
    }
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
    //const geocoder = new window.google.maps.Geocoder
    const map = new window.google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.7413549, lng: -73.9980244},
      zoom: 13,
      mapTypeControl: false
    })
    this.setState({
      map: map,
      infoWindow: new window.google.maps.InfoWindow()
    })
    this.getData('new york city', '')
  }


  getData = (location, query) => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json")
    const params = {key: GOOGLE_API_KEY, address: location}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    this.setState({markers: []})

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
        //this.getImage(info.api_id, i)
      }

      this.setState({results: results})
      this.addMarkers()
    })
  }


  getImage(venue_id, index) {
    if ('image' in this.state.results[index]) {
      this.attachImageToInfoWindow(this.state.results[index].image)
      return
    }
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
      let image
      try {
        const prefix = resp.response.photos.items[0].prefix
        const suffix = resp.response.photos.items[0].suffix
        image = prefix + '300x200' + suffix
        this.setState(state => {
          const resultsCopy = [...state.results]
          resultsCopy[index].image = image
          return {results: resultsCopy}
        })
      } catch(e) {
        image = `${require('../img/placeholder.jpg')}`
        //image = "https://kehilanews.com/wp-content/uploads/2016/08/placeholder-300-200.jpg"
        this.setState(state => {
          const resultsCopy = [...state.results]
          resultsCopy[index].image = image
          return {results: resultsCopy}
        })
      }
      this.attachImageToInfoWindow(image)
    })
  }


  attachImageToInfoWindow(image) {
    const {infoWindow} = this.state
    let content = infoWindow.getContent()
    content = content.substring(0, content.length - '</div></div>'.length)
    content += `<img class='iw-img' src=${image}></div></div>`
    infoWindow.setContent(content)
  }


  addMarkers() {
    const self = this
    const {map, results, infoWindow} = this.state
    const markers = []
    const bounds = new window.google.maps.LatLngBounds()

    for (let i = 0; i < results.length; i++) {
      let marker = new window.google.maps.Marker({
        map: map,
        position: results[i].coordinates,
        title: results[i].name,
        animation: window.google.maps.Animation.DROP
      })

      marker.addListener('click', function() {
        self.makeInfoWindow(this, i)
        // makeInfoWindow sets infoWindow.marker equal to null when the active
        // marker is again clicked, so the following if statement will not execute
        if (infoWindow.marker) {
          this.setAnimation(window.google.maps.Animation.BOUNCE)
          setTimeout(() => {
            this.setAnimation(null)
          }, 700)
        }
      })

      markers.push(marker)
      bounds.extend(marker.position)
    }

    this.setState({markers: markers})
    map.fitBounds(bounds)
    window.google.maps.event.addDomListener(window, 'resize', () => {
      map.fitBounds(bounds)
    })
  }


  makeInfoWindow(marker, venueIndex) {
    let content
    const {map, infoWindow, results} = this.state
    const venue = results[venueIndex]

    if (infoWindow.marker === marker) {
      this.setState({activeVenue: null})
      infoWindow.marker = null
      infoWindow.close()
      return
    }

    this.setState({activeVenue: venueIndex})
    infoWindow.marker = marker
    content = (
      "<div class='iw-content'>" +
      "<h1 class='iw-name'>" + venue.name + '</h1>' +
      "<p class='iw-address'>" + venue.address + '</p>'
    )
    if (typeof(venue.phone) !== 'undefined') {
      content += "<p class='iw-phone'>" + venue.phone + '</p>'
    }
    if (typeof(venue.description) !== 'undefined') {
      content += '<p><em>' + venue.description + '</em></p>'
    }
    content += "<br><div class='iw-img-container'><div class='iw-img-loader'>"
    content += '</div></div></div>'

    infoWindow.setContent(content)
    infoWindow.addListener('closeclick', () => {
      this.setState({activeVenue: null})
    })
    infoWindow.open(map, marker)

    this.getImage(venue.api_id, venue.index)

    window.google.maps.event.addListener(map, "click", () => {
      infoWindow.marker = null
      this.setState({activeVenue: null})
      infoWindow.close()
    })
  }


  toggleNavClassName = () => {
    if (this.state.navClassName === 'sidebar') {
      this.setState({navClassName: 'sidebar collapsed'})
    } else {
      this.setState({navClassName: 'sidebar'})
    }
  }


  toggleActive = index => {
    if (this.state.activeVenue === index) {
      this.setState({activeVenue: null})
    } else {
      this.setState({activeVenue: index})
    }
    window.google.maps.event.trigger(this.state.markers[index], 'click')
  }


  render() {
    const wrapperStyle = {
      position: 'absolute',
      height: '100%',
      bottom: 0,
      right: 0,
      left: 0
    }
    const mapStyle = {
      height: '92%',
      zIndex: 3
    }
    return (
      <div id="app-container">
        <Navigation
          navClassName={this.state.navClassName} results={this.state.results}
          activeVenue={this.state.activeVenue} toggleActive={this.toggleActive}
          markers={this.state.markers} getData={this.getData}
        />
        <div id="header-map-wrapper" style={wrapperStyle}>
          <header>
            <div id='nav-icon-wrapper' onClick={this.toggleNavClassName}>
              <div className='nav-icon'></div>
              <div className='nav-icon'></div>
              <div className='nav-icon'></div>
            </div>
            <img id='logo' src={require('../img/logo.png')} alt='' />
          </header>
          <div id="map" role="application" style={mapStyle}></div>
        </div>
      </div>
    )
  }
}


export default App
