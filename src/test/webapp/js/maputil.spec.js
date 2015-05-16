describe("mapUtil", function() {
    beforeEach(function() {
    });

    it("getLatLng", function () {
        var latitude = 59.95909859999999,
            longitude = 10.6257567,
            latLng = new google.maps.LatLng(latitude, longitude);

        var position = {coords: {longitude: longitude, latitude: latitude}};
        var pos = triplog.mapUtil.getLatLng(position);
        expect(pos).toEqual(latLng);
    });

});