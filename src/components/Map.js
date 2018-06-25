import React, {Component} from 'react'
import {withScriptjs, withGoogleMap, GoogleMap} from 'react-google-maps'


class Map extends Component {
  render() {
    const GoogleMapInstance = withScriptjs(withGoogleMap(props => (
      <GoogleMap
        defaultCenter = {{lat: 40.756795, lng: -73.954298}}
        defaultZoom = {13}
      >
      </GoogleMap>
    )))
    const wrapperStyle = {
      position: 'absolute',
      height: '92%',
      bottom: 0,
      right: 0,
      left: 0
    }
    const mapStyle = {
      height: '100%',
      zIndex: 3
    }
    return (
      <GoogleMapInstance
        googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyAQCG4wcNxQHbYQ9WYstLWVb03HC_lDKeI&v=3"
        loadingElement={ <div style={mapStyle} /> }
        containerElement={ <div style={wrapperStyle} /> }
        mapElement={ <div role="application" style={mapStyle} /> }
      />
    )
  }
}


export default Map
