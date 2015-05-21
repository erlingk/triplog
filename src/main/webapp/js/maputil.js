/*global */

var triplog = triplog || {};

/**
 * General Map and positioning util functions
 */
triplog.mapUtil = (function () {
    'use strict';

    return {
        /**
         * Get GPS position as latitude and longitude.
         * @param callback, function called when position is found
         */
        getPosition: function (callback) {
            if (navigator.geolocation) {
                var options = {enableHighAccuracy: true};
                navigator.geolocation.getCurrentPosition(callback, triplog.mapUtil.mapError, options);
            } else {
                console.log("Geolocation is not supported.");
            }
        },

        /**
         * Create a Google LatLng class based on position with latitude and longitude
         * @param position, postion as latitude and longitude
         * @returns {google.maps.LatLng}
         */
        getLatLng: function (position) {
            var latitude = position.coords.latitude,
                longitude = position.coords.longitude;
            return new google.maps.LatLng(latitude, longitude);
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
         * Get a full address (street name/nr, postal area and country) based on position
         * @param latLng
         * @param callback, function called when full address is found
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
                }
            });
        },

        /**
         * Map different errors returned by navigator.geolocation.getCurrentPosition
         * @param error
         */
        mapError: function (error) {
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
