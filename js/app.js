var map;
var bounds;
var infoWindow;

// Data Model
var LocationsData = [{
    title: "St. Patrick's Cathedral (Manhattan)",
    location: {
        lat: 40.7584653,
        lng: -73.9759927
    }
}, {
    title: "Saint Thomas Church (Manhattan)",
    location: {
        lat: 40.7608247,
        lng: -73.9763978
    }
}, {
    title: "Redeemer Presbyterian Church (New York City)",
    location: {
        lat: 40.7567958,
        lng: -73.9821119
    }
}, {
    title: "St. Bartholomew's Episcopal Church (Manhattan)",
    location: {
        lat: 40.7574311,
        lng: -73.973333
    }
}, {
    title: "Saint Malachy's Roman Catholic Church",
    location: {
        lat: 40.761484,
        lng: -73.985602
    }
}, {
    title: "Times Square Church",
    location: {
        lat: 40.7623764,
        lng: -73.984181
    }
}, {
    title: "Fifth Avenue Presbyterian Church",
    location: {
        lat: 40.7699132,
        lng: -73.985153
    }
}, {
    title: "St. Paul the Apostle Church (Manhattan)",
    location: {
        lat: 40.7492292,
        lng: -73.9814258
    }
}];

var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var labelIndex = 0;

function initMap() {
    /* source for styles: Google Maps API -- Udacity Course -- Project */
    var styles = [{
        featureType: 'water',
        stylers: [{
            color: '#19a0d8'
        }]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.stroke',
        stylers: [{
            color: '#ffffff'
        }, {
            weight: 6
        }]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [{
            color: '#e85113'
        }]
    }, {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{
            color: '#efe9e4'
        }, {
            lightness: -40
        }]
    }, {
        featureType: 'transit.station',
        stylers: [{
            weight: 9
        }, {
            hue: '#e85113'
        }]
    }, {
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [{
            visibility: 'off'
        }]
    }, {
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [{
            color: '#efe9e4'
        }, {
            lightness: -25
        }]
    }];
    // Build the Google Map object
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.75874,
            lng: -73.978674
        },
        zoom: 14,
        styles: styles,
        mapTypeControl: false
    });
    infoWindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();
    ko.applyBindings(new ViewModel());
}

var ViewModel = function() {
    var self = this;
    self.viewList = ko.observableArray(LocationsData);
    self.query = ko.observable('');

    self.viewList().forEach(function(item) {
        var marker = new google.maps.Marker({
            position: item.location,
            title: item.title,
            map: map,
            label: labels[labelIndex++ % labels.length],
            animation: google.maps.Animation.DROP,
            icon: 'img/church2.png' /* image from https://mapicons.mapsmarker.com - by matthias.stasiak*/
        });
        item.marker = marker;
        bounds.extend(marker.position);
        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function(event) {
            var marker = this;
            var content;
            loadWikiData(marker); /* Call is executed inside marker's click event */

            marker.setAnimation(google.maps.Animation.BOUNCE);
            stopAnimation(marker);
        });

        self.animateMarker = function(item) {
            google.maps.event.trigger(item.marker, 'click');
        };

    });

    window.onresize = function() {
        map.fitBounds(bounds);
    };

    self.search = ko.computed(function() {
        return ko.utils.arrayFilter(self.viewList(), function(
            location) {
            var match = location.title.toLowerCase().indexOf(
                self.query().toLowerCase()) >= 0;
            location.marker.setVisible(match);
            return match;
        });
    });

    /* Marker Bounce TimeOut Function stops bouncing after TWO bounce */
    function stopAnimation(marker) {
        setTimeout(function() {
            marker.setAnimation(null);
        }, 1400);
    }

    /* Function that manages the list view and centering on mobile devices.
     source: http://stackoverflow.com/questions/19291873/window-width-not-the-same-as-media-query */
    if (window.matchMedia('(max-width: 736px)').matches) {
        self.isActive = ko.observable(true);
    } else {
        self.isActive = ko.observable(false);
    }
    /*Control the list while resizing */
    $(window).on('resize', function() {
        if (window.matchMedia('(max-width: 736px)').matches) {
            self.isActive(true);
        } else {
            self.isActive(false);
        }
    });

    /* source: http://stackoverflow.com/questions/23385937/knockout-toggle-active-class-on-click */
    self.toggleActive = function() {
        self.isActive(!self.isActive());
    };
};

/* Wikipedia API */
function loadWikiData(marker) {

    var wikiUrl = "https://en.wikipedia.org/w/api.php";
    wikiUrl += '?' + $.param({
        'action': "query",
        'titles': marker.title,
        'format': "json",
        'prop': "extracts|pageimages",
        'exsentences': 1,
        'callback': 'wikiCallback'
    });

    var wikiTitle, wikiExtract, wikiImgSrc, wikiURL, content;


    // Error handling when Wiki API fails
    var wikiErrorMessage = '';
    var wikiRequestTimeout = setTimeout(function() {
        wikiErrorMessage = 'Error. Wiki API cannot be reached and information cannot be displayed';
        console.log(wikiErrorMessage);
        content = '<div>' + wikiErrorMessage + '</div>';
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    }, 2000);

    $.ajax(wikiUrl, {
        dataType: 'jsonp',
        success: function(data) {
            var pages = data.query.pages;


            $.map(pages, function(page) {
                wikiTitle = page.title;
                if (page.extract) {
                    wikiExtract = page.extract;
                } else {
                    wikiExtract = 'No snippets - cf link above';
                }
                if (page.thumbnail) {
                    wikiImgSrc = page.thumbnail.source;
                } else {
                    /* if thumbnail does not exist (no image on the Wiki Page) */
                    wikiImgSrc = 'ERROR';
                }
                wikiURL = 'https://en.wikipedia.org/wiki/' + page.title;
            });
            clearTimeout(wikiRequestTimeout);

            content = '<h3><a href="' + wikiURL +
                '" target="_blank">' + wikiTitle +
                '</a></h3>' + '<div><img src=' + wikiImgSrc +
                ' alt="NO IMAGE TO DISPLAY"></div>' +
                '<div>' + wikiExtract + '</div>';

            infoWindow.setContent(content);
            infoWindow.open(map, marker);
        }
    });

}

// Error handling: if the browser has trouble to load google map, display error message
function googleMapsApiErrorHandler() {
    window.alert("Something went wrong loading Google Maps. Please try reload your page or Try again later!");
    console.log("Something went wrong loading Google Maps. Please try reload your page or Try again later!");
}