/*global $ */

/**
 * Class for handling a trip.
 * Will record a route on Google Map that is used when travelling from A to B.
 * In addition items like purpose, start/stop time and start/stop address is recorded.
 * The user must press the Start button when starting, and Stop button when stopping.
 * Knockout library is used as MVC
 *
 *
 * @constructor
 */
var triplog = triplog || {};

triplog.ViewModel = function () {
    'use strict';
    var viewModel = this,
        map,
        marker,
        lastLatLng = null,
        clockTimerId = null,
        positionTimerId = null,
        isDepTimeUpdated = true,
        isDepAddrUpdated = true,
        isArrTimeUpdated = true,
        isArrAddrUpdated = true,
        state,
        stateEnum = {
            "BEGIN": "begin",
            "STARTED": "started",
            "STOPPED": "stopped"
        };

    viewModel.startButton = ko.observable("Start turen");
    viewModel.stopButton = ko.observable("Stopp turen!");

    viewModel.name = ko.observable("Navn");
    viewModel.purpose = ko.observable("Reiseplan");
    viewModel.travelAbroad = ko.observable(false);

    viewModel.depAddress = ko.observable("Avreise addresse");
    viewModel.depDate = ko.observable("Avreise dato");
    viewModel.depTime = ko.observable("Avreise klokkeslett");

    viewModel.arrAddress = ko.observable("Ankomst addresse");
    viewModel.arrDate = ko.observable("Ankomst dato");
    viewModel.arrTime = ko.observable("Ankomst klokkeslett");

    viewModel.isStartBtnVisible = ko.observable(false);
    viewModel.isStopBtnVisible = ko.observable(false);

    viewModel.isDepartureVisible = ko.observable(true);
    viewModel.isArrivalVisible = ko.observable(false);

    viewModel.initialize = function () {
        console.log("initialize");
        ko.applyBindings(viewModel);

        state = stateEnum.BEGIN;

        if (!triplog.storage.isWaypointStorageEmpty()) {
            viewModel.resumeTrip();
        } else {
            triplog.mapUtil.getPosition(viewModel.show_map); // show_map as callback
        }
    };

    viewModel.start = function () {
        console.log("start");
        state = stateEnum.STARTED;

        viewModel.isDepartureVisible(false);
        viewModel.isArrivalVisible(true);
        viewModel.isStartBtnVisible(false);

        triplog.storage.removeAllTriplogData();
        triplog.storage.storeTripInfo(viewModel.name(), viewModel.purpose(), viewModel.travelAbroad());
        triplog.storage.storeDeparture(viewModel.depAddress(), viewModel.depDate(), viewModel.depTime());
        triplog.storage.appendLatLng(lastLatLng);

        triplog.mapUtil.getPosition(viewModel.show_map);
    };

    viewModel.show_map = function (position) {
        var latLng = triplog.mapUtil.getLatLng(position),
            mapDepCanvas = document.getElementById('map-departure-canvas'),
            mapArrCanvas = document.getElementById('map-arrival-canvas'),
            mapCanvas = state === stateEnum.BEGIN ? mapDepCanvas : mapArrCanvas;

        map = triplog.mapUtil.createMap(latLng, mapCanvas);
        marker = triplog.mapUtil.createMarker(latLng, map);

        if (triplog.storage.getAllWaypoints().length > 1 && state === stateEnum.STARTED) {
            viewModel.drawStoredWaypoints();
        }
        viewModel.startTimers();
    };

    viewModel.startTimers = function () {
        viewModel.stopTimers(); // Stop old timers if any
        viewModel.startClockTimer();
        viewModel.startPositionTimer();
    };

    viewModel.startClockTimer = function () {
        clockTimerId = setInterval(function () {
            viewModel.setTime();
        }, 1000);
    };

    viewModel.startPositionTimer = function () {
        positionTimerId = setInterval(function () {
            triplog.mapUtil.getPosition(viewModel.updatePosition);
        }, 3000);
    };

    viewModel.updatePosition = function (position) {
        console.log("updatePosition");
        var newLatLng = triplog.mapUtil.getLatLng(position);

        map.panTo(newLatLng);
        marker.setPosition(newLatLng);
        triplog.mapUtil.getAddress(newLatLng, viewModel.setAddress);

        if (state === stateEnum.STARTED) {
            triplog.storage.storeTripInfo(viewModel.name(), viewModel.purpose(), viewModel.travelAbroad());
            triplog.storage.storeDeparture(viewModel.depAddress(), viewModel.depDate(), viewModel.depTime());
            triplog.storage.appendLatLng(newLatLng);
            if (lastLatLng !== null) {
                triplog.mapUtil.drawRoute(map, lastLatLng, newLatLng);
            }
        }

        lastLatLng = newLatLng;
    };

    viewModel.setAddress = function (address) {
        if (state === stateEnum.BEGIN && isDepAddrUpdated) {
            viewModel.isStartBtnVisible(true);
            viewModel.depAddress(address);
        } else if (state === stateEnum.STARTED && isArrAddrUpdated) {
            viewModel.isStopBtnVisible(true);
            viewModel.arrAddress(address);
        }
    };

    viewModel.setTime = function () {
        var dateTime = moment(),
            date = dateTime.format("DD-MM-YYYY"),
            time = dateTime.format("HH:mm:ss");

        if (state === stateEnum.BEGIN && isDepTimeUpdated) {
            viewModel.depDate(date);
            viewModel.depTime(time);

        } else if (state === stateEnum.STARTED && isArrTimeUpdated) {
            viewModel.arrDate(date);
            viewModel.arrTime(time);
        }
    };

    viewModel.depTimeChanged = function () {
        isDepTimeUpdated = false;
    };

    viewModel.arrTimeChanged = function () {
        isArrTimeUpdated = false;
    };

    viewModel.depAddrChanged = function () {
        isDepAddrUpdated = false;
    };

    viewModel.arrAddrChanged = function () {
        isArrAddrUpdated = false;
    };

    viewModel.resumeTrip = function () {
        state = stateEnum.STARTED;
        viewModel.name(triplog.storage.getTripInfo().name);
        viewModel.purpose(triplog.storage.getTripInfo().purpose);
        viewModel.travelAbroad(triplog.storage.getTripInfo().travelAbroad);

        viewModel.depAddress(triplog.storage.getDeparture().address);
        viewModel.depDate(triplog.storage.getDeparture().date);
        viewModel.depTime(triplog.storage.getDeparture().time);

        viewModel.isDepartureVisible(false);
        viewModel.isArrivalVisible(true);
        viewModel.isStartBtnVisible(false);

        triplog.mapUtil.getPosition(viewModel.show_map); // show_map as callback
    };

    viewModel.drawStoredWaypoints = function () {
        var waypoints = triplog.storage.getAllWaypoints(),
            lastLatLng = null;

        console.log("draw stored waypoints: " + waypoints.length);

        _.each(waypoints, function (latLng) {
            if (lastLatLng !== null && map !== null) {
                //console.log("lastLatLng: " + lastLatLng);
                //console.log("latLng: " + latLng);
                triplog.mapUtil.drawRoute(map, lastLatLng, latLng);
            }
            lastLatLng = latLng;
        });
    };

    viewModel.stop = function () {
        if (state === stateEnum.STOPPED) {
            return; //Already stopped
        }

        viewModel.stopTimers();
        state = stateEnum.STOPPED;
        console.log("stop");

        console.log("Navn: " + viewModel.name());
        console.log("Purpose: " + viewModel.purpose());
        console.log("TravelAbroad: " + viewModel.travelAbroad());

        console.log("depAddress: " + viewModel.depAddress());
        console.log("depDate: " + viewModel.depDate());
        console.log("depTime: " + viewModel.depTime());

        console.log("arrAddress: " + viewModel.arrAddress());
        console.log("arrDate: " + viewModel.arrDate());
        console.log("arrTime: " + viewModel.arrTime());

        triplog.storage.removeAllTriplogData();
        viewModel.stopButton("Godtatt");
    };

    viewModel.stopTimers = function () {
        if (clockTimerId !== null) {
            clearInterval(clockTimerId);
        }
        if (positionTimerId !== null) {
            clearInterval(positionTimerId);
        }
    };
};

$(document).ready(new triplog.ViewModel().initialize());
