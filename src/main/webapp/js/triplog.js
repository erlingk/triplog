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
        lastPosition = null,
        wayPoints = [],
        isDeparture = true,
        clockTimerId = null,
        positionTimerId = null;

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
        triplog.mapUtil.getPosition(viewModel.show_map); // show_map as callback
    };

    viewModel.start = function () {
        console.log("start");
        isDeparture = false;
        wayPoints = [];

        viewModel.isDepartureVisible(isDeparture);
        viewModel.isArrivalVisible(!isDeparture);
        viewModel.isStartBtnVisible(false);

        triplog.mapUtil.getPosition(viewModel.show_map);
    };

    viewModel.show_map = function (position) {
        var latLng = triplog.mapUtil.getLatLng(position),
            mapDepCanvas = document.getElementById('map-departure-canvas'),
            mapArrCanvas = document.getElementById('map-arrival-canvas'),
            mapCanvas = isDeparture ? mapDepCanvas : mapArrCanvas;

        map = triplog.mapUtil.createMap(latLng, mapCanvas);
        marker = triplog.mapUtil.createMarker(latLng, map);

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
        var newPosition = triplog.mapUtil.getLatLng(position);

        wayPoints.push(newPosition);
        map.panTo(newPosition);
        marker.setPosition(newPosition);
        triplog.mapUtil.getAddress(newPosition, viewModel.setAddress);

        if (lastPosition !== null && !isDeparture) {
            triplog.mapUtil.drawRoute(map, lastPosition, newPosition);
        }
        lastPosition = newPosition;
    };

    viewModel.setAddress = function (address) {
        if (isDeparture) {
            viewModel.isStartBtnVisible(true);
            viewModel.depAddress(address);
        } else {
            viewModel.isStopBtnVisible(true);
            viewModel.arrAddress(address);
        }
    };

    viewModel.setTime = function () {
        var dateTime = moment(),
            date = dateTime.format("DD-MM-YYYY"),
            time = dateTime.format("HH:mm:ss");

        if (isDeparture) {
            viewModel.depDate(date);
            viewModel.depTime(time);
        } else {
            viewModel.arrDate(date);
            viewModel.arrTime(time);
        }
    };

    viewModel.stop = function () {
        viewModel.stopTimers();

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

        console.log("Number of waypoints: " + wayPoints.length);

        //viewModel.isDepartureVisible(false);
        //viewModel.isArrivalVisible(true);
        //viewModel.stopButton("Godtatt");
        //viewModel.isStopBtnVisible(false);
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
