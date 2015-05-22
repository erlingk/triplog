/*global $ */

/**
 * Class for handling a trip.
 * Will record the route on Google Map when travelling from A to B.
 * Items like tripname, purpose, start/stop time and start/stop address is also recorded.
 * The user must press the Start button when starting, and Stop button when stopping.
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
        updateDepTime = true,
        updateDepAddr = true,
        updateArrTime = true,
        updateArrAddr = true,
        state,
        stateEnum = {
            "INIT": "init",
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

        state = stateEnum.INIT;

        if (triplog.storage.isWaypointStorageEmpty()) {
            triplog.mapUtil.getPosition(viewModel.createMap, viewModel.createMapPosNotAvailable); // createMap as callback
        } else {
            // If there are stored waypoints, we will try to resume trip where we left off
            viewModel.resumeTrip();
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

        triplog.mapUtil.getPosition(viewModel.createMap, viewModel.createMapPosNotAvailable);

    };

    viewModel.createMap = function (position) {
        var latLng = triplog.mapUtil.getLatLng(position),
            mapCanvas = state === stateEnum.INIT ? viewModel.getDepCanvas() : viewModel.getArrCanvas();

        console.log("createMap");

        map = triplog.mapUtil.createMap(latLng, mapCanvas);
        marker = triplog.mapUtil.createMarker(latLng, map);

        if (triplog.storage.getAllWaypoints().length > 1 && state === stateEnum.STARTED) {
            viewModel.drawStoredWaypoints();
        }

        viewModel.stopTimers(); // Stop old timers if any
        viewModel.startClockTimer();
        viewModel.startPositionTimer();
    };

    viewModel.createMapPosNotAvailable = function (posError) {
        var latLng = triplog.mapUtil.getLatLngFromCoordinates(51.519670, -0.127348), // London as default
            mapCanvas = state === stateEnum.INIT ? viewModel.getDepCanvas() : viewModel.getArrCanvas(),
            directionString = state === stateEnum.INIT ? "avreise" : "ankomst";

        console.log("createMapPosNotAvailable");
        map = triplog.mapUtil.createMap(latLng, mapCanvas);
        marker = triplog.mapUtil.createMarker(latLng, map);

        viewModel.stopTimers(); // Stop old timers if any
        viewModel.startClockTimer();

        alert("Posisjon ikke tilgjengelig. Vennligst oppdater " + directionString + " addresse manuelt");
        triplog.mapUtil.logError(posError);
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

        if ((state === stateEnum.INIT && !updateDepAddr)) {
            // return if departure address is manually edited
            return;
        }
        if (state === stateEnum.STARTED && !updateArrAddr) {
            // return if arrival address is manually edited
            return;
        }
        if (state === stateEnum.STOPPED) {
            return;
        }

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
        if (state === stateEnum.INIT && updateDepAddr) {
            viewModel.isStartBtnVisible(true);
            viewModel.depAddress(address);
        } else if (state === stateEnum.STARTED && updateArrAddr) {
            viewModel.isStopBtnVisible(true);
            viewModel.arrAddress(address);
        }
    };

    viewModel.setTime = function () {
        var dateTime = moment(),
            date = dateTime.format("DD-MM-YYYY"),
            time = dateTime.format("HH:mm:ss");

        if (state === stateEnum.INIT && updateDepTime) {
            viewModel.depDate(date);
            viewModel.depTime(time);

        } else if (state === stateEnum.STARTED && updateArrTime) {
            viewModel.arrDate(date);
            viewModel.arrTime(time);
        }
    };

    // If time or address is changed manually, we don't want automatically updates anymore
    viewModel.depTimeChangedManually = function () {
        updateDepTime = false;
    };
    viewModel.arrTimeChangedManually = function () {
        updateArrTime = false;
    };
    viewModel.depAddrChangedManually = function () {
        updateDepAddr = false;
    };
    viewModel.arrAddrChangedManually = function () {
        updateArrAddr = false;
    };

    // Called when departure address is changed manually, focus is lost and the editing is regarded as ready
    viewModel.depAddrReady = function () {
        console.log("depAddrReady: " + viewModel.depAddress());
        if (state === stateEnum.INIT) {
            viewModel.isStartBtnVisible(true);
        }
        triplog.mapUtil.getLatLngFromAddress(viewModel.depAddress(), viewModel.updateMap);
    };

    // Called when arrival address is changed manually, focus is lost and the editing is regarded as ready
    viewModel.arrAddrReady = function () {
        console.log("arrAddrReady: " + viewModel.arrAddress());
        if (state === stateEnum.STARTED) {
            viewModel.isStopBtnVisible(true);
        }
        triplog.mapUtil.getLatLngFromAddress(viewModel.arrAddress(), viewModel.updateMap);
    };

    viewModel.updateMap = function (latLng) {
        map.panTo(latLng);
        marker.setPosition(latLng);
        if (lastLatLng !== null && state === stateEnum.STARTED) {
            triplog.mapUtil.drawRoute(map, lastLatLng, latLng);
        }
        lastLatLng = latLng;
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

        triplog.mapUtil.getPosition(viewModel.createMap, viewModel.createMapPosNotAvailable); // createMap as callback
    };

    viewModel.drawStoredWaypoints = function () {
        var waypoints = triplog.storage.getAllWaypoints(),
            lastLatLng = null;

        _.each(waypoints, function (latLng) {
            if (lastLatLng !== null && map !== null) {
                //console.log("lastLatLng: " + lastLatLng);
                //console.log("latLng: " + latLng);
                triplog.mapUtil.drawRoute(map, lastLatLng, latLng);
            }
            lastLatLng = latLng;
        });
    };

    viewModel.getDepCanvas = function () {
        return document.getElementById('map-departure-canvas');
    };

    viewModel.getArrCanvas = function () {
        return document.getElementById('map-arrival-canvas');
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
