/*global $ */

var triplog = triplog || {};

triplog.ViewModel = function () {
    'use strict';
    var viewModel = this,
        map,
        marker,
        lastPosition = null,
        isDeparture = true,
        timerId = null;

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

    viewModel.isStartBtnVisible = ko.observable(true);
    viewModel.isStopBtnVisible = ko.observable(false);

    viewModel.isDepartureVisible = ko.observable(true);
    viewModel.isArrivalVisible = ko.observable(false);

    viewModel.initialize = function () {
        console.log("ready");
        ko.applyBindings(viewModel);
        viewModel.getPosition(viewModel.show_map, viewModel.map_error);
    };

    viewModel.getPosition = function (success, err) {
        if (navigator.geolocation) {
            var options = {enableHighAccuracy: true};
            navigator.geolocation.getCurrentPosition(success, err, options);
        } else {
            console.log("Geolocation is not supported.");
        }
    };

    viewModel.start = function () {
        console.log("departure address: " + viewModel.depAddress());
        isDeparture = false;
        viewModel.isDepartureVisible(isDeparture);
        viewModel.isArrivalVisible(!isDeparture);

        viewModel.isStartBtnVisible(false);
        viewModel.isStopBtnVisible(true);
        if (timerId !== null) {
            clearInterval(timerId);
        }

        viewModel.getPosition(viewModel.show_map, viewModel.map_error);
    };

    viewModel.show_map = function (position) {
        console.log("show map: " + position.coords.latitude);
        var latitude = position.coords.latitude,
            longitude = position.coords.longitude,
            latLng = new google.maps.LatLng(latitude, longitude),
            mapDepCanvas = document.getElementById('map-departure-canvas'),
            mapArrCanvas = document.getElementById('map-arrival-canvas'),
            mapCanvas = isDeparture ? mapDepCanvas : mapArrCanvas,
            mapOptions = {
                center: latLng,
                zoom: 14,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };


        map = new google.maps.Map(mapCanvas, mapOptions);
        marker = new google.maps.Marker({position: latLng, map: map, title: "You are here!"});

        timerId = setInterval(function () {
            viewModel.updateTime();
            viewModel.getPosition(viewModel.updatePosition, viewModel.map_error);
        }, 1000);
    };

    viewModel.updatePosition = function (position) {
        console.log("update lat: " + position.coords.latitude);
        var latitude = position.coords.latitude,
            longitude = position.coords.longitude,
            latLng = new google.maps.LatLng(latitude, longitude);


        marker.setPosition(latLng);
        viewModel.getAddress(latLng);

        if (lastPosition !== null && !isDeparture) {
            viewModel.drawRoute(latLng);
        }
        lastPosition = latLng;
    };

    viewModel.drawRoute = function (latLng) {
        var coordinates = [
                lastPosition,
                latLng
            ],

            path = new google.maps.Polyline({
                path: coordinates,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });

        path.setMap(map);
    };

    viewModel.getAddress = function (latLng) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'latLng': latLng}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    if (isDeparture) {
                        viewModel.depAddress(results[0].formatted_address);
                    } else {
                        viewModel.arrAddress(results[0].formatted_address);
                    }
                } else {
                    console.log("No address found");
                }
            }
        });
    };

    viewModel.updateTime = function () {
        var dateTime = moment(),
            date = dateTime.format("MM-DD-YYYY"),
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
        console.log("arrival address: " + viewModel.arrAddress());
        viewModel.isDepartureVisible(false);
        viewModel.isArrivalVisible(true);
        viewModel.stopButton("Godtatt");
        if (timerId !== null) {
            clearInterval(timerId);
        }
    };

    viewModel.map_error = function (error) {
        console.log("show map");

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
    };
};

$(document).ready(new triplog.ViewModel().initialize());
