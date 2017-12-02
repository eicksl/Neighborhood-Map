const GOOGLE_API_KEY = 'AIzaSyAQCG4wcNxQHbYQ9WYstLWVb03HC_lDKeI';
const FS_CLIENT_ID = 'X51LXWV4BDKANESBY1PCWEG2XDDG4FW0PTWFWOGXX0YTO5EL';
const FS_CLIENT_SECRET = 'Q4EWJUPCQM114AESG5VKYLVLGRVZLDFW1OA3KPERTMIP2R02';

var data = [];

function getCoordinates(location) {
  $.ajax({
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    dataType: 'json',
    data: {
      key: GOOGLE_API_KEY,
      address: location
    },
    success: function(resp) {
      var lat = resp.results[0].geometry.location.lat;
      var lng = resp.results[0].geometry.location.lng;
      //data.push({coordinates: lat.toString() + ',' + lng.toString()});
      if (!lat) {
        return null;
      }
      else {
        return lat.toString() + ',' + lng.toString();
      }
    }
  }).fail(function() {
    //data.push({coordinates: 'Not found'});
    return null;
  });
}

function getVenues(query, location) {

  results = [];
  coordinates = getCoordinates(location);

  if (!coordinates) {
    return null;
  }

  $.ajax({
    url: 'https://api.foursquare.com/v2/venues/explore',
    dataType: 'json',
    data: {
      client_id: FS_CLIENT_ID,
      client_secret: FS_CLIENT_SECRET,
      v: '20170801',
      ll: coordinates,
      query: query
    },
    success: function(resp) {
      if (resp.meta.code !== 200) {
        return null;
      }
      numOfVenues = resp.response.groups[0].items.length;
      if (numOfVenues === 0) {
        return null;
      }
      for (i = 0; i < numOfVenues; i++) {
        info = {};
        venue = resp.response.groups[0].items[i].venue;
        info.api_id = venue.id;
        info.name = venue.name;
        //info.category = venue.category[0].pluralName
      }
    }
  });

}
