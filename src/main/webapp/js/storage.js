var triplog = triplog || {};

/**
 * General storage utils for tripinfo and waypoints, using HTML window.localStorage
 */
triplog.storage = (function () {
    'use strict';
    var isHtmlStorageSupported = function () {
        return typeof(Storage) !== "undefined";
    };

    return {
        /**
         * Check if there are any stored waypoints/coordinates
         * @returns {boolean}
         */
        isWaypointStorageEmpty: function () {
            if (!isHtmlStorageSupported()) {
                return true;
            }

            return localStorage.getItem("triplog.waypoint.length") === null;
        },

        /**
         * Put latitude and longitude coordinates at the end of the stored coordinates list
         * Also update the length/number of coordinates item in storage
         * @param latLng
         */
        appendLatLng: function (latLng) {
            if (!isHtmlStorageSupported() || latLng === null) {
                return;
            }

            var pos = triplog.storage.getNrOfWaypoints(),
                lat = latLng.lat(),
                lng = latLng.lng();

            localStorage.setItem("triplog.waypoint.length", pos + 1);
            localStorage.setItem("triplog.waypoint." + pos + ".lat", lat);
            localStorage.setItem("triplog.waypoint." + pos + ".lng", lng);
        },

        /**
         * Store trip info like name, purpose and travel abroad
         * @param name
         * @param purpose
         * @param travelAbroad
         */
        storeTripInfo: function (name, purpose, travelAbroad) {
            if (!isHtmlStorageSupported()) {
                return;
            }
            var tripInfo = {"name": name, "purpose": purpose, "travelAbroad": travelAbroad};
            localStorage.setItem("triplog.tripInfo", JSON.stringify(tripInfo));
        },

        /**
         * Get trip info like name, purpose and travel abroad
         * @returns {*}
         */
        getTripInfo: function () {
            if (!isHtmlStorageSupported()) {
                return;
            }
            var tripInfo = localStorage.getItem("triplog.tripInfo");
            return JSON.parse(tripInfo);
        },

        /**
         * Store departure info like address, date and time
         * @param address
         * @param date
         * @param time
         */
        storeDeparture: function (address, date, time) {
            if (!isHtmlStorageSupported()) {
                return;
            }
            var depInfo = {"address": address, "date": date, "time": time};
            localStorage.setItem("triplog.depInfo", JSON.stringify(depInfo));
        },

        /**
         * Get departure info like address, date and time
         * @returns {*}
         */
        getDeparture: function () {
            if (!isHtmlStorageSupported()) {
                return;
            }
            var depInfo = localStorage.getItem("triplog.depInfo");
            return JSON.parse(depInfo);
        },

        /**
         * Get all stored waypoints as an array of google Maps LatLng classes
         * @returns {Array}
         */
        getAllWaypoints: function () {
            var i,
                latLng,
                waypoints = [];

            if (!isHtmlStorageSupported() || triplog.storage.isWaypointStorageEmpty()) {
                return waypoints;
            }

            for (i = 0; i < triplog.storage.getNrOfWaypoints(); i++) {
                var lat = localStorage.getItem("triplog.waypoint." + i + ".lat");
                var lng = localStorage.getItem("triplog.waypoint." + i + ".lng");
                latLng = triplog.mapUtil.getLatLngFromCoordinates(lat, lng);
                waypoints.push(latLng);
            }
            return waypoints;
        },

        /**
         * Remove all stored triplog data including all waypoints
         */
        removeAllTriplogData: function () {
            if (!isHtmlStorageSupported()) {
                return;
            }
            var i;
            triplog.storage.removeAllWaypoints();
            localStorage.removeItem("triplog.tripInfo");
            localStorage.removeItem("triplog.depInfo");
            localStorage.removeItem("triplog.arrInfo");
        },

        /**
         * Remove all stored waypoints
         */
        removeAllWaypoints: function () {
            if (!isHtmlStorageSupported()) {
                return;
            }

            var i;
            for (i = 0; i < triplog.storage.getNrOfWaypoints(); i++) {
                localStorage.removeItem("triplog.waypoint." + i + ".lat");
                localStorage.removeItem("triplog.waypoint." + i + ".lng");
            }
            localStorage.removeItem("triplog.waypoint.length");
        },

        /**
         * Get the number of stored waypoints
         * @returns {number}
         */
        getNrOfWaypoints: function () {
            var length = 0;
            if (!isHtmlStorageSupported()) {
                return length;
            }

            if (localStorage.getItem("triplog.waypoint.length") !== null) {
                length = parseInt(localStorage.getItem("triplog.waypoint.length"));
            }
            return length;
        }
    };
}());