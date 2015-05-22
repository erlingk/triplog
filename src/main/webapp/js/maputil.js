/*global */

var triplog = triplog || {};

/**
 * General Map and positioning util functions
 */
triplog.mapUtil = (function () {
    'use strict';

    return {
        /**
         * Get GPS position, using a callback containing latitude and longitude when position is found
         * @param callback
         */
        getPosition: function (callback, errCallback) {
            if (navigator.geolocation) {
                var options = {enableHighAccuracy: true};
                if (typeof errCallback === 'undefined') {
                    errCallback = triplog.mapUtil.logError;
                }
                navigator.geolocation.getCurrentPosition(callback, errCallback, options);
            } else {
                console.log("Geolocation is not supported.");
            }
        },

        /**
         * Create a Google LatLng class based on position containing latitude and longitude
         * @param position, postion containing latitude and longitude
         * @returns {google.maps.LatLng}
         */
        getLatLng: function (position) {
            return triplog.mapUtil.getLatLngFromCoordinates(position.coords.latitude, position.coords.longitude);
        },

        /**
         * Create a Google LatLng class based on latitude and longitude coordinates
         * @param lat
         * @param lng
         * @returns {google.maps.LatLng}
         */
        getLatLngFromCoordinates: function (lat, lng) {
            return new google.maps.LatLng(lat, lng);
        },

        /**
         * Create a Google Map class
         * @param latLng
         * @param mapCanvas, DOM element id that will contain the map
         * @returns {google.maps.Map}
         */
        createMap: function (latLng, mapCanvas) {
            var mapOptions = {
                center: latLng,
                zoom: 14,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            return new google.maps.Map(mapCanvas, mapOptions);
        },

        /**
         * Create a Marker class
         * @param latLng
         * @param map, Google map where marker should be put
         * @returns {google.maps.Marker}
         */
        createMarker: function (latLng, map) {
            return new google.maps.Marker({position: latLng, map: map, title: "You are here!"});
        },

        /**
         * Draw a line between two positions on the map
         * @param map
         * @param lastLatLng
         * @param newLatLng
         */
        drawRoute: function (map, lastLatLng, newLatLng) {
            var coordinates = [
                    lastLatLng,
                    newLatLng
                ],

                path = new google.maps.Polyline({
                    path: coordinates,
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 2
                });

            path.setMap(map);
        },

        /**
         * Get address (street name/nr, postal area and country) based on latLng class
         * Using a callback when the address is found
         * Using google.maps.Geocoder()
         * @param latLng
         * @param callback
         */
        getAddress: function (latLng, callback) {
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'latLng': latLng}, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        var address = results[0].formatted_address;
                        callback(address);
                    } else {
                        console.log("No address found");
                    }
                } else {
                    console.log("Not able to get address from latitude and longitude: " + status);
                }
            });
        },

        /**
         * Get latLng position based on address (street name/nr, postal area and country).
         * Using a callback when the latLng position is found
         * Using google.maps.Geocoder
         * @param latLng
         * @param callback, function called when position is found
         */
        getLatLngFromAddress: function (address, callback) {
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'address': address}, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        var latLng = results[0].geometry.location;
                        callback(latLng);
                    } else {
                        console.log("Latitude and longitude not found");
                    }
                } else {
                    console.log("Not able to get latitude and longitude from address: " + status);
                }
            });
        },

        /**
         * Log different errors returned by navigator.geolocation.getCurrentPosition
         * @param error
         */
        logError: function (error) {
            console.log("error when displaying position on map");
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.log("User denied the request for Geolocation.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    console.log("Location information is unavailable.");
                    break;
                case error.TIMEOUT:
                    console.log("The request to get user location timed out.");
                    break;
                default:
                    console.log("An unknown error occurred.");
            }
        }
    };
}());
