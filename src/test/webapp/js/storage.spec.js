describe("storage", function () {
    beforeEach(function () {
        triplog.storage.removeAllWaypoints();
    });

    afterEach(function () {
        triplog.storage.removeAllTriplogData();
    });

    it("storage is empty", function () {
        expect(triplog.storage.isWaypointStorageEmpty()).toBe(true);
    });

    it("store latLng position", function () {
        var lat1 = 59.0,
            lng1 = 10.0,
            lat2 = 59.1,
            lng2 = 10.1,
            latLng1 = triplog.mapUtil.getLatLngFromCoordinates(lat1, lng1),
            latLng2 = triplog.mapUtil.getLatLngFromCoordinates(lat2, lng2);

        triplog.storage.appendLatLng(latLng1);
        triplog.storage.appendLatLng(latLng2);
        expect(triplog.storage.isWaypointStorageEmpty()).toBe(false);
        expect(triplog.storage.getNrOfWaypoints()).toEqual(2);

        triplog.storage.removeAllWaypoints();
        expect(triplog.storage.isWaypointStorageEmpty()).toBe(true);
    });

    it("get latLng positions", function () {
        var lat1 = 59.0,
            lng1 = 10.0,
            lat2 = 59.1,
            lng2 = 10.1,
            latLng1 = triplog.mapUtil.getLatLngFromCoordinates(lat1, lng1),
            latLng2 = triplog.mapUtil.getLatLngFromCoordinates(lat2, lng2),
            waypoints;

        triplog.storage.appendLatLng(latLng1);
        triplog.storage.appendLatLng(latLng2);
        expect(triplog.storage.isWaypointStorageEmpty()).toBe(false);

        waypoints = triplog.storage.getAllWaypoints();
        expect(waypoints.length).toEqual(2);
        expect(waypoints[0].lat()).toEqual(59.0);
        expect(waypoints[0].lng()).toEqual(10.0);
    });

    it("storeAndGet departure info", function () {
        var address =
                triplog.storage.storeDeparture("Storgata 1, 0001 Oslo, Norway", "01-01-2015", "09:00:00"),
            depInfo = triplog.storage.getDeparture();

        expect(depInfo.address).toEqual("Storgata 1, 0001 Oslo, Norway");
        expect(depInfo.date).toEqual("01-01-2015");
        expect(depInfo.time).toEqual("09:00:00");
    });

});