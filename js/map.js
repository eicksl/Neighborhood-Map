$(document).ready(function() {
  $('#nav-icon-wrapper').click(function() {
    $('.sidebar').toggleClass('collapsed');
  });
});

const GOOGLE_API_KEY = 'AIzaSyAQCG4wcNxQHbYQ9WYstLWVb03HC_lDKeI';
const FS_CLIENT_ID = 'X51LXWV4BDKANESBY1PCWEG2XDDG4FW0PTWFWOGXX0YTO5EL';
const FS_CLIENT_SECRET = 'Q4EWJUPCQM114AESG5VKYLVLGRVZLDFW1OA3KPERTMIP2R02';

let data = {
  coordinates: ko.observable(),
  results: ko.observableArray()
};

function submitForm() {
  let location = $('#location').val();
  let query = $('#query').val();
  getData(location, query);
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
  });

}

// Gets venue data using the Foursquare API
function getVenues(query) {

  console.log(data.coordinates());
  console.log(query);

  //data.results = [];
  data.results.removeAll();

  if (!data.coordinates()) {
    alert('An error occurred while processing the request');
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
      if (resp.meta.code !== 200) {
        return;
      }
      numOfVenues = resp.response.groups[0].items.length;
      if (numOfVenues === 0) {
        return;
      }

      for (i = 0; i < numOfVenues; i++) {
        info = {};
        venue = resp.response.groups[0].items[i].venue;
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
      }

      //ko.mapping.fromJS(data, vm);
      //vm = ko.mapping.fromJS(data);
    }
  });

}

let map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13
  });
}

//ko.applyBindings(data);
//getData('new york city', 'sushi');

//navigator.geolocation.getCurrentPosition(function(position) {
//  console.log(position);
//});
