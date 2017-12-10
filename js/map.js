const GOOGLE_API_KEY = 'AIzaSyAQCG4wcNxQHbYQ9WYstLWVb03HC_lDKeI';
const FS_CLIENT_ID = 'X51LXWV4BDKANESBY1PCWEG2XDDG4FW0PTWFWOGXX0YTO5EL';
const FS_CLIENT_SECRET = 'Q4EWJUPCQM114AESG5VKYLVLGRVZLDFW1OA3KPERTMIP2R02';

var map;
var markers = [];
var data = new ViewModel();

function ViewModel() {
  let self = this;

  self.location = ko.observable('');
  self.query = ko.observable('');
  self.coordinates = ko.observable();
  self.results = ko.observableArray();
  self.activeVenue = ko.observable(null);
  self.filterStr = ko.observable('');
  self.sidebarHidden = ko.observable(false);
  self.filteredResults = ko.computed(function() {
    let filter = self.filterStr().toLowerCase();
    return ko.utils.arrayFilter(self.results(), function(result, index) {
      let hasSubstr = result.name.toLowerCase().indexOf(filter) > -1;
      if (typeof(markers[index]) !== 'undefined') {
        markers[index].setVisible(hasSubstr);
        if (typeof(infoWindow) !== 'undefined'
        && infoWindow.marker === markers[index] && !hasSubstr) {
          infoWindow.close();
          self.activeVenue(null);
        }
      }
      return hasSubstr;
    });
  })
}

// Keeps track of whether sidebar is displayed
function toggleSidebar() {
  data.sidebarHidden(!data.sidebarHidden());
}

// Keeps track of the active selection in the results list
function toggleActive(index) {
  if (data.activeVenue() === index) {
    data.activeVenue(null);
  }
  else {
    data.activeVenue(index);
  }

  google.maps.event.trigger(markers[index], 'click');
}

// Gets coordinates using the Google Geocode API, then calls getVenues
function getData(location, query) {
  data.coordinates(null);

  $.ajax({
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    dataType: 'json',
    data: {
      key: GOOGLE_API_KEY,
      address: location
    },
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

// Gets venue data using the Foursquare API
function getVenues(query) {
  data.results.removeAll();

  if (!data.coordinates()) {
    alert('That location could not be found. Please try modifying it.');
    return;
  }

  $.ajax({
    url: 'https://api.foursquare.com/v2/venues/explore',
    dataType: 'json',
    data: {
      client_id: FS_CLIENT_ID,
      client_secret: FS_CLIENT_SECRET,
      v: '20170801',
      ll: data.coordinates(),
      query: query
    },
    success: function(resp) {
      numOfVenues = resp.response.groups[0].items.length;
      if (numOfVenues === 0) {
        alert('No results found. Please try modifying your search.')
        return;
      }

      for (let i = 0; i < numOfVenues; i++) {
        info = {};
        venue = resp.response.groups[0].items[i].venue;
        info.index = i;
        info.api_id = venue.id;
        info.name = venue.name;
        try {
          info.category = venue.categories[0].pluralName;
        } catch(e) {
          info.category = 'Unknown';
        }
        try {
          info.phone = venue.contact.formattedPhone;
        } catch(e) {}
        try {
          let address = venue.location.formattedAddress;
          info.address = address.join('<br>');
        } catch(e) {}
        try {
          info.coordinates = {
            lat: venue.location.lat,
            lng: venue.location.lng
          };
        } catch(e) {}
        try {
          info.description = resp.response.groups[0].items[i].tips[0].text;
        } catch(e) {}

        data.results.push(info);
        getImage(info.api_id, i);
      }

      addMarkers();
    }
  }).fail(function() {
    alert('Failed to retrieve venue data from Foursquare');
  });
}

// Fetches image from Foursquare and updates data
function getImage(venue_id, index) {
  let url = 'https://api.foursquare.com/v2/venues/' + venue_id + '/photos';
  let params = {
    client_id: FS_CLIENT_ID,
    client_secret: FS_CLIENT_SECRET,
    v: '20170801'
  };
  $.ajax({
    url: url,
    data: params,
    dataType: 'json',
    success: function(resp) {
      try {
        let prefix = resp.response.photos.items[0].prefix;
        let suffix = resp.response.photos.items[0].suffix;
        let image_url = prefix + '300x200' + suffix;
        data.results()[index].image = image_url;
      } catch(e) {}
    }
  }).fail(function() {
    alert('Image request from Foursquare API failed');
  });
}

// Adds new markers for search results
function addMarkers() {
  infoWindow = new google.maps.InfoWindow();
  let bounds = new google.maps.LatLngBounds();

  markers.length = 0;   // Delete old markers

  for (let i = 0; i < data.results().length; i++) {
    let marker = new google.maps.Marker({
      map: map,
      position: data.results()[i].coordinates,
      title: data.results()[i].name,
      animation: google.maps.Animation.DROP
    });
    marker.addListener('click', function() {
      let self = this;
      makeInfoWindow(self, i);
      // makeInfoWindow sets infoWindow.marker equal to null when the active
      // marker is again clicked, so the following if statement will not execute
      if (infoWindow.marker) {
        self.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          self.setAnimation(null);
        }, 700);
      }
    });

    markers.push(marker);
    bounds.extend(marker.position);
  }

  map.fitBounds(bounds);
  google.maps.event.addDomListener(window, 'resize', function() {
    map.fitBounds(bounds);
  });
}

// Populate the infowindow with data and display it
function makeInfoWindow(marker, venueIndex) {
  var content;
  let venue = data.results()[venueIndex];

  if (infoWindow.marker === marker) {
    data.activeVenue(null);
    infoWindow.marker = null;
    infoWindow.close();
    return;
  }

  data.activeVenue(venueIndex);
  infoWindow.marker = marker;

  content = '<p><strong>' + venue.name + '</strong></p><p>' + venue.address + '</p>';
  if (typeof(venue.phone) !== 'undefined') {
    content += '<p>' + venue.phone + '</p>';
  }
  if (typeof(venue.description) !== 'undefined') {
    content += '<p><em>' + venue.description + '</em></p>';
  }
  if (typeof(venue.image) !== 'undefined') {
    content += "<br><img src='" + venue.image + "'>";
  }

  infoWindow.setContent(content);
  infoWindow.addListener('closeclick', function(){
    data.activeVenue(null);
  });
  infoWindow.open(map, marker);

  google.maps.event.addListener(map, "click", function() {
    infoWindow.marker = null;
    data.activeVenue(null);
    infoWindow.close();
  });
}

// Initialize the map and get user location
function initMap() {
  let geocoder = new google.maps.Geocoder;

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13,
    mapTypeControl: false
  });

  getData('new york city', '');

  navigator.geolocation.getCurrentPosition(
    function success(pos) {
      let coordinates = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      geocoder.geocode({location: coordinates}, function(results, status) {
        var address = '';
        if (status === 'OK' && results[0]) {
          address = results[0].formatted_address;
          getData(address, '');
        }
        data.location(address);
      });
      //map.setCenter(coordinates);
    }
  );
}


ko.applyBindings(data);
